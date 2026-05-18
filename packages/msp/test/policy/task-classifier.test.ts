import { describe, expect, it } from 'vitest'
import { runClassifiers } from '../../src/policy/classifiers/engine.js'
import { TaskClassifier } from '../../src/policy/classifiers/task.js'
import type { ClassifiableResource } from '../../src/policy/classifiers/types.js'

describe('Task & Management Pack: Classifier', () => {
  const classifiers = [new TaskClassifier()]

  it('detects operational atoms and extracts metadata', async () => {
    const res: ClassifiableResource = {
      id: 'ISSUE--DATABASE-DEADLOCK',
      path: 'gks/issues/ISSUE--DATABASE-DEADLOCK.md',
      body: '# Title',
      attributes: {
        priority: 'urgent',
        status: 'open',
        assignee: 'alice'
      }
    }
    
    const result = await runClassifiers(res, classifiers)
    expect(result.attributes.is_operational).toBe(true)
    expect(result.attributes.issue_priority).toBe('urgent')
    expect(result.attributes.issue_status).toBe('open')
    expect(result.attributes.assignee).toBe('alice')
  })

  it('falls back to body parsing if attributes are missing', async () => {
    const res: ClassifiableResource = {
      id: 'ISSUE--123',
      path: 'gks/issues/ISSUE--123.md',
      body: '---\npriority: high\nstatus: closed\n---\n# Desc'
    }
    
    const result = await runClassifiers(res, classifiers)
    expect(result.attributes.is_operational).toBe(true)
    expect(result.attributes.issue_priority).toBe('high')
    expect(result.attributes.issue_status).toBe('closed')
  })
})
