(function() {
  'use strict'

  var posts = JSON.parse(localStorage.getItem('codefx_blog_posts') || '[]')

  function init() {
    if (document.getElementById('blog-posts')) renderPosts()
    if (document.getElementById('post-view')) renderPostView()
  }

  function renderPosts() {
    var container = document.getElementById('blog-posts')
    if (!container) return
    if (!posts.length) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">No posts yet. Write the first one!</p>'
      return
    }
    var sorted = posts.slice().sort(function(a,b) { return b.timestamp - a.timestamp })
    var catFilter = (document.getElementById('blog-filter-category') || {}).value || 'all'
    var searchFilter = ((document.getElementById('blog-filter-search') || {}).value || '').toLowerCase()

    var filtered = sorted
    if (catFilter !== 'all') filtered = filtered.filter(function(p) { return p.category === catFilter })
    if (searchFilter) filtered = filtered.filter(function(p) {
      return p.title.toLowerCase().indexOf(searchFilter) !== -1 ||
             (p.content || '').toLowerCase().indexOf(searchFilter) !== -1 ||
             (p.tags || []).join(' ').toLowerCase().indexOf(searchFilter) !== -1
    })

    if (!filtered.length) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">No matching posts.</p>'
      return
    }

    container.innerHTML = filtered.map(function(p) {
      var excerpt = (p.content || '').replace(/[#*]/g,'').split('\n').slice(0,3).join(' ').slice(0,200)
      var tags = (p.tags || []).map(function(t) { return '<span class="tag">' + esc(t.trim()) + '</span>' }).join('')
      return '<div class="blog-post-card" onclick="location.href=\'/blog/post.html?id=' + p.id + '\'">' +
        '<div class="flex items-center gap-sm" style="margin-bottom:0.5rem"><span class="tag">' + esc(p.category) + '</span></div>' +
        '<h2>' + esc(p.title) + '</h2>' +
        '<div class="meta">by ' + esc(p.author || 'Anonymous') + ' \u00b7 ' + timeAgo(p.timestamp) + '</div>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
        (excerpt ? '<div class="excerpt">' + esc(excerpt) + '...</div>' : '') +
      '</div>'
    }).join('')
  }

  window.filterPosts = function() { renderPosts() }

  window.showNewPost = function() {
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in to create a post'); return }
    document.getElementById('new-post-modal').style.display = 'flex'
  }

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('#new-post-form')
    if (!form) return
    e.preventDefault()
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in first'); return }
    var tags = (document.getElementById('post-tags').value || '').split(',').map(function(t) { return t.trim() }).filter(Boolean)
    posts.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title: document.getElementById('post-title').value,
      category: document.getElementById('post-category').value,
      content: document.getElementById('post-content').value,
      tags: tags,
      author: auth.name || auth.email || 'Anonymous',
      timestamp: Date.now()
    })
    localStorage.setItem('codefx_blog_posts', JSON.stringify(posts))
    document.getElementById('new-post-modal').style.display = 'none'
    form.reset()
    renderPosts()
    generateRSS()
  })

  function renderPostView() {
    var params = new URLSearchParams(location.search)
    var id = params.get('id')
    var post = posts.find(function(p) { return p.id === id })
    var container = document.getElementById('post-view')
    if (!post) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">Post not found. <a href="/blog">Back to blog</a></p>'
      return
    }
    var tags = (post.tags || []).map(function(t) { return '<span class="tag">' + esc(t.trim()) + '</span>' }).join('')
    container.innerHTML =
      '<div class="flex items-center gap-sm" style="margin-bottom:0.5rem"><span class="tag">' + esc(post.category) + '</span></div>' +
      '<h1 style="font-size:1.75rem;font-weight:800;margin-bottom:0.5rem">' + esc(post.title) + '</h1>' +
      '<div class="meta" style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:1rem">by ' + esc(post.author || 'Anonymous') + ' \u00b7 ' + timeAgo(post.timestamp) + '</div>' +
      (tags ? '<div class="tags" style="margin-bottom:1.5rem">' + tags + '</div>' : '') +
      '<div class="blog-post-content">' + markdownToHtml(post.content || '') + '</div>' +
      '<div style="margin-top:2rem;padding-top:2rem;border-top:1px solid var(--color-border)"><a href="/blog">&larr; Back to Blog</a></div>'
    document.title = post.title + ' — Blog'
  }

  window.renderAdminPosts = function() {
    var container = document.getElementById('admin-post-list')
    if (!container) return
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">Sign in to manage posts.</p>'; return }
    if (!posts.length) { container.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem">No posts yet.</p>'; return }
    container.innerHTML = posts.sort(function(a,b) { return b.timestamp - a.timestamp }).map(function(p) {
      return '<div class="admin-post-row"><div><div class="title" onclick="editPost(\'' + p.id + '\')">' + esc(p.title) + '</div><div class="meta">' + esc(p.category) + ' \u00b7 ' + timeAgo(p.timestamp) + '</div></div>' +
        '<div class="flex gap-sm"><button class="btn btn-outline" style="padding:0.25rem 0.75rem;font-size:0.8rem" onclick="editPost(\'' + p.id + '\')">Edit</button>' +
        '<button class="btn btn-outline" style="padding:0.25rem 0.75rem;font-size:0.8rem;color:var(--color-error)" onclick="if(confirm(\'Delete?\')){deletePost(\'' + p.id + '\')}">Delete</button></div></div>'
    }).join('')
  }

  window.editPost = function(id) {
    var post = posts.find(function(p) { return p.id === id })
    if (!post) return
    currentEditId = id
    document.getElementById('edit-modal-title').textContent = 'Edit Post'
    document.getElementById('edit-post-title').value = post.title
    document.getElementById('edit-post-category').value = post.category
    document.getElementById('edit-post-tags').value = (post.tags || []).join(', ')
    document.getElementById('edit-post-content').value = post.content
    document.getElementById('edit-post-modal').style.display = 'flex'
  }

  window.currentEditId = null

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('#edit-post-form')
    if (!form) return
    e.preventDefault()
    if (!currentEditId) return
    var post = posts.find(function(p) { return p.id === currentEditId })
    if (!post) return
    post.title = document.getElementById('edit-post-title').value
    post.category = document.getElementById('edit-post-category').value
    post.tags = (document.getElementById('edit-post-tags').value || '').split(',').map(function(t) { return t.trim() }).filter(Boolean)
    post.content = document.getElementById('edit-post-content').value
    localStorage.setItem('codefx_blog_posts', JSON.stringify(posts))
    document.getElementById('edit-post-modal').style.display = 'none'
    currentEditId = null
    renderAdminPosts()
    renderPosts()
    generateRSS()
  })

  window.deletePost = function(id) {
    posts = posts.filter(function(p) { return p.id !== id })
    localStorage.setItem('codefx_blog_posts', JSON.stringify(posts))
    currentEditId = null
    document.getElementById('edit-post-modal').style.display = 'none'
    renderAdminPosts()
    renderPosts()
    generateRSS()
  }

  function markdownToHtml(md) {
    var html = esc(md)
    html = html.replace(/\n{2,}/g, '</p><p>')
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    html = html.replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(new RegExp('`([^`]+)`','g'), '<code>$1</code>')
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/g, '<ul>$1</ul>')
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    html = html.replace(/<p><\/p>/g, '')
    return '<p>' + html + '</p>'
  }

  function generateRSS() {
    if (!posts.length) return
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n'
    xml += '<title>' + esc(document.title.replace(' — Blog', '') || 'Blog') + '</title>\n'
    xml += '<link>' + location.origin + '</link>\n'
    xml += '<description>Blog posts</description>\n'
    xml += '<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n'
    posts.slice().sort(function(a,b) { return b.timestamp - a.timestamp }).forEach(function(p) {
      xml += '<item>\n  <title>' + esc(p.title) + '</title>\n'
      xml += '  <link>' + location.origin + '/blog/post.html?id=' + p.id + '</link>\n'
      xml += '  <description>' + esc((p.content || '').slice(0,300)) + '</description>\n'
      xml += '  <pubDate>' + new Date(p.timestamp).toUTCString() + '</pubDate>\n'
      xml += '  <category>' + esc(p.category) + '</category>\n'
      xml += '</item>\n'
    })
    xml += '</channel></rss>'
    var blob = new Blob([xml], {type: 'application/rss+xml'})
    var link = document.getElementById('rss-link')
    if (link) link.href = URL.createObjectURL(blob)
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML }
  function timeAgo(ts) { var s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return 'just now'; var m = Math.floor(s / 60); if (m < 60) return m + 'm ago'; var h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; var d = Math.floor(h / 24); return d + 'd ago' }

  document.addEventListener('DOMContentLoaded', init)
})()