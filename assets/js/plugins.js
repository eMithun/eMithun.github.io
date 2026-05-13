(function(){'use strict';
function loadPlugins() {
  var list = document.getElementById('plugin-list')
  if (!list) return
  list.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">Loading plugins...</p>'
  try {
    var stored = localStorage.getItem('codefx_plugins')
    var plugins = stored ? JSON.parse(stored) : []
    if (!plugins.length) {
      plugins = [
        { name: 'example-plugin', version: '1.0.0', description: 'Create plugins/example-plugin/plugin.json to add your own.', enabled: false }
      ]
    }
    renderPlugins(plugins)
  } catch(e) {
    list.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">No plugins found. Add plugins to the plugins/ directory.</p>'
  }
}
function renderPlugins(plugins) {
  var list = document.getElementById('plugin-list')
  list.innerHTML = plugins.map(function(p) {
    return '<div class="plugin-card"><div class="info"><div class="name">' + esc(p.name) + ' <span class="version">v' + p.version + '</span></div><div class="desc">' + esc(p.description || '') + '</div></div><div class="status"><label class="toggle"><input type="checkbox" ' + (p.enabled ? 'checked' : '') + ' onchange="togglePlugin(\'' + p.name + '\', this.checked)"><span class="slider"></span></label></div></div>'
  }).join('')
}
window.togglePlugin = function(name, enabled) {
  var stored = localStorage.getItem('codefx_plugins')
  var plugins = stored ? JSON.parse(stored) : []
  var p = plugins.find(function(x) { return x.name === name })
  if (p) p.enabled = enabled
  else plugins.push({ name: name, enabled: enabled })
  localStorage.setItem('codefx_plugins', JSON.stringify(plugins))
}
function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML }
loadPlugins()
})();