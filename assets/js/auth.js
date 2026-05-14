(function() {
  'use strict'

  const ADMIN_EMAIL = 'admin@codefx.dev'
  const PW_HASH = '504d3ffffbb80bef4e6cd90ad2679fe5e954d51e2becb6118e6f36d94eab5f3d'
  const PW_SALT = '76687a8f71fbd4de32411f37c3cef9b0'
  const AUTH_KEY = 'codefx_session'
  const SESSION_DURATION = 604800000
  const MAX_ATTEMPTS = 5
  const COOLDOWN_MS = 60000
  let loginModal = null
  let isLoggedIn = false
  let loginAttempts = 0
  let loginBlockedUntil = 0
  let hiddenClickCount = 0
  let clickTimer = null

  function validateSession() {
    var raw = localStorage.getItem(AUTH_KEY)
    if (!raw) { isLoggedIn = false; return }
    try {
      var session = JSON.parse(raw)
      if (Date.now() - session.loginTime > SESSION_DURATION) {
        localStorage.removeItem(AUTH_KEY)
        isLoggedIn = false; return
      }
      isLoggedIn = session.email === ADMIN_EMAIL
      if (isLoggedIn) injectUserPanel(session)
    } catch { localStorage.removeItem(AUTH_KEY); isLoggedIn = false }
  }

  function injectUserPanel(session) {
    var el = document.getElementById('auth-state')
    if (!el) return
    var initial = (session.email || 'U')[0].toUpperCase()
    el.innerHTML = '<div class="auth-user-panel">' +
      '<div class="auth-avatar" onclick="toggleAccountPanel()">' + initial + '</div>' +
      '<span class="auth-username">' + (session.name || session.email || 'User') + '</span>' +
      '<a href="/admin" class="btn btn-primary" style="padding:0.375rem 0.75rem;font-size:0.8rem">Dashboard</a>' +
      '</div>'
  }

  window.toggleAccountPanel = function() {
    var existing = document.getElementById('account-panel')
    if (existing) { existing.remove(); return }
    var raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return
    var s = JSON.parse(raw)
    var initial = (s.email || 'U')[0].toUpperCase()
    var panel = document.createElement('div')
    panel.id = 'account-panel'
    panel.innerHTML = '<div class="account-overlay" onclick="this.parentElement.remove()">' +
      '<div class="account-panel" onclick="event.stopPropagation()">' +
      '<button class="account-close" onclick="this.closest(\'#account-panel\').remove()">&times;</button>' +
      '<div class="account-header">' +
      '<div class="account-avatar-large">' + initial + '</div>' +
      '<div><h3>' + (s.name || s.email || 'User') + '</h3><p class="text-muted">' + (s.email || '') + '</p></div>' +
      '</div>' +
      '<div class="account-section">' +
      '<label>Email<input type="email" value="' + (s.email || '') + '" disabled></label>' +
      '<label>Username<input type="text" value="' + (s.name || '') + '" disabled></label>' +
      '</div>' +
      '<hr style="border-color:var(--color-border);margin:1rem 0">' +
      '<button class="btn btn-outline" onclick="handleLogout();this.closest(\'#account-panel\').remove()" style="width:100%;justify-content:center">Sign Out</button>' +
      '</div></div>'
    document.body.appendChild(panel)
  }

  async function hashPass(password) {
    var enc = new TextEncoder()
    var data = enc.encode(PW_SALT + password)
    var hashBuf = await crypto.subtle.digest('SHA-256', data)
    var hashArr = Array.from(new Uint8Array(hashBuf))
    return hashArr.map(function(b) { return b.toString(16).padStart(2, '0') }).join('')
  }

  validateSession()

  document.addEventListener('keydown', function(e) {
    const combo = [e.ctrlKey || e.metaKey ? 'Control' : '', e.shiftKey ? 'Shift' : '', e.key.toUpperCase()]
      .filter(Boolean).join('+')
    if (combo === 'Control+Shift+L') {
      e.preventDefault()
      toggleLoginModal()
    }
  })

  document.addEventListener('click', function(e) {
    if (e.target.closest('#account-panel') || e.target.closest('.auth-avatar')) return
    if (!e.target.closest('header')) return
    hiddenClickCount++
    clearTimeout(clickTimer)
    clickTimer = setTimeout(function() { hiddenClickCount = 0 }, 800)
    if (hiddenClickCount >= 3) {
      hiddenClickCount = 0
      toggleLoginModal()
    }
  })

  function toggleLoginModal() {
    if (isLoggedIn) { toggleAccountPanel(); return }
    if (loginModal) { loginModal.remove(); loginModal = null; return }
    showLoginModal()
  }

  function showLoginModal() {
    loginModal = document.createElement('div')
    loginModal.id = 'codefx-login-modal'
    loginModal.innerHTML = '<div class="codefx-modal-overlay">' +
      '<div class="codefx-modal">' +
      '<button class="codefx-modal-close" onclick="this.closest(\'#codefx-login-modal\').remove(); loginModal=null">&times;</button>' +
      '<h2>Sign In</h2>' +
      '<p id="login-error" class="text-muted" style="font-size:0.8rem;margin-bottom:0.75rem;color:#ef4444;display:none"></p>' +
      '<form id="codefx-login-form">' +
      '<label>Email<input type="email" id="codefx-login-email" required></label>' +
      '<label>Password<input type="password" id="codefx-login-password" required></label>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Sign In</button>' +
      '</form></div></div>'
    document.body.appendChild(loginModal)

    document.getElementById('codefx-login-form').addEventListener('submit', function(e) {
      e.preventDefault()
      if (Date.now() < loginBlockedUntil) {
        showLoginErr('Too many attempts. Try again in ' + Math.ceil((loginBlockedUntil - Date.now()) / 1000) + 's')
        return
      }
      const email = document.getElementById('codefx-login-email').value
      const password = document.getElementById('codefx-login-password').value
      handleLogin(email, password)
    })
  }

  function showLoginErr(msg) {
    var el = document.getElementById('login-error')
    if (el) { el.textContent = msg; el.style.display = 'block' }
  }

  async function handleLogin(email, password) {
    if (!ADMIN_EMAIL || !PW_HASH || !PW_SALT) {
      showLoginErr('Authentication not configured')
      return
    }
    if (email !== ADMIN_EMAIL) {
      loginAttempts++
      if (loginAttempts >= MAX_ATTEMPTS) {
        loginBlockedUntil = Date.now() + COOLDOWN_MS
        loginAttempts = 0
      }
      showLoginErr('Invalid email or password')
      return
    }
    var hash = await hashPass(password)
    if (hash !== PW_HASH) {
      loginAttempts++
      if (loginAttempts >= MAX_ATTEMPTS) {
        loginBlockedUntil = Date.now() + COOLDOWN_MS
        loginAttempts = 0
      }
      showLoginErr('Invalid email or password')
      return
    }
    loginAttempts = 0
    var session = { email, name: ADMIN_EMAIL.split('@')[0], loginTime: Date.now() }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    isLoggedIn = true
    loginModal.remove(); loginModal = null
    injectUserPanel(session)
    window.CodeFX && CodeFX.emit('auth:login', { email })
  }

  window.handleLogout = function() {
    localStorage.removeItem(AUTH_KEY)
    isLoggedIn = false
    var el = document.getElementById('auth-state')
    if (el) el.innerHTML = ''
    var panel = document.getElementById('account-panel')
    if (panel) panel.remove()
    window.CodeFX && CodeFX.emit('auth:logout')
  }

  window.CodeFX && CodeFX.on('auth:login', function() { isLoggedIn = true })
  window.CodeFX && CodeFX.on('auth:logout', function() { isLoggedIn = false })
})()