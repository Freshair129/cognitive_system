import { resolve } from 'node:path'
import { createGenesisGraphBackend, gksLayout } from '@freshair129/gks'
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
  const atomId = newAtom.fm['id'] as string
  
  // 2. Use Genesis Graph to find relevant stable neighbors. The graph lives in
  // the resolved vault (gksLayout.gks = .brain/cognitive-system-knowledge-block),
  // NOT <root>/gks.
  const dbPath = gksLayout(root).gks
  const backend = createGenesisGraphBackend({ path: dbPath })
  await backend.load()

  const neighbors = await backend.neighbors(atomId, {
    depth: hops,
    direction: 'both',
    limit: limit * 2 // Fetch more to filter for stable ones
  })

  const stableNeighbors = neighbors
    .filter(n => n.node.id !== atomId) // Skip self
    .slice(0, limit)

  if (stableNeighbors.length === 0) {
    return { ok: true, contradictions: [], neighbors_checked: [] }
  }

  // 3. Prepare context for the T3 Agent
  const neighborContents = await Promise.all(
    stableNeighbors.map(async (n) => {
      return `[[${n.node.id}]]:\n${JSON.stringify(n.node.props)}`
    })
  )

  const prompt = `
You are the Semantic Contradiction Judge for the cognitive_system knowledge base.
Your task is to identify logical tensions or direct contradictions between a newly proposed atom and the existing stable canon.

### New Atom (Candidate):
ID: ${atomId}
Body:
${newAtom.body}

### Existing Stable Atoms (Context):
${neighborContents.join('\n\n---\n\n')}

### Instructions:
1. Carefully read the new atom and the existing context.
2. Identify any claims in the new atom that contradict or significantly drift from the stable atoms without explicit supersession.
3. Cite the specific conflicting passages from both sides.
4. Assign a severity:
   - 'definite': Direct logical contradiction.
   - 'possible': Semantic tension or ambiguity.
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
    type: 'review',
    prompt,
    budget_hint: 'T3',
    severity: 'critical', // Logic integrity is critical severity
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
