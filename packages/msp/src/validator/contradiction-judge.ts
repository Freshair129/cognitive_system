import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { createGenesisGraphBackend } from '@freshair129/gks'
import { dispatch } from '../agents/dispatch.js'
import { parseFile } from './parse.js'

export interface Contradiction {
  old_atom: string
  claim: string
  new_claim: string
  severity: 'definite' | 'possible' | 'none'
  rationale: string
}

export interface JudgeResult {
  ok: boolean
  contradictions: Contradiction[]
  neighbors_checked: string[]
}

/**
 * The Machine Judge — Layer 4 Semantic Contradiction Detection.
 *
 * Uses Genesis Graph to find neighbors and T3 Agent (Claude) to
 * evaluate logical consistency.
 *
 * Implements FEAT--SEMANTIC-CONTRADICTION-JUDGE.
 */
export async function judgeContradiction(
  filepath: string,
  opts: { root: string; hops?: number; limit?: number }
): Promise<JudgeResult> {
  const root = resolve(opts.root)
  const hops = opts.hops ?? 2
  const limit = opts.limit ?? 5

  // 1. Parse the target atom
  const newAtom = await parseFile(filepath)
  
  // 2. Use Genesis Graph to find relevant stable neighbors
  const dbPath = resolve(root, 'gks')
  const backend = createGenesisGraphBackend({ path: dbPath })
  await backend.load()

  const neighbors = await backend.neighbors(newAtom.id, {
    depth: hops,
    direction: 'both',
    limit: limit * 2 // Fetch more to filter for stable ones
  })

  const stableNeighbors = neighbors
    .filter(n => n.node.id !== newAtom.id) // Skip self
    // In a real implementation, we would check if they are 'stable' in the index
    // For MVP, we treat all graph nodes as potential canon
    .slice(0, limit)

  if (stableNeighbors.length === 0) {
    return { ok: true, contradictions: [], neighbors_checked: [] }
  }

  // 3. Prepare context for the T3 Agent
  const neighborContents = await Promise.all(
    stableNeighbors.map(async (n) => {
      // In a real implementation, we'd resolve the actual path from the index
      // For now, we assume the graph node might have the path or we can infer it
      // Simplified: we'll just use the props if available or mock
      return `[[${n.node.id}]]:\n${JSON.stringify(n.node.props)}`
    })
  )

  const prompt = `
You are the Semantic Contradiction Judge for the cognitive_system knowledge base.
Your task is to identify logical tensions or direct contradictions between a newly proposed atom and the existing stable canon.

### New Atom (Candidate):
ID: ${newAtom.id}
Body:
${newAtom.body}

### Existing Stable Atoms (Context):
${neighborContents.join('\n\n---\n\n')}

### Instructions:
1. Carefully read the new atom and the existing context.
2. Identify any claims in the new atom that contradict or significantly drift from the stable atoms without explicit supersession.
3. Cite the specific conflicting passages from both sides.
4. Assign a severity:
   - 'definite': Direct logical contradiction (e.g. A says "use X", B says "do NOT use X").
   - 'possible': Semantic tension or ambiguity that might lead to confusion.
   - 'none': No conflict detected.

### Output Format:
Output ONLY a valid JSON object with this shape:
{
  "contradictions": [
    {
      "old_atom": "ID",
      "claim": "quoted passage from old",
      "new_claim": "quoted passage from new",
      "severity": "definite" | "possible",
      "rationale": "one sentence explanation"
    }
  ]
}
If no contradictions found, return {"contradictions": []}.
`

  // 4. Dispatch to T3 (Claude)
  const result = await dispatch({
    prompt,
    budget_hint: 'T3',
    severity: 'high', // Logic integrity is high severity
    context_size_tokens: 4000
  })

  try {
    const parsed = JSON.parse(result.output.trim())
    const contradictions = (parsed.contradictions || []) as Contradiction[]
    return {
      ok: contradictions.every(c => c.severity !== 'definite'),
      contradictions,
      neighbors_checked: stableNeighbors.map(n => n.node.id)
    }
  } catch (err) {
    throw new Error(`judgeContradiction: failed to parse LLM response: ${result.output}`)
  }
}
