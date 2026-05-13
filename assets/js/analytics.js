(function() {
  'use strict'

  if (sessionStorage.getItem('codefx_tracked')) return

  var data = {
    url: location.href,
    referrer: document.referrer || '(direct)',
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: screen.width + 'x' + screen.height,
    timestamp: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pageLoad: performance.now()
  }

  var mode = document.querySelector('meta[name="codefx-mode"]')?.content || 'static'

  if (mode === 'static') {
    var stored = JSON.parse(localStorage.getItem('codefx_visits') || '[]')
    stored.push(data)
    localStorage.setItem('codefx_visits', JSON.stringify(stored))
    sessionStorage.setItem('codefx_tracked', '1')
    return
  }

  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/track', JSON.stringify(data))
  } else {
    fetch('/api/analytics/track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), keepalive: true
    }).catch(function() {})
  }

  sessionStorage.setItem('codefx_tracked', '1')
})()