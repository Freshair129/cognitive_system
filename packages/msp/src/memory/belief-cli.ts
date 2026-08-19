#!/usr/bin/env node
/**
 * `msp-belief` — review gate for distilled identity beliefs (R-01).
 *
 * Distillation writes beliefs as `status: draft`, `epistemic_state:
 * hypothesis`, with no approval block. They are stored and searchable but are
 * withheld from `generateIdentityPreamble()` — i.e. they cannot shape agent
 * behaviour — until a human approves them here.
 *
 * Approval is a deliberate act by a named person. There is no auto-approve
 * flag and no agent-invocable MCP equivalent, by design.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { spheresDir } from '../orchestrator/distiller/pillar-relation.js'
import { loadAllBeliefs, isApproved, isPersonaEligible } from './identity.js'

const HELP = `msp-belief — review and approve distilled identity beliefs

Usage:
  msp-belief list    [--namespace=<ns>] [--root=<dir>] [--all]
  msp-belief show    <BELIEF--ID> [--namespace=<ns>] [--root=<dir>]
  msp-belief approve <BELIEF--ID> --by=<name> [--note=<text>] [--namespace=<ns>] [--root=<dir>]
  msp-belief reject  <BELIEF--ID> [--namespace=<ns>] [--root=<dir>]
  msp-belief --help

Why this exists:
  Beliefs are single-pass LLM inference over your session history. Approving
  one injects its statement into the agent's system prompt, where it acts as
  an instruction rather than as retrievable data. Read the evidence before
  approving.

Flags:
  --namespace=<ns>  project namespace (default: default)
  --root=<dir>      project root (default: cwd)
  --by=<name>       approver identity — required for approve
  --note=<text>     optional rationale recorded with the approval
  --all             list: include already-approved beliefs

Exit codes:
  0  success
  1  belief not found / approve refused
  2  bad arguments
`

interface Flags {
  root: string
  namespace: string
}

function readFlags(values: Record<string, unknown>): Flags {
  return {
    root: resolve((values['root'] as string | undefined) ?? process.cwd()),
    namespace: (values['namespace'] as string | undefined) ?? 'default',
  }
}

async function cmdList(flags: Flags, showAll: boolean): Promise<number> {
  const beliefs = await loadAllBeliefs({ root: flags.root, namespace: flags.namespace })
  const rows = showAll ? beliefs : beliefs.filter((b) => !isApproved(b))

  if (rows.length === 0) {
    process.stdout.write(
      showAll
        ? 'No beliefs in this namespace.\n'
        : 'No beliefs awaiting review.\n',
    )
    return 0
  }

  for (const b of rows) {
    const mark = isPersonaEligible(b) ? 'APPROVED' : isApproved(b) ? 'APPROVED*' : 'pending '
    const conf = `${Math.round((b.confidence ?? 0) * 100)}%`.padStart(4)
    process.stdout.write(
      `${mark}  ${b.id.padEnd(18)}  ${b.epistemic_state.padEnd(10)}  ${conf}  ${b.statement.split('\n')[0]!.slice(0, 60)}\n`,
    )
  }
  if (!showAll) {
    process.stderr.write(`\n${rows.length} belief(s) awaiting review. APPROVED* = approved but contested/deprecated.\n`)
  }
  return 0
}

async function cmdShow(flags: Flags, id: string): Promise<number> {
  const path = join(spheresDir(flags.root, flags.namespace), `${id}.md`)
  try {
    process.stdout.write(await readFile(path, 'utf8'))
    return 0
  } catch {
    process.stderr.write(`msp-belief: no belief '${id}' in namespace '${flags.namespace}'\n`)
    return 1
  }
}

async function cmdApprove(
  flags: Flags,
  id: string,
  by: string,
  note: string | undefined,
): Promise<number> {
  const path = join(spheresDir(flags.root, flags.namespace), `${id}.md`)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    process.stderr.write(`msp-belief: no belief '${id}' in namespace '${flags.namespace}'\n`)
    return 1
  }

  if (/^approval:/m.test(raw)) {
    process.stderr.write(`msp-belief: '${id}' is already approved\n`)
    return 1
  }

  const approvedAt = new Date().toISOString()
  const block =
    `approval:\n  approved_by: ${by}\n  approved_at: ${approvedAt}\n` +
    (note ? `  note: ${JSON.stringify(note)}\n` : '')

  // Insert immediately before `crosslinks:` so the block stays inside the
  // frontmatter regardless of what else is present.
  if (!/^crosslinks:/m.test(raw)) {
    process.stderr.write(`msp-belief: '${id}' has malformed frontmatter (no crosslinks:)\n`)
    return 1
  }
  const next = raw.replace(/^crosslinks:/m, `${block}crosslinks:`)
  await writeFile(path, next, 'utf8')

  process.stdout.write(`✓ approved ${id} (by ${by})\n`)
  process.stderr.write(
    `[belief] ${id} is now eligible for the identity preamble in namespace '${flags.namespace}'.\n`,
  )
  return 0
}

async function cmdReject(flags: Flags, id: string): Promise<number> {
  const path = join(spheresDir(flags.root, flags.namespace), `${id}.md`)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    process.stderr.write(`msp-belief: no belief '${id}' in namespace '${flags.namespace}'\n`)
    return 1
  }
  const next = raw.replace(/^epistemic_state: .*$/m, 'epistemic_state: deprecated')
  await writeFile(path, next, 'utf8')
  process.stdout.write(`✓ rejected ${id} (epistemic_state: deprecated)\n`)
  return 0
}

async function main(): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        root: { type: 'string' },
        namespace: { type: 'string' },
        by: { type: 'string' },
        note: { type: 'string' },
        all: { type: 'boolean' },
        help: { type: 'boolean' },
      },
      allowPositionals: true,
    })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n${HELP}`)
    return 2
  }

  const { values, positionals } = parsed
  if (values.help || positionals.length === 0) {
    process.stdout.write(HELP)
    return values.help ? 0 : 2
  }

  const flags = readFlags(values as Record<string, unknown>)
  const [sub, arg] = positionals

  switch (sub) {
    case 'list':
      return cmdList(flags, values.all === true)
    case 'show':
      if (!arg) {
        process.stderr.write(`error: show requires a belief id\n`)
        return 2
      }
      return cmdShow(flags, arg)
    case 'approve': {
      if (!arg) {
        process.stderr.write(`error: approve requires a belief id\n`)
        return 2
      }
      const by = values.by as string | undefined
      if (!by || by.trim().length === 0) {
        process.stderr.write(
          `error: approve requires --by=<name>. Approval is attributed to a person.\n`,
        )
        return 2
      }
      return cmdApprove(flags, arg, by.trim(), values.note as string | undefined)
    }
    case 'reject':
      if (!arg) {
        process.stderr.write(`error: reject requires a belief id\n`)
        return 2
      }
      return cmdReject(flags, arg)
    default:
      process.stderr.write(`error: unknown subcommand '${sub}'\n${HELP}`)
      return 2
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`✗ unexpected error: ${(err as Error).message}\n`)
    process.exit(2)
  })
