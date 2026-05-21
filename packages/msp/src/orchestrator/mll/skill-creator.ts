import { resolve, join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createGenesisGraphBackend } from '@freshair129/gks'
import { dispatch } from '../../agents/dispatch.js'
import { parseFile } from '../../validator/parse.js'

export interface DistillationResult {
  skill_id: string
  body: string
  source_episodes: string[]
}

export interface SkillCreatorOpts {
  root: string
  limit?: number
  namespace?: string
  stabilityScore?: number
}

/**
 * Skill Creator Engine — automated distillation of reusable patterns.
 *
 * Implements Step 2 of the Meta-Learning Loop (Phase 1).
 * Uses Genesis Graph for data discovery and T3 for distillation.
 */
export async function distillSkillFromEpisodes(opts: SkillCreatorOpts): Promise<DistillationResult[]> {
  const root = resolve(opts.root)
  const limit = opts.limit ?? 5
  const ns = opts.namespace ?? 'default'

  // 1. Initialize Genesis Graph to find recent successful episodes
  const dbPath = resolve(root, 'gks')
  const backend = createGenesisGraphBackend({ path: dbPath })
  await backend.load()

  // Simplified query for MVP: find all atoms with type 'episode'
  // In future, filter for successful ones.
  const allNodes = await backend.neighbors('N-ROOT', { depth: 2 }) 
  const episodeNodes = allNodes.filter(n => n.node.labels.includes('episode')).slice(0, limit)

  if (episodeNodes.length === 0) {
    console.warn('[mll] No successful episodes found for distillation.')
    return []
  }

  // 2. Prepare context from episodes
  const episodeContents = await Promise.all(
    episodeNodes.map(async (n) => {
      const id = n.node.id
      return `Episode ${id}:\n${JSON.stringify(n.node.props)}`
    })
  )

  // 3. T3 Distillation Task
  const prompt = `
You are the Meta-Learning Loop Skill Creator.
Your task is to analyze the provided execution traces (EPISODES) and distill a reusable "Skill" atom.

### Context (Recent Episodes):
${episodeContents.join('\n\n---\n\n')}

### Goal:
Extract a specific, reusable skill that contributed to the success of these episodes.
A skill can be a particular Workflow (e.g. "React Component Refactoring"), a specialized Regex pattern for data extraction, or a specific decision-making heuristic.

### Instructions:
1. Identify common patterns across the episodes.
2. Distill the "essence" of the successful action.
3. Output the skill as a structured Markdown atom.

### Output Format:
Output ONLY a valid Markdown string that follows this frontmatter template:
---
id: SKILL--[DESCRIPTIVE-ID]
version: 1.0
type: skill
tier: genesis
mll_metadata:
  source_episodes: ${JSON.stringify(episodeNodes.map(n => n.node.id))}
  definition_stability: ${opts.stabilityScore !== undefined ? opts.stabilityScore.toFixed(2) : '0.50'}
  suggested_by: "MLL-Skill-Creator"
  timestamp: "${new Date().toISOString()}"
---
# Executive Summary
[One paragraph describing what this skill does and when to use it]

# Workflow / Logic
[Numbered steps or pseudo-code describing the skill]

# Evidence
[Why this skill was extracted - citation of episodes]
`

  const result = await dispatch({
    type: 'codegen',
    prompt,
    budget_hint: 'T3',
    severity: 'regular',
    context_size_tokens: 8000
  })

  // 4. Save to Candidates Folder
  const candidatePath = resolve(root, `.brain/msp/projects/${ns}/candidates`)
  await mkdir(candidatePath, { recursive: true })

  const idMatch = result.output.match(/^id:\s*(SKILL--[A-Z0-9_-]+)/m)
  const skillId = idMatch ? idMatch[1] : `SKILL--EXTRACTED-${Date.now()}`
  const fileName = `${skillId}.md`
  
  await writeFile(join(candidatePath, fileName), result.output, 'utf8')

  return [{
    skill_id: skillId!,
    body: result.output,
    source_episodes: episodeNodes.map(n => n.node.id)
  }]
}
