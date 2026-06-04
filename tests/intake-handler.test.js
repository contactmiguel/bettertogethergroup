import { describe, it, expect } from 'vitest'
import { validateIntake, buildIntakeRecord } from '../api/intake-handler.js'

describe('validateIntake', () => {
  it('returns ok for valid payload', () => {
    const payload = {
      role: 'VP Engineering',
      organization: 'Acme Corp',
      whatIsNotWorking: 'Team is not aligned',
      frictionDimensions: ['I am leading from pressure, not from clarity'],
      whatHaveYouTried: 'Offsite',
      intent: 'personal',
    }
    expect(validateIntake(payload)).toEqual({ ok: true })
  })

  it('rejects missing role', () => {
    const payload = { whatIsNotWorking: 'X', intent: 'personal' }
    const result = validateIntake(payload)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/role/)
  })

  it('rejects missing whatIsNotWorking', () => {
    const payload = { role: 'CEO', intent: 'personal' }
    const result = validateIntake(payload)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/whatIsNotWorking/)
  })

  it('rejects missing intent', () => {
    const payload = { role: 'CEO', whatIsNotWorking: 'X' }
    const result = validateIntake(payload)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/intent/)
  })

  it('rejects invalid intent value', () => {
    const payload = { role: 'CEO', whatIsNotWorking: 'X', intent: 'unknown' }
    const result = validateIntake(payload)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/intent/)
  })
})

describe('buildIntakeRecord', () => {
  it('includes source tag', () => {
    const payload = { role: 'CEO', whatIsNotWorking: 'X', intent: 'both' }
    const record = buildIntakeRecord(payload)
    expect(record.source).toBe('solo site — Calendly intake')
  })

  it('includes timestamp as ISO string', () => {
    const payload = { role: 'CEO', whatIsNotWorking: 'X', intent: 'team' }
    const record = buildIntakeRecord(payload)
    expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('preserves all payload fields', () => {
    const payload = {
      role: 'CTO',
      organization: 'Acme',
      whatIsNotWorking: 'Trust',
      frictionDimensions: ['Trust has eroded — with me, my team, or both'],
      whatHaveYouTried: 'Team building',
      intent: 'both',
    }
    const record = buildIntakeRecord(payload)
    expect(record.role).toBe('CTO')
    expect(record.organization).toBe('Acme')
    expect(record.whatIsNotWorking).toBe('Trust')
    expect(record.frictionDimensions).toEqual(payload.frictionDimensions)
    expect(record.whatHaveYouTried).toBe('Team building')
    expect(record.intent).toBe('both')
  })
})
