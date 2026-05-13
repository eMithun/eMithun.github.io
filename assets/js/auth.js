(function() {
  'use strict'

  const AUTH_KEY = 'codefx_session'
  const SECRET_TRIGGER = 'Control+Shift+L'
  const SESSION_DURATION = 604800000
  const MIN_PW_LEN = 8
  let loginModal = null
  let isLoggedIn = !!localStorage.getItem(AUTH_KEY)
  let hiddenClickCount = 0
  let clickTimer = null

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
      '<form id="codefx-login-form">' +
      '<label>Email<input type="email" id="codefx-login-email" required></label>' +
      '<label>Password<input type="password" id="codefx-login-password" required></label>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Sign In</button>' +
      '<p style="text-align:center;margin-top:1rem"><a href="#" onclick="showRegister();return false">Create account</a></p>' +
      '</form></div></div>'
    document.body.appendChild(loginModal)

    document.getElementById('codefx-login-form').addEventListener('submit', function(e) {
      e.preventDefault()
      const email = document.getElementById('codefx-login-email').value
      const password = document.getElementById('codefx-login-password').value
      handleLogin(email, password)
    })
  }

  window.showRegister = function() {
    const modal = loginModal || document.getElementById('codefx-login-modal')
    if (!modal) return
    const formContainer = modal.querySelector('.codefx-modal')
    formContainer.innerHTML = '<button class="codefx-modal-close" onclick="this.closest(\'#codefx-login-modal\').remove(); loginModal=null">&times;</button>' +
      '<h2>Create Account</h2>' +
      '<form id="codefx-register-form">' +
      '<label>Name<input type="text" id="codefx-register-name" required></label>' +
      '<label>Email<input type="email" id="codefx-register-email" required></label>' +
      '<label>Password<input type="password" id="codefx-register-password" required minlength="8"></label>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Register</button>' +
      '<p style="text-align:center;margin-top:1rem"><a href="#" onclick="showLoginForm();return false">Already have an account?</a></p>' +
      '</form>'

    document.getElementById('codefx-register-form').addEventListener('submit', function(e) {
      e.preventDefault()
      const name = document.getElementById('codefx-register-name').value
      const email = document.getElementById('codefx-register-email').value
      const password = document.getElementById('codefx-register-password').value
      handleRegister(name, email, password)
    })
  }

  window.showLoginForm = function() {
    loginModal.remove(); loginModal = null
    showLoginModal()
  }

  async function handleLogin(email, password) {
    const mode = document.querySelector('meta[name="codefx-mode"]')?.content || 'static'
    if (mode === 'static') {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email, name: email.split('@')[0], loginTime: Date.now() }))
      isLoggedIn = true
      loginModal.remove(); loginModal = null
      window.CodeFX && CodeFX.emit('auth:login', { email })
      return
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      localStorage.setItem(AUTH_KEY, JSON.stringify(data.user))
      isLoggedIn = true
      loginModal.remove(); loginModal = null
      window.CodeFX && CodeFX.emit('auth:login', data.user)
    } catch (err) {
      alert('Login failed: ' + err.message)
    }
  }

  async function handleRegister(name, email, password) {
    if (password.length < MIN_PW_LEN) { alert('Password must be at least ' + MIN_PW_LEN + ' characters'); return }
    const mode = document.querySelector('meta[name="codefx-mode"]')?.content || 'static'
    if (mode === 'static') {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email, name, loginTime: Date.now() }))
      isLoggedIn = true
      loginModal.remove(); loginModal = null
      return
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      if (!res.ok) throw new Error('Registration failed')
      alert('Account created! Please sign in.')
      window.showLoginForm()
    } catch (err) {
      alert('Registration failed: ' + err.message)
    }
  }

  function showProfile() {
    const user = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}')
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