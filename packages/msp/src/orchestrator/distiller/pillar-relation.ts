import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { NarrativeUnit } from './types.js'

/**
 * Pillar 4: RELATION
 * Generates the GKS atom for the narrative unit and establishes cross-links.
 */
export async function writeNarrativeAtom(
  root: string,
  narrative: NarrativeUnit
): Promise<string> {
  const timestamp = new Date().toISOString()
  
  const content = `---
id: ${narrative.id}
phase: 1
type: narrative
status: stable
vault_id: default
tier: process
source_type: learned
title: NARRATIVE — ${narrative.id} — ${narrative.domain} synthesis
tags: [msp, memory, narrative, distillation, ${narrative.domain}]
aliases: [Core Memory, NARRATIVE]
cluster: memory
role: Cross-session pattern / arc
crosslinks:
  references:
${narrative.source_episodes.map(ep => `    - ${ep.id}`).join('\n')}
created_at: ${narrative.created_at}
---

# NARRATIVE — ${narrative.id}

## Summary

${narrative.content.summary}

## Patterns

${narrative.content.patterns_observed.map(p => `- ${p}`).join('\n')}

## Source

- Distilled from ${narrative.source_episodes.length} episodes.
`

  const filePath = join(root, 'gks', 'narrative', `${narrative.id}.md`)
  // Note: Directory is guaranteed to exist by initMemoryStore.
  await writeFile(filePath, content, 'utf8')
  
  return filePath
}
