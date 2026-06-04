# Booking Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-step qualification-first booking modal to all "Book an Intro Session" CTAs site-wide, collecting ATTUNE intake data before routing to a Calendly embed.

**Architecture:** A single shared `booking-modal.js` injects the modal HTML into every page, manages the 3-step flow (form → fixed response → Calendly embed), and fires intake data to a POST handler added to `api/index.js`. No new pages, no redirects — everything stays in-modal.

**Tech Stack:** Vanilla JS, Tailwind CSS (CDN), Vercel Node.js serverless via existing `api/index.js`, Vitest + jsdom for tests, Calendly inline widget.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `booking-modal.js` | Create | HTML template, open/close, 3-step flow, Calendly embed injection |
| `api/index.js` | Modify | Add `POST /api/intake` handler branch |
| `api/intake-handler.js` | Create | Pure intake logic (validate, log, stub CRM) — importable for testing |
| `tests/intake-handler.test.js` | Create | Unit tests for intake validation |
| `tests/booking-modal.test.js` | Create | DOM tests for modal flow |
| `index.html` | Modify | Add `<script src="/booking-modal.js">`, swap CTA triggers |
| `advisory.html` | Modify | Same |
| `about.html` | Modify | Same |
| `insights.html` | Modify | Same |
| `package.json` | Modify | Add vitest + jsdom dev dependencies |

---

## Task 1: Install test dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Add vitest and jsdom to package.json**

Replace the entire contents of `package.json` with:

```json
{
  "name": "bettertogethergroup",
  "version": "1.0.0",
  "description": "Better Together Group - Executive Advisory Website",
  "scripts": {
    "build": "echo 'Static site - no build needed'",
    "start": "node api/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["executive", "advisory", "leadership"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, vitest and jsdom present.

- [ ] **Step 4: Verify test runner works**

Create a smoke-test file `tests/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'
describe('smoke', () => {
  it('runs', () => expect(true).toBe(true))
})
```

Run: `npm test`

Expected output includes: `1 passed`

- [ ] **Step 5: Delete smoke test**

Delete `tests/smoke.test.js`.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.js
git commit -m "chore: add vitest + jsdom for testing"
```

---

## Task 2: Create intake handler (pure logic, testable)

**Files:**
- Create: `api/intake-handler.js`
- Create: `tests/intake-handler.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/intake-handler.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL with `Cannot find module '../api/intake-handler.js'`

- [ ] **Step 3: Create `api/intake-handler.js`**

```js
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

module.exports = { validateIntake, buildIntakeRecord }
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add api/intake-handler.js tests/intake-handler.test.js
git commit -m "feat: add intake validation and record builder with tests"
```

---

## Task 3: Wire POST /api/intake into api/index.js

**Files:**
- Modify: `api/index.js`

- [ ] **Step 1: Add intake route handler at the top of the request handler**

Open `api/index.js`. After `let urlPath = req.url.split('?')[0]` and the root redirect, add this block **before** the static/HTML routing logic:

```js
// POST /api/intake — intake form submission
if (req.method === 'POST' && urlPath === '/api/intake') {
  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  req.on('end', () => {
    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'invalid JSON' }))
      return
    }

    const { validateIntake, buildIntakeRecord } = require('./intake-handler')
    const validation = validateIntake(payload)
    if (!validation.ok) {
      res.writeHead(422, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(validation))
      return
    }

    const record = buildIntakeRecord(payload)
    console.log('[intake]', JSON.stringify(record, null, 2))

    // TODO(CRM_INTEGRATION): replace console.log with CRM/email push
    // Notification email: claudia.beck@bettertogethergroup.co
    // Tag: source = "solo site — Calendly intake"

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  })
  return
}
```

The full modified top of the request handler should look like:

```js
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]

  if (urlPath === '/') {
    urlPath = '/index.html'
  }

  // POST /api/intake — intake form submission
  if (req.method === 'POST' && urlPath === '/api/intake') {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      let payload
      try {
        payload = JSON.parse(body)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'invalid JSON' }))
        return
      }

      const { validateIntake, buildIntakeRecord } = require('./intake-handler')
      const validation = validateIntake(payload)
      if (!validation.ok) {
        res.writeHead(422, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(validation))
        return
      }

      const record = buildIntakeRecord(payload)
      console.log('[intake]', JSON.stringify(record, null, 2))

      // TODO(CRM_INTEGRATION): replace console.log with CRM/email push
      // Notification email: claudia.beck@bettertogethergroup.co
      // Tag: source = "solo site — Calendly intake"

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
    return
  }

  // ... rest of existing handler unchanged
```

- [ ] **Step 2: Commit**

```bash
git add api/index.js
git commit -m "feat: add POST /api/intake handler"
```

---

## Task 4: booking-modal.js — scaffold (inject, open, close)

**Files:**
- Create: `booking-modal.js`
- Create: `tests/booking-modal.test.js`

- [ ] **Step 1: Write failing DOM tests for open/close**

Create `tests/booking-modal.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'

// booking-modal.js uses DOMContentLoaded — simulate by calling the exported init
// We import after setting up DOM so the module sees our document
let init

beforeEach(async () => {
  document.body.innerHTML = `
    <button data-booking-trigger>Book</button>
    <button data-booking-trigger>Book 2</button>
  `
  // Re-import fresh each test
  vi.resetModules()
  const mod = await import('../booking-modal.js')
  init = mod.init
  init()
})

describe('modal scaffold', () => {
  it('injects #booking-modal into the DOM', () => {
    expect(document.getElementById('booking-modal')).not.toBeNull()
  })

  it('modal is hidden on load', () => {
    const modal = document.getElementById('booking-modal')
    expect(modal.classList.contains('hidden')).toBe(true)
  })

  it('openBookingModal removes hidden class', () => {
    window.openBookingModal()
    const modal = document.getElementById('booking-modal')
    expect(modal.classList.contains('hidden')).toBe(false)
  })

  it('close button adds hidden class', () => {
    window.openBookingModal()
    document.getElementById('booking-modal-close').click()
    const modal = document.getElementById('booking-modal')
    expect(modal.classList.contains('hidden')).toBe(true)
  })

  it('clicking backdrop adds hidden class', () => {
    window.openBookingModal()
    document.getElementById('booking-modal-backdrop').click()
    const modal = document.getElementById('booking-modal')
    expect(modal.classList.contains('hidden')).toBe(true)
  })

  it('data-booking-trigger buttons call openBookingModal', () => {
    const triggers = document.querySelectorAll('[data-booking-trigger]')
    triggers[0].click()
    const modal = document.getElementById('booking-modal')
    expect(modal.classList.contains('hidden')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL with `Cannot find module '../booking-modal.js'`

- [ ] **Step 3: Create booking-modal.js with scaffold**

```js
(function () {
  const TEMPLATE = `
<div id="booking-modal" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
  <div id="booking-modal-backdrop" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
  <div class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container border border-outline-variant rounded-lg shadow-2xl">
    <button id="booking-modal-close" aria-label="Close"
      class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface text-2xl leading-none cursor-pointer z-10">×</button>
    <div id="booking-modal-body" class="p-8 md:p-12"></div>
  </div>
</div>
`

  function inject() {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = TEMPLATE
    document.body.appendChild(wrapper.firstElementChild)
  }

  function openBookingModal() {
    const modal = document.getElementById('booking-modal')
    modal.classList.remove('hidden')
    showStep1()
  }

  function closeModal() {
    document.getElementById('booking-modal').classList.add('hidden')
  }

  function showStep1() {
    // populated in Task 5
    document.getElementById('booking-modal-body').innerHTML = '<p class="text-on-surface">Loading…</p>'
  }

  function bindTriggers() {
    document.querySelectorAll('[data-booking-trigger]').forEach(el => {
      el.addEventListener('click', openBookingModal)
    })
  }

  function init() {
    inject()
    document.getElementById('booking-modal-close').addEventListener('click', closeModal)
    document.getElementById('booking-modal-backdrop').addEventListener('click', closeModal)
    bindTriggers()
  }

  if (typeof window !== 'undefined') {
    window.openBookingModal = openBookingModal
  }

  if (typeof module !== 'undefined') {
    module.exports = { init }
  } else {
    document.addEventListener('DOMContentLoaded', init)
  }
})()
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: `6 passed` (scaffold tests) + `7 passed` (intake tests) = `13 passed`

- [ ] **Step 5: Commit**

```bash
git add booking-modal.js tests/booking-modal.test.js
git commit -m "feat: booking modal scaffold — inject, open, close"
```

---

## Task 5: booking-modal.js — Step 1 intake form

**Files:**
- Modify: `booking-modal.js`
- Modify: `tests/booking-modal.test.js`

- [ ] **Step 1: Add Step 1 form tests**

Append to `tests/booking-modal.test.js`:

```js
describe('step 1 — intake form', () => {
  beforeEach(() => {
    window.openBookingModal()
  })

  it('renders the Quick intake. headline', () => {
    expect(document.getElementById('booking-modal-body').innerHTML).toContain('Quick intake.')
  })

  it('renders the verbatim intro copy', () => {
    const body = document.getElementById('booking-modal-body').innerHTML
    expect(body).toContain('Effective executive advisory requires mutual fit.')
  })

  it('Continue button is disabled when required fields are empty', () => {
    const btn = document.getElementById('bm-submit')
    expect(btn.disabled).toBe(true)
  })

  it('Continue button enables when role + whatIsNotWorking + intent are filled', () => {
    document.getElementById('bm-role').value = 'CEO'
    document.getElementById('bm-role').dispatchEvent(new Event('input'))
    document.getElementById('bm-what-not-working').value = 'Trust issues'
    document.getElementById('bm-what-not-working').dispatchEvent(new Event('input'))
    document.querySelector('[name="bm-intent"][value="personal"]').checked = true
    document.querySelector('[name="bm-intent"][value="personal"]').dispatchEvent(new Event('change'))
    const btn = document.getElementById('bm-submit')
    expect(btn.disabled).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — verify new tests fail**

Run: `npm test`

Expected: new `step 1` tests FAIL (form not yet rendered).

- [ ] **Step 3: Replace showStep1() in booking-modal.js**

Replace the `showStep1` function with:

```js
  function showStep1() {
    document.getElementById('booking-modal-body').innerHTML = `
      <h2 class="font-display-sm text-display-sm text-on-surface mb-3" style="font-family:'Source Serif 4',serif">Quick intake.</h2>
      <p class="text-on-surface-variant font-body-md text-body-md mb-8">Effective executive advisory requires mutual fit. Tell us about you and the context of your inquiry.</p>
      <form id="bm-form" novalidate class="space-y-7">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-on-surface-variant font-label-md text-label-md mb-1" for="bm-role">Current role <span class="text-executive-gold">*</span></label>
            <input id="bm-role" type="text" placeholder="e.g. Chief Operating Officer"
              class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors" />
          </div>
          <div>
            <label class="block text-on-surface-variant font-label-md text-label-md mb-1" for="bm-organization">Organization</label>
            <input id="bm-organization" type="text" placeholder="Company or institution"
              class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors" />
          </div>
        </div>
        <div>
          <label class="block text-on-surface-variant font-label-md text-label-md mb-1" for="bm-what-not-working">What's not working — and what do you suspect is really behind it? <span class="text-executive-gold">*</span></label>
          <textarea id="bm-what-not-working" rows="4" placeholder="Be candid."
            class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors resize-none"></textarea>
        </div>
        <div>
          <p class="text-on-surface-variant font-label-md text-label-md mb-3">Where do you feel the most friction right now? <span class="text-platinum-gray/40 font-normal">(Select all that apply)</span></p>
          <div class="space-y-2">
            ${[
              'Reacting before I see the full picture clearly',
              'My communication is creating the wrong climate',
              'Trust has eroded — with me, my team, or both',
              'I\'m missing what\'s really going on beneath the surface',
              'There are things that need to be said that aren\'t being said',
              'I\'m leading from pressure, not from clarity',
            ].map(opt => `
            <label class="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="bm-friction" value="${opt}"
                class="mt-0.5 accent-[#C5A059] w-4 h-4 flex-shrink-0" />
              <span class="text-on-surface-variant font-body-md text-body-md group-hover:text-on-surface transition-colors">${opt}</span>
            </label>`).join('')}
          </div>
        </div>
        <div>
          <label class="block text-on-surface-variant font-label-md text-label-md mb-1" for="bm-tried">What have you already tried, and why hasn't it been enough?</label>
          <textarea id="bm-tried" rows="3" placeholder="Coaching, leadership programs, restructuring…"
            class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors resize-none"></textarea>
        </div>
        <div>
          <p class="text-on-surface-variant font-label-md text-label-md mb-3">Is this primarily a personal leadership challenge, or does it involve your team's dynamics? <span class="text-executive-gold">*</span></p>
          <div class="space-y-2">
            ${[
              { value: 'personal', label: 'Personal — this is mine to navigate' },
              { value: 'team',    label: 'It involves my team' },
              { value: 'both',   label: 'Both' },
            ].map(opt => `
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="bm-intent" value="${opt.value}"
                class="accent-[#C5A059] w-4 h-4 flex-shrink-0" />
              <span class="text-on-surface-variant font-body-md text-body-md group-hover:text-on-surface transition-colors">${opt.label}</span>
            </label>`).join('')}
          </div>
        </div>
        <button id="bm-submit" type="submit" disabled
          class="w-full bg-executive-gold text-deep-navy px-8 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100">
          Continue →
        </button>
      </form>
    `
    bindStep1()
  }

  function checkStep1Validity() {
    const role = (document.getElementById('bm-role')?.value || '').trim()
    const what = (document.getElementById('bm-what-not-working')?.value || '').trim()
    const intent = document.querySelector('[name="bm-intent"]:checked')
    const btn = document.getElementById('bm-submit')
    if (btn) btn.disabled = !(role && what && intent)
  }

  function bindStep1() {
    document.getElementById('bm-role')?.addEventListener('input', checkStep1Validity)
    document.getElementById('bm-what-not-working')?.addEventListener('input', checkStep1Validity)
    document.querySelectorAll('[name="bm-intent"]').forEach(r => r.addEventListener('change', checkStep1Validity))
    document.getElementById('bm-form')?.addEventListener('submit', handleStep1Submit)
  }

  function handleStep1Submit(e) {
    e.preventDefault()
    // populated in Task 6
  }
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: all tests pass including `step 1` group.

- [ ] **Step 5: Commit**

```bash
git add booking-modal.js tests/booking-modal.test.js
git commit -m "feat: booking modal step 1 — intake form with validation"
```

---

## Task 6: booking-modal.js — form submission + Step 2 transition

**Files:**
- Modify: `booking-modal.js`
- Modify: `tests/booking-modal.test.js`

- [ ] **Step 1: Add Step 2 transition tests**

Append to `tests/booking-modal.test.js`:

```js
describe('step 2 — confirmation + calendly', () => {
  beforeEach(() => {
    // Stub fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    // Stub Calendly
    window.Calendly = { initInlineWidget: vi.fn() }
    window.openBookingModal()
    // Fill required fields
    document.getElementById('bm-role').value = 'CEO'
    document.getElementById('bm-role').dispatchEvent(new Event('input'))
    document.getElementById('bm-what-not-working').value = 'Trust issues'
    document.getElementById('bm-what-not-working').dispatchEvent(new Event('input'))
    document.querySelector('[name="bm-intent"][value="personal"]').checked = true
    document.querySelector('[name="bm-intent"][value="personal"]').dispatchEvent(new Event('change'))
  })

  it('POSTs to /api/intake on submit', async () => {
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/intake',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows verbatim confirmation text after submit', async () => {
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    const body = document.getElementById('booking-modal-body').innerHTML
    expect(body).toContain('Thanks for providing clarity.')
    expect(body).toContain("We look forward to a productive session. Let's find a time.")
  })

  it('calls Calendly.initInlineWidget with individual URL for personal intent', async () => {
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    expect(window.Calendly.initInlineWidget).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://calendly.com/claudiabeck/30-min-check-in' })
    )
  })

  it('does NOT show team door for personal intent', async () => {
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    expect(document.getElementById('bm-team-door')).toBeNull()
  })

  it('shows team door for team intent', async () => {
    document.querySelector('[name="bm-intent"][value="personal"]').checked = false
    document.querySelector('[name="bm-intent"][value="team"]').checked = true
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    expect(document.getElementById('bm-team-door')).not.toBeNull()
  })

  it('shows team door for both intent', async () => {
    document.querySelector('[name="bm-intent"][value="personal"]').checked = false
    document.querySelector('[name="bm-intent"][value="both"]').checked = true
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    expect(document.getElementById('bm-team-door')).not.toBeNull()
  })

  it('team door link has correct UTM-tagged href', async () => {
    document.querySelector('[name="bm-intent"][value="personal"]').checked = false
    document.querySelector('[name="bm-intent"][value="team"]').checked = true
    document.getElementById('bm-form').dispatchEvent(new Event('submit', { bubbles: true }))
    await new Promise(r => setTimeout(r, 0))
    const link = document.querySelector('#bm-team-door a')
    expect(link.href).toContain('attuneleadership.vercel.app')
    expect(link.href).toContain('utm_source=btg-site')
    expect(link.href).toContain('utm_medium=booking-modal')
    expect(link.href).toContain('utm_campaign=team-door')
  })
})
```

- [ ] **Step 2: Run tests — verify new tests fail**

Run: `npm test`

Expected: `step 2` tests FAIL.

- [ ] **Step 3: Implement handleStep1Submit and showStep2 in booking-modal.js**

Replace the stub `handleStep1Submit` function and add `showStep2`:

```js
  function handleStep1Submit(e) {
    e.preventDefault()

    const payload = {
      role: document.getElementById('bm-role').value.trim(),
      organization: document.getElementById('bm-organization').value.trim(),
      whatIsNotWorking: document.getElementById('bm-what-not-working').value.trim(),
      frictionDimensions: Array.from(document.querySelectorAll('[name="bm-friction"]:checked')).map(cb => cb.value),
      whatHaveYouTried: document.getElementById('bm-tried').value.trim(),
      intent: document.querySelector('[name="bm-intent"]:checked').value,
    }

    // Fire-and-forget — does not block transition to Step 2
    fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => { /* silent — data capture best-effort */ })

    showStep2(payload.intent)
  }

  function showStep2(intent) {
    const showTeamDoor = intent === 'team' || intent === 'both'

    document.getElementById('booking-modal-body').innerHTML = `
      <p class="text-on-surface font-body-lg text-body-lg mb-8" style="font-family:'Source Serif 4',serif">
        Thanks for providing clarity. We look forward to a productive session. Let's find a time.
      </p>
      <div id="bm-calendly-container" style="min-height:630px"></div>
      ${showTeamDoor ? `
      <div id="bm-team-door" class="mt-6 pt-6 border-t border-outline-variant text-center">
        <p class="text-on-surface-variant font-body-md text-body-md">
          Also thinking about your team? 
          <a href="https://attuneleadership.vercel.app?utm_source=btg-site&utm_medium=booking-modal&utm_campaign=team-door"
             target="_blank" rel="noopener noreferrer"
             class="text-executive-gold hover:brightness-110 transition-colors">
            Explore the A.T.T.U.N.E.™ team assessment →
          </a>
        </p>
      </div>` : ''}
    `

    loadCalendly('https://calendly.com/claudiabeck/30-min-check-in')
  }

  function loadCalendly(url) {
    if (window.Calendly) {
      window.Calendly.initInlineWidget({
        url,
        parentElement: document.getElementById('bm-calendly-container'),
      })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.onload = () => {
      window.Calendly.initInlineWidget({
        url,
        parentElement: document.getElementById('bm-calendly-container'),
      })
    }
    document.head.appendChild(script)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    document.head.appendChild(link)
  }
```

- [ ] **Step 4: Run tests — verify all pass**

Run: `npm test`

Expected: all tests pass (scaffold + intake + step1 + step2).

- [ ] **Step 5: Commit**

```bash
git add booking-modal.js tests/booking-modal.test.js
git commit -m "feat: booking modal step 2 — confirmation, Calendly embed, team door"
```

---

## Task 7: Wire data-booking-trigger in all 4 HTML pages

**Files:**
- Modify: `index.html`
- Modify: `advisory.html`
- Modify: `about.html`
- Modify: `insights.html`

For each file, make two changes:

**Change A** — Add the script tag as the last line before `</body>`:
```html
<script src="/booking-modal.js"></script>
</body>
```

**Change B** — Swap every "Book an Intro Session" / "Book an Intro Session" CTA to use `data-booking-trigger`. The patterns to find and replace are shown per-file below.

### index.html

Find (nav CTA — an `<a>` tag):
```html
<a href="advisory.html" class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

Find (hero CTA):
```html
<a href="advisory.html" class="bg-executive-gold text-deep-navy px-8 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-8 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

Find (bottom CTA):
```html
<a href="advisory.html" class="bg-executive-gold text-deep-navy px-12 py-5 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-12 py-5 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all duration-200">Book an Intro Session</button>
```

### advisory.html

Find (nav CTA — a `<button>` with `onclick`):
```html
<button onclick="window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})" class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

Find (hero CTA — `button` with `onclick`):
```html
<button onclick="document.querySelector('#cta-section').scrollIntoView({behavior:'smooth'})" class="bg-executive-gold text-deep-navy px-10 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-10 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

Find (bottom CTA):
```html
<button class="bg-executive-gold text-deep-navy px-12 py-5 font-label-md text-label-md text-lg cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 mb-6">Book an Intro Session</button>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-12 py-5 font-label-md text-label-md text-lg cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 mb-6">Book an Intro Session</button>
```

### about.html

Find (nav CTA):
```html
<a href="advisory.html" class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

### insights.html

Find (nav CTA):
```html
<a href="advisory.html" class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="bg-executive-gold text-deep-navy px-6 py-3 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">Book an Intro Session</button>
```

Find (bottom CTA `<a>` tag):
```html
<a href="advisory.html" class="border border-subtle-slate/40 text-platinum-gray px-10 py-4 font-label-md text-label-md hover:bg-white/5 transition-all duration-200 inline-block">Book an Intro Session</a>
```
Replace with:
```html
<button data-booking-trigger class="border border-subtle-slate/40 text-platinum-gray px-10 py-4 font-label-md text-label-md hover:bg-white/5 transition-all duration-200">Book an Intro Session</button>
```

- [ ] **Step 1: Make all edits to all 4 HTML files** (using Edit tool per file)

- [ ] **Step 2: Visually verify by opening each page in a browser**

Open `http://localhost:3000` (run `npm start`). On each page:
- Click any "Book an Intro Session" button → modal should open
- Fill Q1 (role) + Q3 (what's not working) + Q6 (intent) → Continue button should enable
- Click Continue → step 2 should show the fixed response text + Calendly embed
- Select "It involves my team" or "Both" → team door line should appear
- Click × or backdrop → modal should close

- [ ] **Step 3: Commit**

```bash
git add index.html advisory.html about.html insights.html
git commit -m "feat: wire data-booking-trigger CTAs across all pages"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|-----------------|-----------|
| Modal triggered by CTA — no standalone redirect | Task 7 (data-booking-trigger replaces all hrefs) |
| Form intro copy verbatim | Task 5 (showStep1 template) |
| Q1–Q6 in order | Task 5 (showStep1 template) |
| Q4 exact checkbox copy | Task 5 (showStep1 template, array map) |
| Q6 exact radio copy | Task 5 (showStep1 template, array map) |
| Submit label "Continue →" | Task 5 |
| Q1 + Q3 + Q6 required, submit disabled | Task 5 (checkStep1Validity) |
| Fire-and-forget POST before Calendly | Task 6 (handleStep1Submit) |
| Fixed response verbatim | Task 6 (showStep2) |
| Calendly inline embed | Task 6 (loadCalendly) |
| Q6 personal → individual URL | Task 6 (showStep2, tested) |
| Q6 team/both → same URL + team door | Task 6 (showStep2, tested) |
| Team door copy verbatim | Task 6 (showStep2) |
| Team door UTM-tagged link | Task 6 (showStep2, tested) |
| Team door opens new tab | Task 6 (target="_blank") |
| All intake data captured regardless of booking | Task 6 (fetch fires before Calendly) |
| No personal data in URL params | Task 6 (POST body only) |
| source: "solo site — Calendly intake" tag | Task 2 (buildIntakeRecord) |
| CRM stub with clear marker | Task 3 (TODO(CRM_INTEGRATION) comment) |
| Notification email slot | Task 3 (comment in api/index.js) |
