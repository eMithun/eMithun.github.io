(function() {
  var raw = localStorage.getItem('codefx_session')
  if (!raw) { window.location.href = '/'; return }
  try {
    var s = JSON.parse(raw)
    if (!s.email || Date.now() - s.loginTime > 604800000) {
      localStorage.removeItem('codefx_session')
      window.location.href = '/'
    }
  } catch {
    localStorage.removeItem('codefx_session')
    window.location.href = '/'
  }
})()