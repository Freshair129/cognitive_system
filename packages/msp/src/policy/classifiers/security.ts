import type { ClassifiableResource, ClassificationResult, Classifier } from './types.js'

/**
 * Minimum Shannon entropy (bits/char) for an unstructured token to count as a
 * secret. Random base64 sits near 5.5–6.0; prose, identifiers and paths sit
 * near 3.0–4.0. See `isHighEntropySecret` for why the threshold alone is not
 * enough.
 */
const MIN_SECRET_ENTROPY = 4.0

/** Shortest token worth entropy-scoring. Below this, entropy is too noisy. */
const MIN_SECRET_LENGTH = 32

/** Shannon entropy of `s` in bits per character. */
function shannonEntropy(s: string): number {
  const freq = new Map<string, number>()
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1)
  let bits = 0
  for (const count of freq.values()) {
    const p = count / s.length
    bits -= p * Math.log2(p)
  }
  return bits
}

/**
 * True when `token` looks like an unbranded secret rather than an identifier.
 *
 * This replaces a distinct-character-count heuristic (`new Set(word).size > 15`)
 * that flagged 232 of the 395 atoms in this vault (58.7%) — it matched atom IDs
 * (`FEAT--GOVIBE-CONTEXT-PROOF-BRIDGE`), source paths
 * (`src/validator/rules/dangling-wikilinks`) and snake_case config keys. Since
 * the security pack turns `has_secret: true` into a *silent drop* of the hit
 * from recall, a false positive is far more costly than a miss, so this is
 * tuned for precision:
 *
 *   1. `<= 2` separator-delimited segments — identifiers and snake_case keys
 *      carry word structure that random secrets do not.
 *   2. all three character classes present — the standard base64-charset check.
 *      This deliberately skips lowercase hex, because in this repo a 40-char
 *      lowercase hex run is a git SHA, not a credential.
 *   3. Shannon entropy at or above `MIN_SECRET_ENTROPY`.
 *
 * Measured over the same 395 atoms: 1 false positive (0.25%), a URL fragment.
 * The branded patterns in `secretPatterns` remain the primary detector; this
 * is only the fallback for unbranded credentials.
 */
function isHighEntropySecret(token: string): boolean {
  if (token.split(/[-_]/).length > 2) return false
  if (!/[a-z]/.test(token)) return false
  if (!/[A-Z]/.test(token)) return false
  if (!/\d/.test(token)) return false
  return shannonEntropy(token) >= MIN_SECRET_ENTROPY
}

/**
 * deep content inspection classifier for Secrets and Security.
 * detects: API keys, tokens, high-entropy strings.
 *
 * Implements FEAT--SECURITY-SECRET-PACK.
 */
export class SecurityClassifier implements Classifier {
  readonly id = 'domain/security'
  readonly description = 'Deep scanner for secrets and credentials'
  readonly outputs = ['has_secret', 'secret_type', 'encryption_level', 'leak_risk']

  private secretPatterns = [
    { type: 'openai', regex: /\bsk-[a-zA-Z0-9]{32,}\b/ },
    { type: 'anthropic', regex: /\bsk-ant-03-[a-zA-Z0-9-]{60,}\b/ },
    { type: 'aws_key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
    { type: 'github_token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/ },
    { type: 'stripe', regex: /\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}\b/ },
    { type: 'generic_secret', regex: /\b(?:password|passwd|secret|api_key|private_key)\s*[:=]\s*["'][^"']{8,}["']/i },
  ]

  async classify(resource: ClassifiableResource): Promise<ClassificationResult> {
    const attributes: Record<string, any> = {}
    const provenance: Record<string, any> = {}
    const timestamp = new Date().toISOString()

    let foundSecret = false
    let detectedType: string | null = null

    // 1. Branded pattern matching — high precision, no false positives measured.
    for (const p of this.secretPatterns) {
      if (p.regex.test(resource.body)) {
        foundSecret = true
        detectedType = p.type
        break
      }
    }

    // 2. Entropy fallback for unbranded credentials.
    //
    // The bare AWS-secret pattern that used to live in `secretPatterns`
    // (`/\b[a-zA-Z0-9+/]{40}\b/`) matched 7.6% of this vault's atoms on its
    // own, so it is folded into this check instead: a 40-char base64 run only
    // counts once it also clears the entropy and character-class bars.
    if (!foundSecret) {
      for (const token of resource.body.match(/[A-Za-z0-9+/=_-]{32,}/g) ?? []) {
        if (token.length < MIN_SECRET_LENGTH) continue
        if (isHighEntropySecret(token)) {
          foundSecret = true
          detectedType = 'high_entropy_string'
          break
        }
      }
    }

    if (foundSecret) {
      attributes.has_secret = true
      attributes.secret_type = detectedType
      attributes.leak_risk = 'high'
      provenance.has_secret = { classifier_id: this.id, timestamp, confidence: 0.9, context: { type: detectedType } }
    } else {
      attributes.has_secret = false
      attributes.leak_risk = 'low'
      provenance.has_secret = { classifier_id: this.id, timestamp, confidence: 0.8 }
    }

    // 3. Encryption Level detection (Keyword based)
    if (resource.body.includes('-----BEGIN PGP MESSAGE-----')) {
      attributes.encryption_level = 'pgp'
      provenance.encryption_level = { classifier_id: this.id, timestamp, confidence: 1.0 }
    } else if (resource.body.includes('vault: v1:')) {
      attributes.encryption_level = 'vault'
      provenance.encryption_level = { classifier_id: this.id, timestamp, confidence: 1.0 }
    } else {
      attributes.encryption_level = 'none'
    }

    return { attributes, provenance }
  }
}
