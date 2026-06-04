const VALID_INTENTS = ['personal', 'team', 'both']

function validateIntake(payload) {
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

function buildIntakeRecord(payload) {
  return {
    role: String(payload.role || '').trim(),
    organization: String(payload.organization || '').trim(),
    whatIsNotWorking: String(payload.whatIsNotWorking || '').trim(),
    frictionDimensions: Array.isArray(payload.frictionDimensions)
      ? payload.frictionDimensions.filter(d => d && String(d).trim())
      : [],
    whatHaveYouTried: String(payload.whatHaveYouTried || '').trim(),
    intent: payload.intent,
    source: 'solo site — Calendly intake',
    timestamp: new Date().toISOString(),
  }
}

module.exports = { validateIntake, buildIntakeRecord }
