const VALID_INTENTS = ['personal', 'team', 'both']

export function validateIntake(payload) {
  if (!payload.role || !String(payload.role).trim()) {
    return { ok: false, error: 'role is required' }
  }
  if (!payload.whatIsNotWorking || !String(payload.whatIsNotWorking).trim()) {
    return { ok: false, error: 'whatIsNotWorking is required' }
  }
  if (!payload.intent || !VALID_INTENTS.includes(payload.intent)) {
    return { ok: false, error: `intent must be one of: ${VALID_INTENTS.join(', ')}` }
  }
  return { ok: true }
}

export function buildIntakeRecord(payload) {
  return {
    role: payload.role || '',
    organization: payload.organization || '',
    whatIsNotWorking: payload.whatIsNotWorking || '',
    frictionDimensions: Array.isArray(payload.frictionDimensions) ? payload.frictionDimensions : [],
    whatHaveYouTried: payload.whatHaveYouTried || '',
    intent: payload.intent,
    source: 'solo site — Calendly intake',
    timestamp: new Date().toISOString(),
  }
}
