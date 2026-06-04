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
