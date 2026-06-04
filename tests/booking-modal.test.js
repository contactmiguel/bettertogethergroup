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
