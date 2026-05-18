/**
 * Utility for determining the atrophy (expiry) status of an atom.
 * Shared between the VALID-UNTIL protocol and the msp-atrophy CLI.
 */

export enum AtrophyStatus {
  HEALTHY = 'healthy',
  NEAR_EXPIRY = 'near_expiry',
  EXPIRED = 'expired',
}

export interface AtrophyResult {
  status: AtrophyStatus
  daysUntilExpiry: number // negative means days since expiry
  validUntil: string
}

const MS_PER_DAY = 86_400_000
export const DEFAULT_NEAR_EXPIRY_DAYS = 30

/**
 * Calculates the atrophy status for a given expiry date string.
 */
export function getAtrophyStatus(
  validUntilRaw: string,
  now: Date,
  nearExpiryThreshold: number = DEFAULT_NEAR_EXPIRY_DAYS,
): AtrophyResult | null {
  const expiry = new Date(validUntilRaw)
  if (Number.isNaN(expiry.getTime())) return null

  // Calculate difference in whole days
  const diffMs = expiry.getTime() - now.getTime()
  const daysUntilExpiry = Math.floor(diffMs / MS_PER_DAY)

  let status: AtrophyStatus = AtrophyStatus.HEALTHY
  if (daysUntilExpiry < 0) {
    status = AtrophyStatus.EXPIRED
  } else if (daysUntilExpiry < nearExpiryThreshold) {
    status = AtrophyStatus.NEAR_EXPIRY
  }

  return {
    status,
    daysUntilExpiry,
    validUntil: validUntilRaw,
  }
}

/**
 * Normalises raw frontmatter values into a valid ISO-8601 string or null.
 */
export function parseValidUntil(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString()
  }
  return null
}
