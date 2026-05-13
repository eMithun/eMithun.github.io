(function() {
  'use strict'
  var albums = JSON.parse(localStorage.getItem('codefx_gallery_albums') || '[]')
  var albumId = null

  function init() {
    if (document.getElementById('gallery-albums')) renderAlbums()
    if (document.getElementById('album-images')) loadAlbum()
    if (document.getElementById('admin-albums')) renderAdminAlbums()
  }

  function renderAlbums(filterCat) {
    var container = document.getElementById('gallery-albums')
    if (!container) return
    var sorted = albums.slice().sort(function(a,b) { return b.timestamp - a.timestamp })
    if (!sorted.length) { container.innerHTML = '<p class="text-muted album-empty">No albums yet.</p>'; return }
    container.innerHTML = sorted.map(function(a) {
      var cover = (a.photos && a.photos[0]) || { url: '' }
      return '<div class="gallery-album" onclick="location.href=\'/gallery/album.html?id=' + a.id + '\'">' +
        (cover.url ? '<img src="' + esc(cover.url) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>') +
        '<div class="overlay"><h3>' + esc(a.title) + '</h3><span>' + (a.photos ? a.photos.length : 0) + ' photos</span></div></div>'
    }).join('')
  }

  function loadAlbum() {
    var params = new URLSearchParams(location.search)
    var id = params.get('id')
    if (!id) { document.getElementById('album-title').textContent = 'No album specified'; return }
    var album = albums.find(function(a) { return a.id === id })
    if (!album) { document.getElementById('album-title').textContent = 'Album not found'; return }
    albumId = id
    document.getElementById('album-title').textContent = album.title
    document.getElementById('album-desc').textContent = album.desc || ''
    var container = document.getElementById('album-images')
    var photos = album.photos || []
    if (!photos.length) { container.innerHTML = '<p class="album-empty">No photos in this album yet. Add some!</p>'; return }
    container.innerHTML = photos.map(function(p, i) {
      return '<div class="gallery-photo" onclick="openLightbox(' + i + ')">' +
        '<img src="' + esc(p.url) + '" alt="' + esc(p.title || '') + '" loading="lazy">' +
        '<div class="info"><div class="photo-title">' + esc(p.title || '') + '</div>' + (p.desc ? '<p>' + esc(p.desc) + '</p>' : '') + '</div></div>'
    }).join('')
  }

  window.openLightbox = function(idx) {
    var album = albums.find(function(a) { return a.id === albumId })
    if (!album || !album.photos || !album.photos[idx]) return
    var photo = album.photos[idx]
    document.getElementById('lightbox-img').src = photo.url
    document.getElementById('lightbox-img').alt = photo.title || ''
    document.getElementById('lightbox-title').textContent = photo.title || ''
    document.getElementById('lightbox-desc').textContent = photo.desc || ''
    document.getElementById('lightbox').style.display = 'flex'
  }

  window.closeLightbox = function() { document.getElementById('lightbox').style.display = 'none' }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox()
  })

  window.showNewAlbum = function() {
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in to create albums'); return }
    document.getElementById('new-album-modal').style.display = 'flex'
  }

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('#new-album-form')
    if (!form) return; e.preventDefault()
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in first'); return }
    albums.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title: document.getElementById('album-title').value,
      category: document.getElementById('album-category').value,
      desc: document.getElementById('album-desc').value,
      photos: [],
      timestamp: Date.now()
    })
    localStorage.setItem('codefx_gallery_albums', JSON.stringify(albums))
    document.getElementById('new-album-modal').style.display = 'none'
    form.reset()
    renderAlbums()
  })

  window.showAddPhoto = function() {
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in to add photos'); return }
    document.getElementById('add-photo-modal').style.display = 'flex'
  }

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('#add-photo-form')
    if (!form) return; e.preventDefault()
    if (!albumId) return
    var album = albums.find(function(a) { return a.id === albumId })
    if (!album) return
    album.photos = album.photos || []
    album.photos.push({
      url: document.getElementById('photo-url').value,
      title: document.getElementById('photo-title').value,
      desc: document.getElementById('photo-desc').value
    })
    localStorage.setItem('codefx_gallery_albums', JSON.stringify(albums))
    document.getElementById('add-photo-modal').style.display = 'none'
    form.reset()
    loadAlbum()
  })

  window.renderAdminAlbums = function() {
    var container = document.getElementById('admin-albums')
    if (!container) return
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">Sign in to manage albums.</p>'; return }
    if (!albums.length) { container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">No albums yet.</p>'; return }
    container.innerHTML = albums.sort(function(a,b) { return b.timestamp - a.timestamp }).map(function(a) {
      return '<div class="admin-album-row"><div><strong>' + esc(a.title) + '</strong><span class="text-muted" style="font-size:0.8rem;margin-left:0.5rem">' + (a.photos ? a.photos.length : 0) + ' photos</span></div>' +
        '<button class="btn btn-outline" style="padding:0.25rem 0.75rem;font-size:0.8rem;color:var(--color-error)" onclick="deleteAlbum('' + a.id + '')">Delete</button></div>'
    }).join('')
  }

  window.deleteAlbum = function(id) {
    if (!confirm('Delete this album and all photos?')) return
    albums = albums.filter(function(a) { return a.id !== id })
    localStorage.setItem('codefx_gallery_albums', JSON.stringify(albums))
    renderAdminAlbums()
    renderAlbums()
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML }

  document.addEventListener('DOMContentLoaded', init)
})()