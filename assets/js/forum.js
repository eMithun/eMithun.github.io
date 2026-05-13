(function() {
  'use strict'

  var categories = ['tech', 'plant', 'photography']
  var posts = JSON.parse(localStorage.getItem('codefx_forum_posts') || '[]')

  function init() {
    if (document.getElementById('forum-categories')) renderCategories()
    if (document.getElementById('forum-posts')) renderPosts()
    if (document.getElementById('post-view')) renderPostView()
  }

  function renderCategories() {
    var container = document.getElementById('forum-categories')
    container.innerHTML = '<div class="forum-categories flex gap-sm" style="margin-bottom:1.5rem">' +
      categories.map(function(c) { return '<button class="btn btn-outline category-btn" data-cat="' + c + '">' + capitalize(c) + '</button>' }).join('') +
      '<button class="btn btn-outline category-btn active" data-cat="all">All</button></div>'

    container.querySelectorAll('.category-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active') })
        this.classList.add('active')
        filterPosts(this.dataset.cat)
      })
    })
  }

  function renderPosts(filter) {
    var container = document.getElementById('forum-posts')
    var filtered = filter && filter !== 'all' ? posts.filter(function(p) { return p.category === filter }) : posts
    container.innerHTML = filtered.length ? filtered.sort(function(a,b) { return b.timestamp - a.timestamp }).map(function(p) {
      return '<div class="forum-post" onclick="location.href=\'/forum/post.html?id=' + p.id + '\'">' +
        '<span class="category">' + capitalize(p.category) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="meta">by ' + esc(p.author) + ' \u00b7 ' + timeAgo(p.timestamp) + '</p></div>'
    }).join('') : '<p class="text-muted" style="text-align:center;padding:2rem">No posts yet. Be the first!</p>'
  }

  window.filterPosts = function(cat) { renderPosts(cat) }

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
    posts.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      category: document.getElementById('post-category').value,
      title: document.getElementById('post-title').value,
      content: document.getElementById('post-content').value,
      author: auth.name || auth.email || 'Anonymous',
      timestamp: Date.now(),
      replies: []
    })
    localStorage.setItem('codefx_forum_posts', JSON.stringify(posts))
    document.getElementById('new-post-modal').style.display = 'none'
    form.reset()
    renderPosts()
  })

  function renderPostView() {
    var params = new URLSearchParams(location.search)
    var id = params.get('id')
    var post = posts.find(function(p) { return p.id === id })
    if (!post) { document.getElementById('post-view').innerHTML = '<p>Post not found</p>'; return }
    document.getElementById('post-view').innerHTML =
      '<span class="category">' + capitalize(post.category) + '</span>' +
      '<h1 style="font-size:1.5rem;font-weight:700;margin:1rem 0 0.5rem">' + esc(post.title) + '</h1>' +
      '<p class="text-muted" style="font-size:0.875rem;margin-bottom:1rem">by ' + esc(post.author) + ' \u00b7 ' + timeAgo(post.timestamp) + '</p>' +
      '<div style="line-height:1.7">' + esc(post.content) + '</div>'
    var replies = post.replies || []
    document.getElementById('replies').innerHTML = replies.length
      ? '<h3 style="margin-bottom:1rem">' + replies.length + ' Replies</h3>' + replies.map(function(r) {
          return '<div class="reply"><div class="meta">' + esc(r.author) + ' \u00b7 ' + timeAgo(r.timestamp) + '</div><div>' + esc(r.content) + '</div></div>'
        }).join('')
      : '<p class="text-muted">No replies yet.</p>'
  }

  window.submitReply = function() {
    var auth = JSON.parse(localStorage.getItem('codefx_session') || 'null')
    if (!auth) { alert('Sign in to reply'); return }
    var params = new URLSearchParams(location.search)
    var id = params.get('id')
    var post = posts.find(function(p) { return p.id === id })
    if (!post) return
    var content = document.getElementById('reply-content').value
    if (!content.trim()) return
    post.replies = post.replies || []
    post.replies.push({ author: auth.name || auth.email || 'Anonymous', content: content.trim(), timestamp: Date.now() })
    localStorage.setItem('codefx_forum_posts', JSON.stringify(posts))
    document.getElementById('reply-content').value = ''
    renderPostView()
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML }
  function timeAgo(ts) { var s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return 'just now'; var m = Math.floor(s / 60); if (m < 60) return m + 'm ago'; var h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; var d = Math.floor(h / 24); return d + 'd ago' }

  document.addEventListener('DOMContentLoaded', init)
})()