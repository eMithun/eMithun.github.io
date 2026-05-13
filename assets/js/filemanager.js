(function(){'use strict';
var currentPath = '.'
function loadDir(dir) {
  currentPath = dir || '.'
  var list = document.getElementById('fm-list')
  if (!list) return
  list.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">Loading...</p>'
  var stored = localStorage.getItem('codefx_filemanager_' + dir)
  if (stored) {
    renderFiles(JSON.parse(stored), dir)
  } else {
    renderFiles([], dir)
  }
}
function renderFiles(entries, dir) {
  var list = document.getElementById('fm-list')
  if (!entries || !entries.length) {
    list.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem;grid-column:1/-1">Empty directory</p>'
    return
  }
  var parts = dir.split('/').filter(Boolean)
  var breadcrumb = document.getElementById('fm-breadcrumb')
  breadcrumb.innerHTML = '<span onclick="loadDir('.')">root</span>'
  parts.forEach(function(p, i) {
    var path = parts.slice(0, i + 1).join('/')
    breadcrumb.innerHTML += ' / <span onclick="loadDir(\'' + path + '\')">' + esc(p) + '</span>'
  })
  list.innerHTML = entries.map(function(e) {
    var icon = e.type === 'dir' ? '<svg class="icon dir" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' : '<svg class="icon file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    var size = e.type === 'dir' ? '-' : formatSize(e.size)
    var type = e.type === 'dir' ? 'folder' : (e.ext || 'unknown')
    var itemPath = dir === '.' ? e.name : dir + '/' + e.name
    var nameHtml = e.type === 'dir' ? '<span onclick="loadDir(\'' + itemPath + '\')">' + esc(e.name) + '</span>' : esc(e.name)
    return '<div class="fm-item"><div class="col-name">' + icon + nameHtml + '</div><span class="col-size">' + size + '</span><span class="col-type">' + type + '</span><span class="col-actions"><button onclick="renameItem(\'' + itemPath + '\')">Rename</button><button class="danger" onclick="deleteItem(\'' + itemPath + '\')">Delete</button></span></div>'
  }).join('')
}
function formatSize(bytes) {
  if (!bytes) return '0 B'
  var units = ['B', 'KB', 'MB', 'GB']
  var i = 0
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++ }
  return bytes.toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}
window.uploadFile = function() {
  var input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = function() {
    Array.from(input.files).forEach(function(file) {
      var reader = new FileReader()
      reader.onload = function(e) {
        try {
          var stored = JSON.parse(localStorage.getItem('codefx_files') || '{}')
          if (!stored[currentPath]) stored[currentPath] = []
          stored[currentPath].push({ name: file.name, type: 'file', size: file.size, ext: file.name.split('.').pop() || '' })
          localStorage.setItem('codefx_files', JSON.stringify(stored))
          loadDir(currentPath)
          showStatus('Uploaded: ' + file.name, 'success')
        } catch(e) { showStatus('Upload failed: ' + e.message, 'error') }
      }
      reader.readAsDataURL(file)
    })
  }
  input.click()
}
window.newFolder = function() {
  var name = prompt('Folder name:')
  if (!name || !name.trim()) return
  try {
    var stored = JSON.parse(localStorage.getItem('codefx_files') || '{}')
    if (!stored[currentPath]) stored[currentPath] = []
    stored[currentPath].push({ name: name.trim(), type: 'dir', size: 0, ext: '' })
    localStorage.setItem('codefx_files', JSON.stringify(stored))
    loadDir(currentPath)
    showStatus('Created folder: ' + name, 'success')
  } catch(e) { showStatus('Error: ' + e.message, 'error') }
}
window.deleteItem = function(path) {
  if (!confirm('Delete "' + path + '"?')) return
  var parent = path.split('/').slice(0, -1).join('/') || '.'
  var name = path.split('/').pop()
  try {
    var stored = JSON.parse(localStorage.getItem('codefx_files') || '{}')
    if (stored[parent]) stored[parent] = stored[parent].filter(function(f) { return f.name !== name })
    localStorage.setItem('codefx_files', JSON.stringify(stored))
    loadDir(currentPath)
    showStatus('Deleted: ' + name, 'success')
  } catch(e) { showStatus('Error: ' + e.message, 'error') }
}
window.renameItem = function(path) {
  var parent = path.split('/').slice(0, -1).join('/') || '.'
  var oldName = path.split('/').pop()
  var newName = prompt('New name:', oldName)
  if (!newName || newName === oldName) return
  try {
    var stored = JSON.parse(localStorage.getItem('codefx_files') || '{}')
    if (stored[parent]) {
      var item = stored[parent].find(function(f) { return f.name === oldName })
      if (item) item.name = newName
      stored[parent] = stored[parent].filter(function(f) { return f.name !== oldName || f === item })
    }
    localStorage.setItem('codefx_files', JSON.stringify(stored))
    loadDir(currentPath)
    showStatus('Renamed: ' + oldName + ' -> ' + newName, 'success')
  } catch(e) { showStatus('Error: ' + e.message, 'error') }
}
window.showStatus = function(msg, type) {
  var el = document.getElementById('fm-status')
  if (!el) return
  el.style.display = 'block'
  el.className = 'fm-status ' + type
  el.textContent = msg
  setTimeout(function() { el.style.display = 'none' }, 3000)
}
function esc(s) { if(!s)return''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML }
loadDir('.')
})();