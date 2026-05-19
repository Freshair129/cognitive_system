import type { Episode } from '../consolidator/types.js'

/**
 * Pillar 1: CLEAN
 * Removes duplicate turns, noise entries, and low-salience data from the input episodes.
 */
export function cleanEpisodes(episodes: Episode[]): Episode[] {
  if (episodes.length === 0) return []

  // 1. Deduplicate by summary and session_id
  const seen = new Set<string>()
  const unique = episodes.filter((ep) => {
    const key = `${ep.sessionId}:${ep.summary}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 2. Filter by salience (ignore L0 if they have very low score)
  const salienceFiltered = unique.filter((ep) => {
    if (ep.encoding_level === 'L0' && ep.score < 0.3) {
      return false
    }
    return true
  })

  return salienceFiltered
}
