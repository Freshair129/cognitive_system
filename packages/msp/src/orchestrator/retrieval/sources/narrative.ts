import { performance } from 'node:perf_hooks'
import { join } from 'node:path'
import { readFile, readdir } from 'node:fs/promises'

import {
  type RecallOptions,
  type SourceResult,
  type SourceHit,
  DEFAULT_PER_SOURCE_TIMEOUTS,
} from '../types.js'
import { parseFile } from '../../../validator/parse.js'
import { coresDir } from '../../distiller/pillar-relation.js'
import { DEFAULT_NAMESPACE } from '../types.js'

/**
 * Retrieval source for Narrative atoms (Tier 2).
 *
 * Narratives are project memory, written by the distiller to
 * `.brain/msp/projects/<ns>/memory/cores/` — see `pillar-relation.ts` for
 * why they are not vault atoms.
 */
export async function narrativeSource(opts: RecallOptions): Promise<SourceResult> {
  const start = performance.now()
  const root = opts.root ?? process.cwd()
  const timeoutMs = opts.perSourceTimeouts?.narrative ?? DEFAULT_PER_SOURCE_TIMEOUTS.narrative
  
  const narrativeDir = coresDir(root, opts.namespace ?? DEFAULT_NAMESPACE)
  
  try {
    const files = await readdir(narrativeDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const hits: SourceHit[] = []
    
    // For Phase 1, we do a simple substring search on the query
    // In future, this should use the vector store 'memory/narrative' namespace
    const needle = opts.query.toLowerCase()

    for (const file of mdFiles) {
      const filePath = join(narrativeDir, file)
      try {
        const parsed = await parseFile(filePath)
        const fm = parsed.fm
        
        const text = (fm['title'] as string || '') + ' ' + (fm['summary'] as string || '') + ' ' + parsed.body
        
        if (text.toLowerCase().includes(needle)) {
          hits.push({
            atomId: fm['id'] as string,
            rank: 1, // Will be sorted later
            snippet: fm['summary'] as string || parsed.body.slice(0, 200),
            source: 'narrative',
            memoryTier: 'narrative',
            attributes: fm['attributes'] as Record<string, any>
          })
        }
      } catch {
        continue
      }
      
      if (performance.now() - start > timeoutMs) break
    }

    // Basic rank based on match quality or just order for now
    const rankedHits = hits.map((h, i) => ({ ...h, rank: i + 1 }))

    return {
      source: 'narrative',
      hits: rankedHits,
      latencyMs: Math.round(performance.now() - start)
    }

  } catch (err) {
    return {
      source: 'narrative',
      hits: [],
      latencyMs: Math.round(performance.now() - start),
      error: (err as Error).message
    }
  }
}
