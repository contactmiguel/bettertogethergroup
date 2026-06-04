(function () {
  const TEMPLATE = `
<div id="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-headline" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
  <div id="booking-modal-backdrop" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
  <div tabindex="-1" class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container border border-outline-variant rounded-lg shadow-2xl">
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
    modal.classList.remove('hidden')
    showStep1()
    const panel = modal.querySelector('[role="document"], .relative')
    if (panel) panel.focus()
  }

  function closeModal() {
    const modal = document.getElementById('booking-modal')
    if (!modal) return
    modal.classList.add('hidden')
  }

  function showStep1() {
    document.getElementById('booking-modal-body').innerHTML = `
      <h2 id="booking-modal-headline" class="font-display-sm text-display-sm text-on-surface mb-3" style="font-family:'Source Serif 4',serif">Quick intake.</h2>
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
              "I'm missing what's really going on beneath the surface",
              'There are things that need to be said that aren\'t being said',
              "I'm leading from pressure, not from clarity",
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
