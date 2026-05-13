(function() {
  'use strict'

  const ADMIN_EMAIL = 'admin'
  const PW_HASH = 'c432f5151c8cac8cd5c3c15b2496b5ef4dd92bd43cabfecd84ef3386f19d48d7'
  const PW_SALT = '35cfd224f15937278d9cba48b80bb1ac'
  const AUTH_KEY = 'codefx_session'
  const SESSION_DURATION = 604800000
  const MAX_ATTEMPTS = 5
  const COOLDOWN_MS = 60000
  const SECRET_TRIGGER = 'Control+Shift+L'
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
    } catch { localStorage.removeItem(AUTH_KEY); isLoggedIn = false }
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
    if (combo === SECRET_TRIGGER) {
      e.preventDefault()
      toggleLoginModal()
    }
  })

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#login-toggle')
    if (btn) { e.preventDefault(); toggleLoginModal(); return }
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
    if (isLoggedIn) { showProfile(); return }
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
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email, name: ADMIN_EMAIL.split('@')[0], loginTime: Date.now() }))
    isLoggedIn = true
    loginModal.remove(); loginModal = null
    window.CodeFX && CodeFX.emit('auth:login', { email })
  }

  function showProfile() {
    var raw = localStorage.getItem(AUTH_KEY)
    var user = raw ? JSON.parse(raw) : {}
    loginModal = document.createElement('div')
    loginModal.id = 'codefx-login-modal'
    loginModal.innerHTML = '<div class="codefx-modal-overlay">' +
      '<div class="codefx-modal">' +
      '<button class="codefx-modal-close" onclick="this.closest(\'#codefx-login-modal\').remove(); loginModal=null">&times;</button>' +
      '<h2>Profile</h2>' +
      '<p><strong>' + (user.name || user.email || 'User') + '</strong></p>' +
      '<p class="text-muted">' + (user.email || '') + '</p>' +
      '<hr style="margin:1rem 0;border-color:var(--color-border)">' +
      '<button class="btn btn-outline" onclick="handleLogout()" style="width:100%;justify-content:center">Sign Out</button>' +
      '</div></div>'
    document.body.appendChild(loginModal)
  }

  window.handleLogout = function() {
    localStorage.removeItem(AUTH_KEY)
    isLoggedIn = false
    if (loginModal) { loginModal.remove(); loginModal = null }
    window.CodeFX && CodeFX.emit('auth:logout')
  }

  window.CodeFX && CodeFX.on('auth:login', function() { isLoggedIn = true })
  window.CodeFX && CodeFX.on('auth:logout', function() { isLoggedIn = false })
})()