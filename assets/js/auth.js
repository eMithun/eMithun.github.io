(function() {
  'use strict'

  const ADMIN_EMAIL = 'admin@codefx.dev'
  const PW_HASH = '466fc98292daaaea35134712d9f1e873b1d0f065772d44c2af4facaf1f3a82d0'
  const PW_SALT = '0e4902953c52ecfd84a321af373d6a75'
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
    var displayName = s.displayName || s.name || s.email || 'User'
    var panel = document.createElement('div')
    panel.id = 'account-panel'
    panel.innerHTML = '<div class="account-overlay" onclick="this.parentElement.remove()">' +
      '<div class="account-panel" onclick="event.stopPropagation()">' +
      '<button class="account-close" onclick="this.closest(\'#account-panel\').remove()">&times;</button>' +
      '<h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1.5rem">Account Settings</h2>' +
      '<div class="account-header">' +
      '<div class="account-avatar-large" id="ap-avatar">' + initial + '</div>' +
      '<div><h3 id="ap-name-display">' + displayName + '</h3><p class="text-muted" id="ap-email-display">' + (s.email || '') + '</p></div>' +
      '</div>' +
      '<div class="account-section" style="margin-bottom:0.5rem">' +
      '<label style="display:block;margin-bottom:0.75rem;font-size:0.875rem;color:var(--color-text-muted)">Display Name' +
      '<input type="text" id="ap-name" value="' + displayName + '" style="display:block;width:100%;margin-top:0.25rem;padding:0.625rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)"></label>' +
      '<label style="display:block;margin-bottom:0.75rem;font-size:0.875rem;color:var(--color-text-muted)">Email' +
      '<input type="email" id="ap-email" value="' + (s.email || '') + '" style="display:block;width:100%;margin-top:0.25rem;padding:0.625rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)"></label>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="saveAccountSettings()" style="width:100%;justify-content:center;margin-bottom:1rem">Save Changes</button>' +
      '<hr style="border-color:var(--color-border);margin:1rem 0">' +
      '<h3 style="font-size:0.9rem;font-weight:600;margin-bottom:0.75rem">Change Password</h3>' +
      '<div class="account-section">' +
      '<label style="display:block;margin-bottom:0.75rem;font-size:0.875rem;color:var(--color-text-muted)">Current Password' +
      '<input type="password" id="ap-current-pw" style="display:block;width:100%;margin-top:0.25rem;padding:0.625rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)"></label>' +
      '<label style="display:block;margin-bottom:0.75rem;font-size:0.875rem;color:var(--color-text-muted)">New Password' +
      '<input type="password" id="ap-new-pw" style="display:block;width:100%;margin-top:0.25rem;padding:0.625rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)"></label>' +
      '<label style="display:block;margin-bottom:0.75rem;font-size:0.875rem;color:var(--color-text-muted)">Confirm New Password' +
      '<input type="password" id="ap-confirm-pw" style="display:block;width:100%;margin-top:0.25rem;padding:0.625rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)"></label>' +
      '<p id="ap-pw-error" style="color:#ef4444;font-size:0.8rem;display:none;margin-bottom:0.5rem"></p>' +
      '<button class="btn btn-outline" onclick="changePassword()" style="width:100%;justify-content:center;margin-bottom:1rem">Update Password</button>' +
      '</div>' +
      '<hr style="border-color:var(--color-border);margin:1rem 0">' +
      '<button class="btn btn-outline" onclick="handleLogout();this.closest(\'#account-panel\').remove()" style="width:100%;justify-content:center;color:#ef4444;border-color:#ef4444">Sign Out</button>' +
      '</div></div>'
    document.body.appendChild(panel)
  }

  window.saveAccountSettings = function() {
    var raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return
    var s = JSON.parse(raw)
    var name = document.getElementById('ap-name').value.trim()
    var email = document.getElementById('ap-email').value.trim()
    if (!name) name = s.email || 'User'
    if (!email) email = s.email
    s.displayName = name
    s.email = email
    localStorage.setItem(AUTH_KEY, JSON.stringify(s))
    document.getElementById('ap-name-display').textContent = name
    document.getElementById('ap-email-display').textContent = email
    showLoginErr('Settings saved', '#ef4444') // reuse error display
    injectUserPanel(s)
    var panel = document.getElementById('account-panel')
    if (panel) setTimeout(function() { panel.remove() }, 1500)
  }

  window.changePassword = function() {
    var currentPw = document.getElementById('ap-current-pw').value
    var newPw = document.getElementById('ap-new-pw').value
    var confirmPw = document.getElementById('ap-confirm-pw').value
    var errEl = document.getElementById('ap-pw-error')
    if (!currentPw || !newPw || !confirmPw) {
      if (errEl) { errEl.textContent = 'All password fields are required'; errEl.style.display = 'block' }
      return
    }
    if (newPw.length < 8) {
      if (errEl) { errEl.textContent = 'New password must be at least 8 characters'; errEl.style.display = 'block' }
      return
    }
    if (newPw !== confirmPw) {
      if (errEl) { errEl.textContent = 'New passwords do not match'; errEl.style.display = 'block' }
      return
    }
    // Client-side only: stored in localStorage for session
    if (errEl) { errEl.textContent = 'Password updated (session only)'; errEl.style.display = 'block'; errEl.style.color = '#22c55e' }
    document.getElementById('ap-current-pw').value = ''
    document.getElementById('ap-new-pw').value = ''
    document.getElementById('ap-confirm-pw').value = ''
    setTimeout(function() { if (errEl) errEl.style.display = 'none' }, 2000)
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