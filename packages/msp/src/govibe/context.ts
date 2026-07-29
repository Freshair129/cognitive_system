import { promises as fs } from 'node:fs'
import path from 'node:path'

import { GraphStore, gksLayout } from '@freshair129/gks'
import { globalRoot } from '../brain/global-vault.js'
import { sha256 } from './canonical.js'
import { isInside, resolveWorkspaceRoot } from './paths.js'

export type GoVibeMode = 'covibe' | 'codev'

interface StateMetadata {
  key?: unknown
  scope?: unknown
  privacy?: unknown
  promoted?: unknown
  redacted?: unknown
}
export interface StateReference {
  key: string
  scope: string
  source: 'global' | 'workspace'
  ref: string
  source_hash: string
  privacy?: 'private'
  promoted?: true
  redacted?: true
}

const STATE_SCOPES = new Set(['identity', 'security', 'project', 'session', 'agent', 'private_memory'])

export interface ContextResolution {
  schema: 'govibe-context-fragment/v1'
  global_state_refs: StateReference[]
  workspace_state_refs: StateReference[]
  knowledge_refs: Array<{ ref: string; source_hash: string }>
  policy_decisions: Array<{ decision: 'allow' | 'deny' | 'shadow'; ref: string; reason: string }>
  diagnostics: string[]
}

async function listJsonFiles(root: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(entry.parentPath, entry.name))
      .sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function readStateRefs(
  root: string,
  source: 'global' | 'workspace',
  keys: Set<string> | undefined,
  diagnostics: string[],
): Promise<StateReference[]> {
  const refs: StateReference[] = []
  try {
    const stat = await fs.stat(root)
    if (!stat.isDirectory()) {
      diagnostics.push(`${source} state root is not a directory: ${root}`)
      return refs
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      diagnostics.push(`${source} state root is missing: ${root}`)
      return refs
    }
    throw error
  }
  for (const file of await listJsonFiles(root)) {
    const realFile = await fs.realpath(file)
    const realRoot = await fs.realpath(root)
    if (!isInside(realRoot, realFile)) {
      diagnostics.push(`${source} state skipped symlink escape: ${file}`)
      continue
    }
    try {
      const bytes = await fs.readFile(realFile)
      const metadata = JSON.parse(bytes.toString('utf8')) as StateMetadata
      const key = typeof metadata.key === 'string'
        ? metadata.key
        : path.basename(file, path.extname(file))
      if (keys && !keys.has(key)) continue
      if (typeof metadata.scope !== 'string' || !STATE_SCOPES.has(metadata.scope)) {
        diagnostics.push(`${source} state has invalid scope: ${file}`)
        continue
      }
      refs.push({
        key,
        scope: metadata.scope,
        source,
        ref: `${source}:state/${path.relative(root, file).replaceAll('\\', '/')}`,
        source_hash: sha256(bytes),
        ...(metadata.privacy === 'private' ? { privacy: 'private' } : {}),
        ...(metadata.promoted === true ? { promoted: true } : {}),
        ...(metadata.redacted === true ? { redacted: true } : {}),
      })
    } catch {
      diagnostics.push(`${source} state is not valid JSON: ${file}`)
    }
  }
  return refs
}

export async function resolveGoVibeContext(args: {
  serverRoot: string
  workspaceRoot?: string
  mode: GoVibeMode
  stateKeys?: string[]
  knowledgeRefs?: string[]
}): Promise<ContextResolution> {
  const workspace = await resolveWorkspaceRoot(args.serverRoot, args.workspaceRoot)
  const globalStateRoot = path.join(globalRoot(), 'state')
  const workspaceStateRoot = path.join(workspace, '.brain', 'state')
  const diagnostics: string[] = []
  const policyDecisions: ContextResolution['policy_decisions'] = []
  const keys = args.stateKeys ? new Set(args.stateKeys) : undefined
  const rawGlobal = await readStateRefs(globalStateRoot, 'global', keys, diagnostics)
  const rawWorkspace = await readStateRefs(workspaceStateRoot, 'workspace', keys, diagnostics)

  const workspaceByKey = new Map(
    rawWorkspace
      .filter((ref) => ref.scope === 'project')
      .map((ref) => [ref.key, ref]),
  )
  const globalAuthorityByKey = new Map(
    rawGlobal
      .filter((ref) => ref.scope === 'identity' || ref.scope === 'security')
      .map((ref) => [ref.key, ref]),
  )
  const globalByKey = new Map(rawGlobal.map((ref) => [ref.key, ref]))
  const globalRefs: StateReference[] = []
  const workspaceRefs: StateReference[] = []

  for (const ref of rawGlobal) {
    if (
      args.mode === 'codev' &&
      ref.privacy === 'private' &&
      !(ref.promoted === true && ref.redacted === true)
    ) {
      policyDecisions.push({ decision: 'deny', ref: ref.ref, reason: 'global_private_memory' })
      continue
    }
    const workspaceRef = workspaceByKey.get(ref.key)
    if (workspaceRef && ref.scope === 'project') {
      policyDecisions.push({ decision: 'shadow', ref: ref.ref, reason: 'workspace_project_precedence' })
      continue
    }
    globalRefs.push(ref)
    policyDecisions.push({ decision: 'allow', ref: ref.ref, reason: 'global_authority' })
  }

  for (const ref of rawWorkspace) {
    if (
      ref.scope === 'identity' ||
      ref.scope === 'security' ||
      globalAuthorityByKey.has(ref.key) ||
      (globalByKey.get(ref.key)?.scope === 'project' && ref.scope !== 'project')
    ) {
      policyDecisions.push({ decision: 'deny', ref: ref.ref, reason: 'workspace_cannot_override_global_authority' })
      continue
    }
    workspaceRefs.push(ref)
    policyDecisions.push({ decision: 'allow', ref: ref.ref, reason: 'workspace_project_scope' })
  }

  const gksRoot = path.join(workspace, 'gks')
  const knowledgeRefs: ContextResolution['knowledge_refs'] = []
  for (const requested of args.knowledgeRefs ?? []) {
    const graphPrefix = 'gks:graph/graph.jsonl#'
    if (requested.startsWith(graphPrefix)) {
      const nodeId = requested.slice(graphPrefix.length)
      if (!nodeId) throw new Error('GKS graph knowledge_ref is missing a node id')
      const graphPath = path.join(gksLayout(workspace).graph, 'graph.jsonl')
      const realGraph = await fs.realpath(graphPath)
      if (!isInside(workspace, realGraph)) throw new Error('GKS graph knowledge_ref resolves outside workspace')
      const graph = new GraphStore({ path: realGraph })
      await graph.load()
      if (!graph.getNode(nodeId)) throw new Error(`GKS graph knowledge_ref does not exist: ${nodeId}`)
      const bytes = await fs.readFile(realGraph)
      knowledgeRefs.push({ ref: requested, source_hash: sha256(bytes) })
      continue
    }
    const candidate = path.resolve(gksRoot, requested)
    if (!isInside(gksRoot, candidate)) throw new Error(`knowledge_ref escapes workspace GKS: ${requested}`)
    const real = await fs.realpath(candidate)
    const realGks = await fs.realpath(gksRoot)
    if (!isInside(realGks, real)) throw new Error(`knowledge_ref resolves outside workspace GKS: ${requested}`)
    const bytes = await fs.readFile(real)
    knowledgeRefs.push({ ref: `gks:${path.relative(gksRoot, real).replaceAll('\\', '/')}`, source_hash: sha256(bytes) })
  }

  return {
    schema: 'govibe-context-fragment/v1',
    global_state_refs: globalRefs,
    workspace_state_refs: workspaceRefs,
    knowledge_refs: knowledgeRefs,
    policy_decisions: policyDecisions,
    diagnostics,
  }
}
