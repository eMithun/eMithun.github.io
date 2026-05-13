(function() {
  'use strict'

  const EDIT_KEY = 'codefx_cms_edits'
  let isEditing = false
  let edits = JSON.parse(localStorage.getItem(EDIT_KEY) || '{}')

  function getAuth() {
    try { return JSON.parse(localStorage.getItem('codefx_session') || 'null') } catch { return null }
  }

  function enableEditMode() {
    if (!getAuth()) { alert('Sign in to edit'); return }
    isEditing = !isEditing
    document.body.classList.toggle('codefx-editing', isEditing)
    document.querySelectorAll('[data-edit]').forEach(el => {
      el.contentEditable = isEditing
      el.classList.toggle('codefx-editable', isEditing)
    })
    if (!isEditing) saveAllEdits()
  }

  document.addEventListener('dblclick', function(e) {
    const editable = e.target.closest('[data-edit]')
    if (!editable || !getAuth()) return
    editable.contentEditable = true
    editable.focus()
    editable.classList.add('codefx-editing-now')
    editable.addEventListener('blur', function() {
      this.contentEditable = false
      this.classList.remove('codefx-editing-now')
      saveEdit(this.dataset.edit, this.innerHTML)
    }, { once: true })
  })

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isEditing) { enableEditMode(); return }
    if (e.ctrlKey && e.shiftKey && e.key === 'E') { e.preventDefault(); enableEditMode() }
  })

  function saveEdit(key, content) {
    edits[key] = { content, updated: Date.now() }
    localStorage.setItem(EDIT_KEY, JSON.stringify(edits))
  }

  function saveAllEdits() {
    document.querySelectorAll('[data-edit]').forEach(el => {
      edits[el.dataset.edit] = { content: el.innerHTML, updated: Date.now() }
    })
    localStorage.setItem(EDIT_KEY, JSON.stringify(edits))
    syncToServer()
  }

  function syncToServer() {
    const mode = document.querySelector('meta[name="codefx-mode"]')?.content || 'static'
    if (mode === 'static') return
    const auth = getAuth()
    if (!auth) return
    fetch('/api/cms/sections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (auth.token || '') },
      body: JSON.stringify(edits)
    }).catch(function() {})
  }

  function restoreEdits() {
    Object.entries(edits).forEach(function([key, data]) {
      const el = document.querySelector('[data-edit="' + key + '"]')
      if (el && data.content) el.innerHTML = data.content
    })
  }

  document.addEventListener('DOMContentLoaded', restoreEdits)

  window.CodeFX && CodeFX.on('auth:login', function() {
    isEditing = true
    document.body.classList.add('codefx-editing')
    document.querySelectorAll('[data-edit]').forEach(el => {
      el.contentEditable = true
      el.classList.add('codefx-editable')
    })
  })

  window.CodeFX && CodeFX.on('auth:logout', function() {
    isEditing = false
    document.body.classList.remove('codefx-editing')
    document.querySelectorAll('[data-edit]').forEach(el => {
      el.contentEditable = false
      el.classList.remove('codefx-editable')
    })
  })
})()