(function () {
  var _step2Intent = null  // retained across booking flow for post-booking view

  const TEMPLATE = `
<div id="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-headline" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
  <div id="booking-modal-backdrop" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
  <div tabindex="-1" id="booking-modal-panel" class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container border border-outline-variant rounded-lg shadow-2xl">
    <button id="booking-modal-close" aria-label="Close"
      class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface text-2xl leading-none cursor-pointer z-10">×</button>
    <div id="booking-modal-body" class="p-8 md:p-12"></div>
  </div>
</div>
`

  function inject() {
    if (document.getElementById('booking-modal')) return
    const wrapper = document.createElement('div')
    wrapper.innerHTML = TEMPLATE
    document.body.appendChild(wrapper.firstElementChild)
  }

  function openBookingModal() {
    const modal = document.getElementById('booking-modal')
    if (!modal) return
    const isAlreadyOpen = !modal.classList.contains('hidden')
    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
    if (!isAlreadyOpen) showStep1()
    const panel = modal.querySelector('[tabindex="-1"]')
    if (panel) panel.focus()
  }

  function closeModal() {
    const modal = document.getElementById('booking-modal')
    if (!modal) return
    modal.classList.add('hidden')
    document.body.style.overflow = ''
    // Restore vertical centering for Step 1 on next open
    modal.classList.add('items-center')
    modal.classList.remove('items-start', 'py-4')
    const panel = document.getElementById('booking-modal-panel')
    if (panel) {
      panel.classList.add('max-h-[90vh]')
      panel.classList.remove('my-4')
    }
  }

  function showStep1() {
    document.getElementById('booking-modal-body').innerHTML = `
      <h2 id="booking-modal-headline" class="text-xl font-bold text-on-surface mb-3 tracking-tight">Quick intake.</h2>
      <p class="text-on-surface-variant font-body-md text-body-md mb-8">Effective executive advisory requires mutual fit. Tell us about you and the context of your inquiry.</p>
      <form id="bm-form" novalidate class="space-y-7">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-on-surface font-body-lg font-semibold mb-1" for="bm-role">Current role <span class="text-executive-gold">*</span></label>
            <input id="bm-role" type="text" placeholder="e.g. Chief Operating Officer"
              class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors" />
          </div>
          <div>
            <label class="block text-on-surface font-body-lg font-semibold mb-1" for="bm-organization">Organization</label>
            <input id="bm-organization" type="text" placeholder="Company or institution"
              class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors" />
          </div>
        </div>
        <div>
          <label class="block text-on-surface font-body-lg font-semibold mb-2" for="bm-what-not-working">What's not working — and what do you suspect is really behind it? <span class="text-executive-gold">*</span></label>
          <textarea id="bm-what-not-working" rows="4" placeholder="Be candid."
            class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors resize-none"></textarea>
        </div>
        <div>
          <p class="text-on-surface font-body-lg font-semibold mb-3">Where do you feel the most friction right now? <span class="text-platinum-gray/40 text-sm font-normal">(Select all that apply)</span></p>
          <div class="space-y-2">
            ${[
              'Reacting before I see the full picture clearly',
              'My communication is creating the wrong climate',
              'Trust has eroded — with me, my team, or both',
              "I'm missing what's really going on beneath the surface",
              'There are things that need to be said that aren\'t being said',
              "I'm leading from pressure, not from clarity",
            ].map(opt => `
            <label class="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="bm-friction" value="${opt}"
                class="mt-0.5 accent-executive-gold w-4 h-4 flex-shrink-0" />
              <span class="text-on-surface-variant font-body-md text-body-md group-hover:text-on-surface transition-colors">${opt}</span>
            </label>`).join('')}
          </div>
        </div>
        <div>
          <label class="block text-on-surface font-body-lg font-semibold mb-2" for="bm-tried">What have you already tried, and why hasn't it been enough?</label>
          <textarea id="bm-tried" rows="3" placeholder="Coaching, leadership programs, restructuring…"
            class="w-full bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 font-body-md text-body-md focus:outline-none focus:border-executive-gold transition-colors resize-none"></textarea>
        </div>
        <div>
          <p class="text-on-surface font-body-lg font-semibold mb-3">Is this primarily a personal leadership challenge, or does it involve your team's dynamics? <span class="text-executive-gold">*</span></p>
          <div class="space-y-2">
            ${[
              { value: 'personal', label: 'Personal — this is mine to navigate' },
              { value: 'team',    label: 'It involves my team' },
              { value: 'both',   label: 'Both' },
            ].map(opt => `
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="bm-intent" value="${opt.value}"
                class="accent-executive-gold w-4 h-4 flex-shrink-0" />
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

    const payload = {
      role: document.getElementById('bm-role').value.trim(),
      organization: document.getElementById('bm-organization').value.trim(),
      whatIsNotWorking: document.getElementById('bm-what-not-working').value.trim(),
      frictionDimensions: Array.from(document.querySelectorAll('[name="bm-friction"]:checked')).map(function(cb) { return cb.value }),
      whatHaveYouTried: document.getElementById('bm-tried').value.trim(),
      intent: document.querySelector('[name="bm-intent"]:checked').value,
    }

    // Fire-and-forget — does not block transition to Step 2
    fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(function() { /* silent — data capture best-effort */ })

    showStep2(payload.intent)
  }

  function showStep2(intent) {
    _step2Intent = intent

    // Anchor modal to top so tall Calendly content doesn't clip above the viewport
    const modal = document.getElementById('booking-modal')
    if (modal) {
      modal.classList.remove('items-center')
      modal.classList.add('items-start', 'py-4')
    }
    // Restore height cap so panel scrolls internally rather than overflowing
    const panel = document.getElementById('booking-modal-panel')
    if (panel) {
      panel.classList.remove('my-4')
      panel.classList.add('max-h-[90vh]')
    }

    // Pre-booking: just confirmation text + Calendly embed
    // Team door and close CTA appear only after booking is confirmed (showPostBooking)
    document.getElementById('booking-modal-body').innerHTML =
      '<p id="booking-modal-headline" class="text-on-surface font-body-lg text-body-lg mb-6" style="font-family:\'Source Serif 4\',serif">' +
      'Thanks for providing clarity. We look forward to a productive session. Let\'s find a time.' +
      '</p>' +
      '<div id="bm-calendly-container" style="min-width:320px;height:700px;"></div>' +
      '<div id="bm-post-booking" class="mt-6"></div>'

    loadCalendly('https://calendly.com/claudiabeck/30-min-check-in')
    listenForBookingConfirmed()
  }

  function showPostBooking() {
    // Collapse the Calendly iframe — it already shows "You are scheduled!"
    const container = document.getElementById('bm-calendly-container')
    if (container) {
      container.style.height = '160px'
      container.style.minHeight = '0'
      container.style.overflow = 'hidden'
      container.style.opacity = '0.6'
      container.style.pointerEvents = 'none'
    }

    const teamDoorHTML = (_step2Intent === 'team' || _step2Intent === 'both')
      ? '<div class="mb-6 pb-6 border-b border-outline-variant">' +
        '<p class="text-on-surface font-body-lg text-body-lg mb-2">Also thinking about your team?</p>' +
        '<a href="https://attuneleadership.vercel.app?utm_source=btg-site&utm_medium=booking-modal&utm_campaign=team-door"' +
        ' target="_blank" rel="noopener noreferrer"' +
        ' class="text-executive-gold hover:brightness-110 transition-colors">' +
        'Explore the A.T.T.U.N.E.™ team assessment →' +
        '</a></div>'
      : ''

    const postBooking = document.getElementById('bm-post-booking')
    if (postBooking) {
      postBooking.innerHTML =
        teamDoorHTML +
        '<div class="text-center">' +
        '<button type="button" onclick="document.getElementById(\'booking-modal-close\').click()"' +
        ' class="bg-executive-gold text-deep-navy px-10 py-4 font-label-md text-label-md cursor-pointer active:opacity-80 hover:brightness-110 transition-all duration-200">' +
        'Close this window' +
        '</button></div>'
    }

    // Scroll panel to top so user sees the post-booking content
    const panel = document.getElementById('booking-modal-panel')
    if (panel) panel.scrollTop = 0
  }

  function loadCalendly(url) {
    if (window.Calendly) {
      const container = document.getElementById('bm-calendly-container')
      if (!container) return
      window.Calendly.initInlineWidget({ url: url, parentElement: container })
      return
    }
    if (document.querySelector('script[src*="calendly"]')) return
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.onload = function() {
      const container = document.getElementById('bm-calendly-container')
      if (!container) return
      window.Calendly.initInlineWidget({ url: url, parentElement: container })
    }
    document.head.appendChild(script)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    document.head.appendChild(link)
  }

  function listenForBookingConfirmed() {
    function onMessage(e) {
      if (e.data && e.data.event === 'calendly.event_scheduled') {
        showPostBooking()
        window.removeEventListener('message', onMessage)
      }
    }
    window.addEventListener('message', onMessage)
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
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal()
    })
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
