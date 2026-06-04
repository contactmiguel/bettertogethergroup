import { describe, it, expect, beforeEach, vi } from 'vitest'

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
