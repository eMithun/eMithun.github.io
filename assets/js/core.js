const CodeFX = {
  config: {},
  events: {},

  init(config) {
    this.config = config
    this.initTheme()
    this.initNavigation()
    this.initScrollAnimations()
    this.initSmoothScroll()
    this.emit('ready')
  },

  initTheme() {
    const saved = localStorage.getItem('codefx-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = saved || (prefersDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    const html = document.documentElement
    html.classList.add('theme-transitioning')
    requestAnimationFrame(() => {
      html.setAttribute('data-theme', next)
      localStorage.setItem('codefx-theme', next)
      this.emit('themeChange', next)
      setTimeout(() => html.classList.remove('theme-transitioning'), 400)
    })
  },

  initNavigation() {
    const toggle = document.getElementById('theme-toggle')
    if (toggle) toggle.addEventListener('click', () => this.toggleTheme())
    const menuToggle = document.getElementById('mobile-menu-toggle')
    const nav = document.getElementById('main-nav')
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('open')
        menuToggle.setAttribute('aria-expanded', nav.classList.contains('open'))
      })
    }
  },

  initScrollAnimations() {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
    document.querySelectorAll('.animate-in, .animate-in-left, .animate-in-right, .animate-in-scale').forEach(el => observer.observe(el))
  },

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const href = anchor.getAttribute('href')
        if (href === '#') return
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  },

  on(event, handler) {
    (this.events[event] = this.events[event] || []).push(handler)
    return this
  },

  emit(event, data) {
    (this.events[event] || []).forEach(h => h(data))
    return this
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const script = document.getElementById('codefx-config')
  const config = script ? JSON.parse(script.textContent || '{}') : {}
  CodeFX.init(config)
})

window.CodeFX = CodeFX
