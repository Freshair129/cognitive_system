import type { Turn, Thresholds } from './types.js'
import { DEFAULT_THRESHOLDS } from './config.js'

// --- Bag-of-words cosine similarity (from GKS) ---

function textToBag(text: string): Map<string, number> {
  const bag = new Map<string, number>()
  const words = text.toLowerCase().match(/\w+/g) ?? []
  for (const word of words) {
    bag.set(word, (bag.get(word) ?? 0) + 1)
  }
  return bag
}

export function bagCosine(bag1: Map<string, number>, bag2: Map<string, number>): number {
  if (bag1.size === 0 || bag2.size === 0) return 0

  const allWords = new Set([...bag1.keys(), ...bag2.keys()])

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (const word of allWords) {
    const c1 = bag1.get(word) ?? 0
    const c2 = bag2.get(word) ?? 0
    dotProduct += c1 * c2
    mag1 += c1 * c1
    mag2 += c2 * c2
  }

  if (mag1 === 0 || mag2 === 0) return 0
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))
}

export function tokenise(text: string): Map<string, number> {
  return textToBag(text)
}

// --- Boundary detection ---

/**
 * Detects episode boundaries in a session using semantic similarity.
 * Returns an array of [startIndex, endIndex] tuples.
 */
export async function detectBoundaries(
  turns: Turn[],
  opts: { thresholds?: Partial<Thresholds>, embedder: Embedder }, // Embedder is required
): Promise<Array<[number, number]>> {
  if (turns.length === 0) return []

  const threshold = opts?.thresholds?.boundary ?? DEFAULT_THRESHOLDS.boundary
  
  const ranges: Array<[number, number]> = []
  let currentChunkStart = 0;

  // Pre-calculate all embeddings to do it in one batch call
  const allTexts = turns.map(t => t.text)
  const allVectors = await opts.embedder.embedBatch(allTexts)

  for (let i = 1; i < turns.length; i++) {
    const chunkVectors = allVectors.slice(currentChunkStart, i)
    const chunkVector = averageVectors(chunkVectors)
    const currentTurnVector = allVectors[i]!
    
    const similarity = vectorCosineSimilarity(chunkVector, currentTurnVector)
    
    if (similarity < threshold) {
        ranges.push([currentChunkStart, i - 1]);
        currentChunkStart = i;
    }
  }
  
  ranges.push([currentChunkStart, turns.length - 1]);

  return ranges
}

function vectorCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i]! * vec2[i]!
    mag1 += vec1[i]! * vec1[i]!
    mag2 += vec2[i]! * vec2[i]!
  }
  
  if (mag1 === 0 || mag2 === 0) return 0
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return []
  const dim = vectors[0]!.length
  const avg = new Array(dim).fill(0)
  
  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      avg[i] += vec[i]!
    }
  }
  
  for (let i = 0; i < dim; i++) {
    avg[i] /= vectors.length
  }
  
  return avg
}
