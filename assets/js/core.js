const CodeFX = {
  config: {},

  init(config) {
    this.config = config
    this.initTheme()
    this.initNavigation()
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
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('codefx-theme', next)
    this.emit('themeChange', next)
  },

  initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault()
        const target = document.querySelector(anchor.getAttribute('href'))
        if (target) target.scrollIntoView({ behavior: 'smooth' })
      })
    })
  },

  events: {},
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
  const config = JSON.parse(
    document.getElementById('codefx-config')?.textContent || '{}'
  )
  CodeFX.init(config)
})

window.CodeFX = CodeFX
