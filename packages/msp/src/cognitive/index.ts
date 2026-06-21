/**
 * Cognitive Layer — one-line memoryOS entry point.
 */

import { join, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

import {
  MemoryStore,
  HotfixStore,
  type GraphBackend,
  type RetrievalOptions,
  retain as gksRetain,
  verifyFlow,
  renderByTier,
  type ResolutionTier,
} from '@freshair129/gks'

import { runTask as runCodegenTask } from '../codegen/runner.js'
import { createSlmClient } from '../codegen/slm/factory.js'
import { createMspMcpServer } from '../mcp/server.js'
import { makeContext, makeResource, makeSubject } from '../policy/types.js'
import { loadPolicies } from '../policy/loader.js'
import { evaluatePolicy } from '../policy/pdp.js'
import { logShadowDecision } from '../policy/shadow-log.js'
import { handleEscalation } from '../policy/escalation.js'
import { enforcePolicy } from '../policy/pep.js'
import { runNexusmind } from './nexusmind.js'
import { recall as mspRecall } from '../orchestrator/retrieval/index.js'

import { ftsSearch } from './fts.js'
import { markAuditOnly } from './audit-only.js'
import { enforceScaleGate } from './scale-gate.js'
import { resolveSSOT } from './ssot.js'
import {
  ScaleLevelGateError,
  type AtomCitation,
  type CognitiveLayer,
  type CognitiveLayerOptions,
  type CognitiveRecallHit,
  type CognitiveRecallResult,
  type CognitiveRunTaskOptions,
  type PolicyContext,
  type RememberOptions,
  type EscalationRequest,
  type EscalationResult,
  type ExpandRequest,
  type ExpandResult,
} from './types.js'

export async function createCognitiveLayer(
  opts: CognitiveLayerOptions,
): Promise<CognitiveLayer> {
  const root = resolve(opts.root)

  const memOpts = {
    root,
    ...(opts.defaultNamespace ? { defaultNamespace: opts.defaultNamespace } : {}),
    ...(opts.graphBackend
      ? {
          graphBackend:
            typeof opts.graphBackend === 'function'
              ? async () =>
                  (opts.graphBackend as (root: string) => Promise<GraphBackend> | GraphBackend)(
                    root,
                  )
              : opts.graphBackend,
        }
      : {}),
    ...(opts.embedder ? { embedder: opts.embedder } : {}),
  }
  const store = new MemoryStore(memOpts)
  await store.init()

  const hotfixStore = new HotfixStore({ root })

  const policiesDir = join(root, 'policies')
  const policySet = await loadPolicies(policiesDir)

  return {
    store,
    graph: store.graph,

    async recall(
      query: string,
      retrievalOpts: RetrievalOptions & PolicyContext = {},
    ): Promise<CognitiveRecallResult> {
      const subject = retrievalOpts.subject ?? makeSubject('user', 'anonymous')
      const action = retrievalOpts.action ?? 'recall'
      const context = retrievalOpts.context ?? makeContext('internal', 'system-recall')

      console.debug(`[ucf] 4-tuple: facade.recall | sub:${subject.id} | act:${action} | trace:${context.trace_id}`)

      const result = await mspRecall({
        query,
        root,
        namespace: opts.defaultNamespace?.tenant_id,
        topK: retrievalOpts.topK,
        subject,
        context,
        embedder: await store.embedder(),
        vectorBackend: await store.getVectorStore('atomic'),
      })

      let thinkingLevel = 2
      if (retrievalOpts.thinkingLevel !== undefined) {
        thinkingLevel = retrievalOpts.thinkingLevel
      } else if (subject.attributes?.tier === 'T1') {
        thinkingLevel = 1
      } else if (subject.attributes?.tier === 'T2') {
        thinkingLevel = 3
      } else if (subject.attributes?.tier === 'T3') {
        thinkingLevel = 5
      }

      const seedIds = result.hits.map((h) => h.atomId)
      const vectorScores = new Map<string, number>(result.hits.map((h) => [h.atomId, h.score]))
      
      const nexus = await runNexusmind(store, seedIds, thinkingLevel, { vectorScores })

      // Handle Epistemic State Shifts (ADR--NEXUSMIND-EPISTEMIC-TRANSITIONS).
      // Recall is a read path: dedup against the existing inbound queue so
      // repeated recalls over the same atom don't flood human review with
      // duplicate State-Shift proposals (one pending proposal per atom).
      if (nexus.stateShifts.length > 0) {
        const pending = new Set((await store.listInbound()).map((c) => c.proposed_id))
        for (const shift of nexus.stateShifts) {
          if (pending.has(shift.id)) continue
          pending.add(shift.id)
          await store.proposeInbound({
            proposed_id: shift.id,
            type: 'audit',
            phase: 6,
            title: `State Shift Proposal for ${shift.id}`,
            body: `K-Impact: ${shift.kImpact.toFixed(3)}\nFrom: ${shift.from}\nTo: ${shift.to}\n\nSuggested by Nexusmind N5 thinking level.`,
            reason: `Nexusmind detected K-Impact variance (${shift.kImpact.toFixed(3)}) suggesting status update from ${shift.from} to ${shift.to}.`,
            source_session: context.trace_id,
          })
        }
      }

      const finalHits: CognitiveRecallHit[] = []

      for (const h of result.hits) {
        const note = await store.lookup(h.atomId)
        const tier = nexus.tiers.get(h.atomId) ?? 'FULL'
        const hit: CognitiveRecallHit = {
          id: h.atomId,
          atomId: h.atomId,
          source: h.source === 'gks-vector' ? 'vector' : (h.source as any),
          score: h.score,
          snippet: note ? renderByTier(note, tier) : h.snippet ?? '',
          metadata: {
            ...h.attributes,
            perSourceRanks: h.perSourceRanks,
            tier,
            informationValue: nexus.informationValues.get(h.atomId),
          },
        }
        finalHits.push(markAuditOnly(hit))
      }

      for (const expandedId of nexus.expandedIds) {
        if (seedIds.includes(expandedId)) continue
        const note = await store.lookup(expandedId)
        if (note) {
          const tier = nexus.tiers.get(expandedId) ?? 'FULL'
          const hit: CognitiveRecallHit = {
            id: note.id,
            atomId: note.id,
            source: 'atomic',
            score: (nexus.informationValues.get(note.id) ?? 0.5) * 0.9,
            snippet: renderByTier(note, tier),
            metadata: {
              phase: note.phase,
              type: note.type,
              status: note.status,
              tier,
              informationValue: nexus.informationValues.get(note.id),
            },
          }
          finalHits.push(markAuditOnly(hit))
        }
      }

      finalHits.sort((a, b) => b.score - a.score)

      return {
        query,
        hits: finalHits,
        strategy: 'multi',
        tookMs: result.timings.fusion,
        fallback_reasons: result.fallback_reasons,
        stateShifts: nexus.stateShifts,
      }
    },

    async remember(
      content: string,
      rOpts: RememberOptions & PolicyContext = {},
    ): Promise<{ id: string }> {
      const subject = rOpts.subject ?? makeSubject('user', 'anonymous')
      const action = rOpts.action ?? 'write'
      const context = rOpts.context ?? makeContext('internal', 'system-remember')

      console.debug(`[ucf] 4-tuple: remember | sub:${subject.id} | act:${action} | trace:${context.trace_id}`)

      const result = await gksRetain(store, {
        content,
        metadata: {
          ...(rOpts.metadata ?? {}),
          ...(rOpts.tags ? { tags: rOpts.tags } : {}),
          attributes: subject.attributes,
        },
      })
      return { id: result.vectorDocId ?? result.inboundPath ?? '' }
    },

    async escalate(req: EscalationRequest): Promise<EscalationResult> {
      return handleEscalation(req, {
        root,
        currentScope: { needs: [], nice_to_have: [], excludes: [] },
        subjectId: 'anonymous-subagent',
      })
    },

    async expand(req: ExpandRequest, pOpts?: PolicyContext): Promise<ExpandResult> {
      const subject = pOpts?.subject ?? makeSubject('user', 'anonymous')
      const action = pOpts?.action ?? 'read'
      const context = pOpts?.context ?? makeContext('internal', 'system-expand')
      const targetTier = req.to ?? 'FULL'

      const atom = await store.lookup(req.id)
      if (!atom) {
        throw new Error(`expand: atom not found: ${req.id}`)
      }

      // Read full body first to allow content-based policy checks (UCF Phase 4).
      // atom.path is repo-root-relative (re-indexer.ts) — resolve against root,
      // do NOT prepend 'gks/' (that double-prefixes and ENOENTs).
      const absPath = resolve(root, atom.path)
      const raw = await readFile(absPath, 'utf8')
      const body = raw.split('\n---').pop()?.trim() ?? ''

      const resource = makeResource('atom', req.id, {}, { ...((atom.attributes as any) ?? {}), body })
      const { permitted, decision } = await enforcePolicy(resource, { root, subject, action, context })

      if (!permitted) {
        return {
          id: req.id,
          tier: 'MENTION',
          denied_reason: decision.reasoning[0]?.description ?? 'Denied by policy',
        }
      }

      const hit: ExpandResult = {
        id: req.id,
        body,
        tier: targetTier,
      }
      return hit
    },

    async consolidate(sessionId: string): Promise<void> {
      if (!sessionId) throw new Error('consolidate: sessionId is required')
    },

    async runTask(taskPath: string, runOpts: CognitiveRunTaskOptions = {}) {
      const { loadTask } = await import('../codegen/load-task.js')
      const task = await loadTask(resolve(taskPath))

      const subject = runOpts.subject ?? makeSubject('subagent', task.id, { scope: task.scope ?? { needs: [], nice_to_have: [], excludes: [] } })
      const action = runOpts.action ?? 'expose-to-llm'
      const context = runOpts.context ?? makeContext('internal', `task-${task.id}-${Date.now()}`)

      console.debug(
        `[ucf] 4-tuple: runTask | sub:${subject.id} | act:${action} | trace:${context.trace_id}`,
      )

      // Phase 1: Shadow PEP (Task Level)
      const resource = makeResource('context-slot', 'run-task-execution')
      const decision = evaluatePolicy(subject, resource, action, context, policySet)

      const logPath = join(root, '.brain', 'msp', 'audit', 'shadow-policy.jsonl')
      await logShadowDecision(
        {
          trace_id: context.trace_id,
          subject,
          resource,
          action,
          context,
          decision,
          policy_version: policySet.version,
        },
        logPath,
      )

      if (decision.effect === 'deny') {
        console.warn(`[ucf] shadow-deny: runTask would have been denied for ${subject.id}`)
      }

      const scale = runOpts.scale ?? 'L2'

      if (scale !== 'L1') {
        await enforceScaleGate({ root, blueprintId: task.parent_blueprint, scale })
      }

      const tier = runOpts.tier ?? opts.slm?.tier ?? 'T1'
      const provider =
        runOpts.slmClient
          ? undefined
          : opts.slm?.provider ?? tierProvider(tier)
      const slmClient =
        runOpts.slmClient ??
        createSlmClient({
          ...(provider ? { provider } : {}),
          ...(opts.slm?.model ? { ollama: { model: opts.slm.model } } : {}),
          ...(opts.slm?.factory ?? {}),
        })

      return runCodegenTask(resolve(taskPath), {
        ...runOpts,
        slmClient,
      })
    },

    async verifyFlow(featId: string) {
      const entries = store.atomic.filter({})
      const byId = new Map(entries.map((e) => [e.id, e]))
      return verifyFlow(featId, byId)
    },

    resolveSSOT(citations: AtomCitation[]) {
      return resolveSSOT(citations)
    },

    hotfix: {
      open(args) {
        return hotfixStore.open({ commitSha: args.sha, title: args.reason, reason: args.reason })
      },
      close(sha: string) {
        return hotfixStore.close(`HOTFIX--${sha.toUpperCase().slice(0, 7)}`, [])
      },
      list() {
        return hotfixStore.list()
      },
      check() {
        return hotfixStore.listOverdue()
      },
    },

    mcpServer() {
      return createMspMcpServer({ root })
    },
  }
}

function tierProvider(tier: 'T1' | 'T2' | 'T3'): 'ollama' | 'gemini' | 'mock' {
  if (tier === 'T1') return 'ollama'
  if (tier === 'T2') return 'gemini'
  return 'mock'
}

export type {
  CognitiveLayer,
  CognitiveLayerOptions,
  CognitiveRecallHit,
  CognitiveRecallResult,
  CognitiveRunTaskOptions,
  CognitiveTier,
  ScaleLevel,
  EscalationRequest,
  EscalationResult,
} from './types.js'
export { ScaleLevelGateError } from './types.js'
export { resolveSSOT } from './ssot.js'
export { markAuditOnly } from './audit-only.js'
export { enforceScaleGate } from './scale-gate.js'
export { ftsSearch } from './fts.js'
export {
  buildAutoGeneratedMarker,
  composeWithMarker,
  bodyContainsMarker,
  AUTO_GENERATED_MARKER_TAG,
} from './compose.js'
