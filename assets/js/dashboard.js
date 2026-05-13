(function(){'use strict';
function loadStatus() {
  var status = JSON.parse(localStorage.getItem('codefx_server_status') || 'null')
  if (status) renderStatus(status)
}
function renderStatus(s) {
  document.getElementById('s-status').textContent = s.status || 'online'
  document.getElementById('s-uptime').textContent = s.uptime || '-'
  document.getElementById('s-node').textContent = s.nodeVersion || '-'
  document.getElementById('s-platform').textContent = s.platform || '-'
  var cpuPct = s.cpu ? s.cpu.avgLoad || s.cpu.load || 0 : 0
  document.getElementById('cpu-fill').style.width = cpuPct + '%'
  document.getElementById('cpu-text').textContent = cpuPct + '% used' + (s.cpu && s.cpu.model ? ' (' + s.cpu.model + ')' : '')
  var memPct = s.memory ? s.memory.percent || 0 : 0
  document.getElementById('mem-fill').style.width = memPct + '%'
  document.getElementById('mem-text').textContent = (s.memory ? s.memory.used + ' / ' + s.memory.total : '0') + ' (' + memPct + '%)'
}
function loadStats() {
  var posts = JSON.parse(localStorage.getItem('codefx_blog_posts') || '[]')
  var forum = JSON.parse(localStorage.getItem('codefx_forum_posts') || '[]')
  var tickets = JSON.parse(localStorage.getItem('codefx_tickets') || '[]')
  var messages = JSON.parse(localStorage.getItem('codefx_messages') || '[]')
  var visits = JSON.parse(localStorage.getItem('codefx_visits') || '[]')
  var users = JSON.parse(localStorage.getItem('codefx_users') || '[]')
  document.getElementById('stat-users').textContent = users.length
  document.getElementById('stat-posts').textContent = posts.length
  document.getElementById('stat-forum').textContent = forum.length
  document.getElementById('stat-tickets').textContent = tickets.length
  document.getElementById('stat-messages').textContent = messages.length
  document.getElementById('stat-visits').textContent = visits.length
}
loadStatus()
loadStats()
})();