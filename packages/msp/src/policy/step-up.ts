import { randomUUID } from 'node:crypto'
import type { Subject } from './types.js'

export type StepUpMethod = 'pin' | 'totp' | 'passkey' | 'signed-token'

export interface StepUpChallenge {
  id: string
  method: StepUpMethod
  expires_at: Date
  prompt_hash?: string
}

export interface StepUpVerifyResult {
  ok: boolean
  last_step_up_at?: Date
  method?: StepUpMethod
  error?: string
}

/**
 * Step-up authentication provider.
 * See CONCEPT--STEP-UP-AUTH.
 */
export interface StepUpProvider {
  id: string
  methods: StepUpMethod[]
  challenge(subject: Subject, prompt_hash?: string): Promise<StepUpChallenge>
  verify(challenge_id: string, response: string): Promise<StepUpVerifyResult>
}

/**
 * Minimal PIN-based provider for local use.
 */
export class PinProvider implements StepUpProvider {
  readonly id = 'local-pin'
  readonly methods: StepUpMethod[] = ['pin']
  
  private challenges = new Map<string, { pin: string; expires: number }>()

  constructor(private pin: string = '1234') {}

  async challenge(subject: Subject, prompt_hash?: string): Promise<StepUpChallenge> {
    const id = randomUUID()
    const expires = Date.now() + 5 * 60 * 1000 // 5 minutes TTL
    this.challenges.set(id, { pin: this.pin, expires })
    
    return {
      id,
      method: 'pin',
      expires_at: new Date(expires),
      prompt_hash,
    }
  }

  async verify(challenge_id: string, response: string): Promise<StepUpVerifyResult> {
    const stored = this.challenges.get(challenge_id)
    if (!stored) return { ok: false, error: 'Challenge not found' }
    
    if (Date.now() > stored.expires) {
      this.challenges.delete(challenge_id)
      return { ok: false, error: 'Challenge expired' }
    }

    if (response === stored.pin) {
      this.challenges.delete(challenge_id)
      return { ok: true, last_step_up_at: new Date(), method: 'pin' }
    }

    return { ok: false, error: 'Invalid PIN' }
  }
}
