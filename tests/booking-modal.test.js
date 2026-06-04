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
