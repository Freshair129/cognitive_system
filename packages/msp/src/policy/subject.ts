import { makeSubject, type Subject } from './types.js'
import type { Identity } from '../identity/types.js'

/**
 * Hydrate a Subject from an authenticated Identity.
 *
 * Per BLUEPRINT--PHASE-4-USER-ABAC, this maps an authenticated identity
 * (roles, clearance, mfa_status, tenant_ids) into the Subject AttributeBag.
 */
export function hydrateSubject(identity: Identity): Subject {
  const { profile } = identity

  return makeSubject('user', profile.name || 'anonymous', {
    role: profile.role,
    tier: profile.tier,
    roles: profile.roles || [],
    clearance: profile.clearance ?? 0,
    mfa_status: profile.mfaStatus ?? false,
    tenant_ids: profile.tenantIds || [],
  })
}
