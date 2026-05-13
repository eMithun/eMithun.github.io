(function(){'use strict';
var platforms = [
  { id: 'twitter', name: 'Twitter / X', color: '#1da1f2', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0a66c2', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' }
]
function loadAccounts() {
  var list = document.getElementById('accounts-list')
  if (!list) return
  var stored = localStorage.getItem('codefx_social_accounts')
  var accounts = stored ? JSON.parse(stored) : []
  list.innerHTML = platforms.map(function(p) {
    var account = accounts.find(function(a) { return a.platform === p.id })
    var connected = account && account.connected
    return '<div class="account-card"><div class="info"><div class="platform-icon" style="background:' + p.color + ';color:white;padding:6px">' + p.icon + '</div><div><div class="platform-name">' + p.name + '</div><div class="platform-status ' + (connected ? 'connected' : 'disconnected') + '">' + (connected ? 'Connected' : 'Not connected') + '</div></div></div><div>' + (connected ? '<label class="toggle" title="Auto-post on content update"><input type="checkbox" ' + (account.autoPost ? 'checked' : '') + ' onchange="toggleAutoPost(\'' + p.id + '\', this.checked)"><span class="slider"></span></label>' : '<button class="btn btn-outline" onclick="connectAccount(\'' + p.id + '\')">Connect</button>') + '</div></div>'
  }).join('')
}
window.connectAccount = function(platform) {
  var token = prompt('Enter your ' + platform + ' API access token:')
  if (!token) return
  var stored = JSON.parse(localStorage.getItem('codefx_social_accounts') || '[]')
  var existing = stored.find(function(a) { return a.platform === platform })
  if (existing) existing.connected = true
  else stored.push({ id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + platform, userId: 'admin', platform: platform, accessToken: token, connected: true, autoPost: true })
  localStorage.setItem('codefx_social_accounts', JSON.stringify(stored))
  loadAccounts()
  showResult('Connected to ' + platform)
}
window.toggleAutoPost = function(platform, enabled) {
  var stored = JSON.parse(localStorage.getItem('codefx_social_accounts') || '[]')
  var account = stored.find(function(a) { return a.platform === platform })
  if (account) account.autoPost = enabled
  localStorage.setItem('codefx_social_accounts', JSON.stringify(stored))
}
window.sendPost = function() {
  var content = document.getElementById('post-content').value
  if (!content.trim()) { showResult('Please enter content to post', true); return }
  var stored = JSON.parse(localStorage.getItem('codefx_social_accounts') || '[]')
  var connected = stored.filter(function(a) { return a.connected })
  if (!connected.length) { showResult('No connected accounts', true); return }
  var result = document.getElementById('post-result')
  result.innerHTML = connected.map(function(a) { return '<div style="padding:0.25rem 0;font-size:0.875rem">Posted to ' + a.platform + ': "' + content.substring(0, 50) + (content.length > 50 ? '...' : '') + '"</div>' }).join('')
  var log = JSON.parse(localStorage.getItem('codefx_social_log') || '[]')
  log.push({ action: 'post', data: { content: content.substring(0, 100), platforms: connected.map(function(a) { return a.platform }), timestamp: Date.now() } })
  if (log.length > 100) log.shift()
  localStorage.setItem('codefx_social_log', JSON.stringify(log))
  loadActivity()
  document.getElementById('post-content').value = ''
}
function loadActivity() {
  var log = JSON.parse(localStorage.getItem('codefx_social_log') || '[]')
  var el = document.getElementById('activity-log')
  if (!log.length) { el.innerHTML = '<p class="text-muted" style="text-align:center;padding:1rem">No recent activity.</p>'; return }
  el.innerHTML = log.reverse().slice(0, 20).map(function(e) {
    return '<div class="activity-item"><span>' + (e.data && e.data.platforms ? 'Posted to ' + e.data.platforms.join(', ') : e.action) + '</span><span class="time">' + timeAgo(e.data && e.data.timestamp) + '</span></div>'
  }).join('')
}
function showResult(msg, isError) {
  var el = document.getElementById('post-result')
  if (el) el.innerHTML = '<div style="padding:0.5rem;border-radius:var(--radius-md);font-size:0.875rem;' + (isError ? 'background:#fef2f2;color:#991b1b' : 'background:#dcfce7;color:#166534') + '">' + msg + '</div>'
}
function timeAgo(ts) { if (!ts) return ''; var s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return 'just now'; var m = Math.floor(s / 60); if (m < 60) return m + 'm ago'; var h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; var d = Math.floor(h / 24); return d + 'd ago' }
loadAccounts()
loadActivity()
})();