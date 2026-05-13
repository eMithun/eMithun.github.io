(function() {
  'use strict'

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('form')
    if (!form || !form.classList.contains('codefx-contact-form')) return
    e.preventDefault()

    var data = {
      name: form.querySelector('[name="name"]')?.value || '',
      email: form.querySelector('[name="email"]')?.value || '',
      message: form.querySelector('[name="message"],textarea')?.value || '',
      timestamp: Date.now()
    }

    var mode = document.querySelector('meta[name="codefx-mode"]')?.content || 'static'
    if (mode === 'static') {
      var stored = JSON.parse(localStorage.getItem('codefx_messages') || '[]')
      stored.push(data)
      localStorage.setItem('codefx_messages', JSON.stringify(stored))
      showToast('Message saved locally. Enable dynamic mode for email delivery.')
      form.reset()
      return
    }

    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (r.ok) { showToast('Message sent!'); form.reset() }
      else { showToast('Failed to send. Try again.') }
    }).catch(function() { showToast('Network error. Try again.') })
  })

  function showToast(msg) {
    var toast = document.createElement('div')
    toast.textContent = msg
    Object.assign(toast.style, {
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      padding: '0.75rem 1.25rem', background: 'var(--color-text)',
      color: 'var(--color-background)', borderRadius: 'var(--radius-md)',
      zIndex: '9999', animation: 'codefx-fade-in 0.3s'
    })
    document.body.appendChild(toast)
    setTimeout(function() { toast.remove() }, 4000)
  }
})()