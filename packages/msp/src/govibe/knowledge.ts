import { GraphStore, gksLayout, type AddEdgeArgs, type AddNodeArgs } from '@freshair129/gks'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { lockSession } from '../memory/sessions/lock.js'
import { canonicalJsonLine, sha256 } from './canonical.js'
import { assertSafeId, isInside, resolveWorkspaceRoot } from './paths.js'

const COLLECTIONS = ['symbols', 'nodes', 'edges', 'communities', 'processes'] as const
const FORBIDDEN = ['proof', 'evidence', 'verification', 'verdict', 'knowledge_ref'] as const
const ALLOWED = new Set(['record_id', 'provenance_ref', ...COLLECTIONS])

export type CodeKnowledgeInput = {
  record_id: string
  provenance_ref: string
  symbols?: unknown[]
  nodes?: unknown[]
  edges?: unknown[]
  communities?: unknown[]
  processes?: unknown[]
} & Record<string, unknown>

interface SymbolRecord {
  id: string
  name: string
  kind: string
  path?: string
  line?: number
  props?: Record<string, unknown>
}

interface CommunityRecord {
  id: string
  label?: string
  member_ids: string[]
  props?: Record<string, unknown>
}

interface ProcessRecord {
  id: string
  name: string
  step_ids: string[]
  props?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionalProps(value: unknown, field: string): Record<string, unknown> | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error(`${field}.props must be an object`)
  return value
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string`)
  return value
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.length > 0)) {
    throw new Error(`${field} must be an array of non-empty strings`)
  }
  return value
}

function validateNode(value: unknown, index: number): AddNodeArgs & { id: string } {
  if (!isRecord(value)) throw new Error(`nodes[${index}] must be an object`)
  return {
    id: requiredString(value.id, `nodes[${index}].id`),
    labels: stringArray(value.labels, `nodes[${index}].labels`),
    ...(value.props !== undefined ? { props: optionalProps(value.props, `nodes[${index}]`) } : {}),
  }
}

function validateEdge(value: unknown, index: number): AddEdgeArgs & { id: string } {
  if (!isRecord(value)) throw new Error(`edges[${index}] must be an object`)
  return {
    id: requiredString(value.id, `edges[${index}].id`),
    from: requiredString(value.from, `edges[${index}].from`),
    to: requiredString(value.to, `edges[${index}].to`),
    rel: requiredString(value.rel, `edges[${index}].rel`),
    ...(value.props !== undefined ? { props: optionalProps(value.props, `edges[${index}]`) } : {}),
  }
}

function validateSymbol(value: unknown, index: number): SymbolRecord {
  if (!isRecord(value)) throw new Error(`symbols[${index}] must be an object`)
  return {
    id: requiredString(value.id, `symbols[${index}].id`),
    name: requiredString(value.name, `symbols[${index}].name`),
    kind: requiredString(value.kind, `symbols[${index}].kind`),
    ...(typeof value.path === 'string' ? { path: value.path } : {}),
    ...(typeof value.line === 'number' && Number.isInteger(value.line) && value.line > 0 ? { line: value.line } : {}),
    ...(value.props !== undefined ? { props: optionalProps(value.props, `symbols[${index}]`) } : {}),
  }
}

function validateCommunity(value: unknown, index: number): CommunityRecord {
  if (!isRecord(value)) throw new Error(`communities[${index}] must be an object`)
  return {
    id: requiredString(value.id, `communities[${index}].id`),
    ...(typeof value.label === 'string' ? { label: value.label } : {}),
    member_ids: stringArray(value.member_ids, `communities[${index}].member_ids`),
    ...(value.props !== undefined ? { props: optionalProps(value.props, `communities[${index}]`) } : {}),
  }
}

function validateProcess(value: unknown, index: number): ProcessRecord {
  if (!isRecord(value)) throw new Error(`processes[${index}] must be an object`)
  return {
    id: requiredString(value.id, `processes[${index}].id`),
    name: requiredString(value.name, `processes[${index}].name`),
    step_ids: stringArray(value.step_ids, `processes[${index}].step_ids`),
    ...(value.props !== undefined ? { props: optionalProps(value.props, `processes[${index}]`) } : {}),
  }
}

export async function writeCodeKnowledge(args: {
  serverRoot: string
  workspaceRoot?: string
  record: CodeKnowledgeInput
}): Promise<{ knowledge_ref: string; source_hash: string; idempotent: boolean }> {
  const workspace = await resolveWorkspaceRoot(args.serverRoot, args.workspaceRoot)
  assertSafeId(args.record.record_id)
  if (!args.record.provenance_ref?.trim()) throw new Error('provenance_ref is required')
  for (const field of FORBIDDEN) {
    if (field in args.record) throw new Error(`GKS knowledge payload cannot contain MSP-owned field: ${field}`)
  }
  for (const field of Object.keys(args.record)) {
    if (!ALLOWED.has(field)) throw new Error(`unknown code-knowledge field: ${field}`)
  }
  if (!COLLECTIONS.some((field) => Array.isArray(args.record[field]) && args.record[field]!.length > 0)) {
    throw new Error(`at least one code-knowledge collection is required: ${COLLECTIONS.join(', ')}`)
  }

  const nodes = (args.record.nodes ?? []).map(validateNode)
  const edges = (args.record.edges ?? []).map(validateEdge)
  const symbols = (args.record.symbols ?? []).map(validateSymbol)
  const communities = (args.record.communities ?? []).map(validateCommunity)
  const processes = (args.record.processes ?? []).map(validateProcess)
  const sourceHash = sha256(canonicalJsonLine({ schema: 'gks-code-knowledge/v1', ...args.record }))
  const rootId = `govibe-code-knowledge:${args.record.record_id}`

  const graphDirectory = gksLayout(workspace).graph
  await fs.mkdir(graphDirectory, { recursive: true })
  const realDirectory = await fs.realpath(graphDirectory)
  const realWorkspace = await fs.realpath(workspace)
  if (!isInside(realWorkspace, realDirectory)) throw new Error('GKS graph directory resolves outside workspace')
  const graphPath = path.join(realDirectory, 'graph.jsonl')
  try {
    if ((await fs.lstat(graphPath)).isSymbolicLink()) {
      throw new Error('GKS graph target cannot be a symbolic link')
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const release = await lockSession(graphPath)
  try {
    if ((await fs.lstat(graphPath)).isSymbolicLink()) {
      throw new Error('GKS graph target cannot be a symbolic link')
    }
    const graph = new GraphStore({ path: graphPath })
    await graph.load()
    const existing = graph.getNode(rootId)
    if (existing) {
      if (existing.props['source_hash'] === sourceHash) {
        return { knowledge_ref: `gks:graph/graph.jsonl#${rootId}`, source_hash: sourceHash, idempotent: true }
      }
      throw new Error(`knowledge record already exists with a different hash: ${args.record.record_id}`)
    }

    const plannedNodeIds = new Set([
      ...nodes.map((node) => node.id),
      ...symbols.map((symbol) => symbol.id),
      ...communities.map((community) => community.id),
      ...processes.map((process) => process.id),
    ])
    const assertNode = (id: string, field: string) => {
      if (!plannedNodeIds.has(id) && !graph.getNode(id)) {
        throw new Error(`${field} references unknown GKS node: ${id}`)
      }
    }
    for (const edge of edges) {
      assertNode(edge.from, `edge ${edge.id}`)
      assertNode(edge.to, `edge ${edge.id}`)
    }
    for (const community of communities) {
      for (const memberId of community.member_ids) assertNode(memberId, `community ${community.id}`)
    }
    for (const process of processes) {
      for (const stepId of process.step_ids) assertNode(stepId, `process ${process.id}`)
    }

    for (const node of nodes) await graph.addNode(node)
    for (const symbol of symbols) {
      await graph.addNode({
        id: symbol.id,
        labels: ['Symbol', symbol.kind],
        props: {
          name: symbol.name,
          ...(symbol.path ? { path: symbol.path } : {}),
          ...(symbol.line ? { line: symbol.line } : {}),
          ...(symbol.props ?? {}),
        },
      })
    }
    for (const community of communities) {
      await graph.addNode({ id: community.id, labels: ['Community'], props: { label: community.label ?? community.id, ...(community.props ?? {}) } })
    }
    for (const process of processes) {
      await graph.addNode({ id: process.id, labels: ['Process'], props: { name: process.name, ...(process.props ?? {}) } })
    }

    for (const edge of edges) {
      await graph.addEdge(edge)
    }
    for (const community of communities) {
      for (const memberId of community.member_ids) {
        await graph.addEdge({ id: `${community.id}::member::${memberId}`, from: memberId, to: community.id, rel: 'MEMBER_OF' })
      }
    }
    for (const process of processes) {
      for (const [index, stepId] of process.step_ids.entries()) {
        await graph.addEdge({ id: `${process.id}::step::${index}::${stepId}`, from: process.id, to: stepId, rel: 'HAS_STEP', props: { order: index } })
      }
    }

    await graph.addNode({
      id: rootId,
      labels: ['GoVibeCodeKnowledge'],
      props: {
        schema: 'gks-code-knowledge/v1',
        source_hash: sourceHash,
        provenance_ref: args.record.provenance_ref,
        node_ids: nodes.map((node) => node.id),
        symbol_ids: symbols.map((symbol) => symbol.id),
        edge_ids: edges.map((edge) => edge.id),
        community_ids: communities.map((community) => community.id),
        process_ids: processes.map((process) => process.id),
      },
    })
    return { knowledge_ref: `gks:graph/graph.jsonl#${rootId}`, source_hash: sourceHash, idempotent: false }
  } finally {
    await release()
  }
}
