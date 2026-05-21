import { createGenesisGraphBackend } from '@freshair129/gks'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

import { loadManifest } from './loader.js'
import {
  DIMENSIONS,
  type Dimension,
  type GenesisManifest,
  type LoadedMember,
  type LoadedMembers,
} from './types.js'

/**
 * High-Impact threshold for automatic context injection.
 * Atoms with K-Impact >= this value will be pulled into the context
 * if they are 1-hop neighbors of any seed atom.
 */
const HIGH_IMPACT_THRESHOLD = 0.8

/**
 * Map atom ID prefixes to their corresponding Genesis Dimensions.
 */
const PREFIX_TO_DIMENSION: Record<string, Dimension> = {
  'MASTER--': 'cognitive',
  'FRAME--': 'cognitive',
  'CONCEPT--': 'concept',
  'SPEC--': 'concept',
  'FEAT--': 'algo',
  'ADR--': 'algo',
  'BLUEPRINT--': 'runbook',
  'LOG--': 'runbook',
  'EPISODE--': 'params',
  'PARAMS--': 'params',
}

function deriveDimension(id: string): Dimension {
  for (const [prefix, dim] of Object.entries(PREFIX_TO_DIMENSION)) {
    if (id.startsWith(prefix)) return dim
  }
  return 'concept'
}

/**
 * The Genesis Block Bridge provides impact-aware member resolution.
 * It leverages the GKS Genesis Graph (Native) to expand the context
 * and sort atoms by their cognitive weight.
 */
export class GenesisBlockBridge {
  constructor(private readonly root: string) {}

  /**
   * Resolve all members for a block, including seeds and high-impact neighbors.
   */
  async resolveMembers(blockId: string): Promise<LoadedMembers> {
    const manifest = await loadManifest(blockId, this.root)
    const dbPath = resolve(this.root, 'gks')
    const backend = createGenesisGraphBackend({ path: dbPath })

    // Initialize output structure
    const results: LoadedMembers = {
      cognitive: [],
      algo: [],
      concept: [],
      runbook: [],
      params: [],
    }

    try {
      // 1. Gather all seed IDs from manifest
      const seedIds = new Set<string>()
      for (const dim of DIMENSIONS) {
        for (const id of manifest.members[dim] ?? []) {
          seedIds.add(id)
        }
      }

      // 2. Expand context via graph if backend supports it
      const finalIds = new Set<string>(seedIds)
      
      // Load all atoms into the graph if needed (Native open usually does this)
      await backend.load()

      for (const seedId of seedIds) {
        const neighbors = await backend.neighbors(seedId, {
          depth: 1,
          direction: 'out',
        })

        for (const n of neighbors) {
          if ((n.node.impact ?? 0) >= HIGH_IMPACT_THRESHOLD) {
            finalIds.add(n.node.id)
          }
        }
      }

      // 3. Fetch full content for all final IDs
      const atomsToLoad = Array.from(finalIds)
      const loadedAtoms: Array<LoadedMember & { impact: number }> = []

      for (const id of atomsToLoad) {
        const atom = await backend.query({ rel: '', from: id, limit: 1 }) // Dummy query to get node if needed? 
        // Actually, backend.neighbors already gave us NodeOutput. Let's use it.
        // For seeds, we might need a lookup.
        
        // Lookup node to get current properties and impact
        const nodes = await backend.neighbors(id, { depth: 0 })
        const node = nodes[0]?.node

        if (node) {
          // Resolve file path from the graph props or convention
          // In GKS, conventionally gks/<dim>/<id>.md
          const dim = deriveDimension(id)
          const filePath = resolve(this.root, 'gks', dim, `${id}.md`)
          
          try {
            const content = await readFile(filePath, 'utf8')
            const body = content.split('---').slice(2).join('---').trim()
            
            loadedAtoms.push({
              id,
              dimension: dim,
              body,
              path: filePath,
              impact: node.impact ?? 0.5,
            })
          } catch (e) {
            // Skip if file missing
          }
        }
      }

      // 4. Sort by impact and distribute into dimensions
      loadedAtoms.sort((a, b) => b.impact - a.impact)

      for (const atom of loadedAtoms) {
        results[atom.dimension].push(atom)
      }

      return results
    } catch (err) {
      // Fallback to simple loader if graph fails
      console.warn(`[bridge] graph resolution failed, falling back: ${(err as Error).message}`)
      const { loadMembers } = await import('./loader.js')
      return loadMembers(manifest, this.root)
    }
  }
}
