(function(){'use strict';
var tools = [
  { name: 'markdown-preview', title: 'Markdown Preview', desc: 'Preview rendered markdown', category: 'content', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
  { name: 'json-formatter', title: 'JSON Formatter', desc: 'Format, validate, minify JSON', category: 'developer', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { name: 'base64', title: 'Base64 Encoder/Decoder', desc: 'Encode or decode Base64 strings', category: 'developer', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { name: 'color-converter', title: 'Color Converter', desc: 'HEX, RGB, HSL conversion', category: 'design', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' }
]
function loadTools() {
  var grid = document.getElementById('tool-grid')
  if (!grid) return
  grid.innerHTML = tools.map(function(t) {
    return '<div class="tool-card" onclick="openTool(\'' + t.name + '\')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="' + t.icon + '"/></svg><div class="name">' + esc(t.title) + '</div><div class="desc">' + esc(t.desc) + '</div><div class="category">' + esc(t.category) + '</div></div>'
  }).join('')
}
window.openTool = function(name) {
  var tool = tools.find(function(t) { return t.name === name })
  if (!tool) return
  document.getElementById('tool-grid').style.display = 'none'
  document.getElementById('tool-panel').style.display = 'block'
  var content = document.getElementById('tool-content')
  if (name === 'markdown-preview') {
    content.innerHTML = '<h2 style="margin-bottom:1rem">Markdown Preview</h2><textarea id="md-input" placeholder="Enter markdown..." oninput="previewMarkdown()"># Hello\n\nType **markdown** here.</textarea><div id="md-output" class="output"><h1>Hello</h1><br><strong>markdown</strong> here.</div>'
  } else if (name === 'json-formatter') {
    content.innerHTML = '<h2 style="margin-bottom:1rem">JSON Formatter</h2><textarea id="json-input" placeholder="Paste JSON here..." oninput="formatJSON()">{"name": "CodeFX","version": "1.0.0"}</textarea><div style="display:flex;gap:0.5rem;margin-bottom:0.75rem"><button class="btn btn-primary" onclick="formatJSON()">Format</button><label><input type="checkbox" id="json-minify" onchange="formatJSON()"> Minify</label></div><div id="json-output" class="output">{\n  "name": "CodeFX",\n  "version": "1.0.0"\n}</div>'
  } else if (name === 'base64') {
    content.innerHTML = '<h2 style="margin-bottom:1rem">Base64</h2><select id="b64-action" style="margin-bottom:0.75rem"><option value="encode">Encode</option><option value="decode">Decode</option></select><textarea id="b64-input" placeholder="Enter text..." oninput="convertBase64()">Hello CodeFX</textarea><div id="b64-output" class="output">SGVsbG8gQ29kZUZY</div>'
  } else if (name === 'color-converter') {
    content.innerHTML = '<h2 style="margin-bottom:1rem">Color Converter</h2><div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem"><input type="color" id="color-picker" value="#3b82f6" oninput="convertColor()" style="width:64px;height:64px;padding:0;border:none;cursor:pointer"><input type="text" id="color-hex" value="#3b82f6" oninput="convertColor()" placeholder="#hex"></div><div id="color-output" class="output">HEX: #3b82f6\nRGB: rgb(59, 130, 246)\nHSL: hsl(217, 91%, 60%)</div>'
  }
}
window.closeTool = function() {
  document.getElementById('tool-grid').style.display = 'grid'
  document.getElementById('tool-panel').style.display = 'none'
}
window.previewMarkdown = function() {
  var md = document.getElementById('md-input').value
  var out = document.getElementById('md-output')
  var html = md.replace(/### (.+)/g, '<h3>$1</h3>').replace(/## (.+)/g, '<h2>$1</h2>').replace(/# (.+)/g, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>').replace(/\n/g, '<br>')
  out.innerHTML = html
}
window.formatJSON = function() {
  var input = document.getElementById('json-input').value
  var minify = document.getElementById('json-minify').checked
  var out = document.getElementById('json-output')
  try { var parsed = JSON.parse(input); out.textContent = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2) }
  catch(e) { out.textContent = 'Error: ' + e.message }
}
window.convertBase64 = function() {
  var action = document.getElementById('b64-action').value
  var input = document.getElementById('b64-input').value
  var out = document.getElementById('b64-output')
  try {
    if (action === 'encode') out.textContent = btoa(input)
    else out.textContent = atob(input)
  } catch(e) { out.textContent = 'Error: ' + e.message }
}
window.convertColor = function() {
  var picker = document.getElementById('color-picker')
  var hexInput = document.getElementById('color-hex')
  var out = document.getElementById('color-output')
  var hex = /^#[0-9a-f]{6}$/i.test(hexInput.value) ? hexInput.value : picker.value
  hexInput.value = hex; picker.value = hex
  var r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  var rl=r/255, gl=g/255, bl=b/255, max=Math.max(rl,gl,bl), min=Math.min(rl,gl,bl)
  var h, s, l = (max+min)/2
  if (max===min) { h=s=0 } else { var d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); if(max===rl)h=((gl-bl)/d+(gl<bl?6:0))*60; else if(max===gl)h=((bl-rl)/d+2)*60; else h=((rl-gl)/d+4)*60 }
  out.innerHTML = 'HEX: ' + hex + '\nRGB: rgb(' + r + ', ' + g + ', ' + b + ')\nHSL: hsl(' + Math.round(h) + ', ' + Math.round(s*100) + '%, ' + Math.round(l*100) + '%)'
}
function esc(s) { if(!s)return''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML }
loadTools()
})();