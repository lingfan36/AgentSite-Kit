export const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgentSite Kit Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#f5f5f5;display:flex;min-height:100vh}
.sidebar{width:220px;background:#1a1a2e;color:#fff;padding:20px 0;position:fixed;height:100vh;overflow-y:auto}
.sidebar h1{font-size:16px;padding:0 20px 20px;border-bottom:1px solid #333}
.sidebar nav{padding:10px 0}
.sidebar a{display:block;padding:10px 20px;color:#aaa;text-decoration:none;font-size:14px;transition:all .2s}
.sidebar a:hover,.sidebar a.active{background:#16213e;color:#fff}
.sidebar a .icon{margin-right:8px}
.main{margin-left:220px;flex:1;padding:20px;min-height:100vh}
.header{background:#fff;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
h2{font-size:20px;margin-bottom:5px}
.subtitle{color:#666;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px}
.card{background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.card h3{font-size:14px;margin-bottom:8px;color:#666}
.stat{font-size:28px;font-weight:bold;color:#0066cc}
.table-wrap{background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);margin-bottom:20px}
table{width:100%;border-collapse:collapse}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
th{background:#f9f9f9;font-weight:600}
.badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:500}
.badge-docs{background:#e3f2fd;color:#1976d2}
.badge-faq{background:#f3e5f5;color:#7b1fa2}
.badge-blog{background:#e8f5e9;color:#388e3c}
.badge-product{background:#fff3e0;color:#f57c00}
.badge-pricing{background:#fce4ec;color:#c2185b}
.badge-changelog{background:#e0f2f1;color:#00796b}
.badge-homepage{background:#f5f5f5;color:#616161}
.badge-about{background:#ede7f6;color:#512da8}
.badge-contact{background:#e8eaf6;color:#283593}
.badge-unknown{background:#eceff1;color:#546e7a}
.toolbar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.toolbar input,.toolbar select{padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px}
.toolbar input{flex:1;min-width:200px}
.pre-wrap{background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:16px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;max-height:500px;overflow-y:auto;margin-bottom:16px}
.file-card{background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);margin-bottom:16px;overflow:hidden}
.file-card .file-header{padding:12px 16px;background:#f9f9f9;font-weight:600;font-size:13px;display:flex;justify-content:space-between;cursor:pointer}
.file-card .file-body{padding:16px;display:none}
.file-card.open .file-body{display:block}
.log-entry{display:grid;grid-template-columns:180px 60px 1fr 60px 80px;gap:8px;padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;align-items:center}
.log-entry:hover{background:#f9f9f9}
.status-2xx{color:#388e3c}.status-4xx{color:#f57c00}.status-5xx{color:#c62828}
.page-view{display:none}
.page-view.active{display:block}
.tab-bar{display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #eee;padding-bottom:-2px}
.tab{padding:8px 16px;cursor:pointer;font-size:13px;color:#666;border-bottom:2px solid transparent;margin-bottom:-2px}
.tab.active{color:#0066cc;border-bottom-color:#0066cc}
.site-switcher{padding:10px 20px;margin-top:10px}
.site-switcher select{width:100%;padding:6px 8px;border-radius:4px;border:1px solid #444;background:#16213e;color:#fff;font-size:12px}
</style>
</head>
<body>
<div class="sidebar">
<h1>AgentSite Kit</h1>
<div class="site-switcher" id="siteSwitcher" style="display:none">
<select id="siteSelect"></select>
</div>
<nav>
<a href="#/" class="active"><span class="icon">&#9632;</span> Overview</a>
<a href="#/pages"><span class="icon">&#9776;</span> Pages</a>
<a href="#/files"><span class="icon">&#128196;</span> Files</a>
<a href="#/config"><span class="icon">&#9881;</span> Config</a>
<a href="#/logs"><span class="icon">&#128203;</span> Access Logs</a>
<a href="#/sites"><span class="icon">&#127760;</span> Sites</a>
<a href="#/export"><span class="icon">&#9654;</span> Operations</a>
</nav>
</div>
<div class="main">

<!-- Overview Page -->
<div class="page-view active" id="page-overview">
<div class="header"><h2>Overview</h2><p class="subtitle">Site health at a glance</p></div>
<div class="grid" id="statsGrid"></div>
<div class="table-wrap">
<table><thead><tr><th>Title</th><th>Type</th><th>URL</th><th>Words</th></tr></thead>
<tbody id="overviewTable"></tbody></table>
</div>
</div>

<!-- Pages Page -->
<div class="page-view" id="page-pages">
<div class="header"><h2>Pages</h2><p class="subtitle">All scanned pages</p></div>
<div class="toolbar">
<input type="text" id="pageSearch" placeholder="Search pages...">
<select id="typeFilter"><option value="">All types</option></select>
</div>
<div class="table-wrap">
<table><thead><tr><th>Title</th><th>Type</th><th>URL</th><th>Words</th><th>Tags</th></tr></thead>
<tbody id="pagesTable"></tbody></table>
</div>
</div>

<!-- Files Page -->
<div class="page-view" id="page-files">
<div class="header"><h2>Generated Files</h2><p class="subtitle">Preview output files</p></div>
<div id="filesList"></div>
</div>

<!-- Config Page -->
<div class="page-view" id="page-config">
<div class="header"><h2>Configuration</h2><p class="subtitle">Current AgentSite config (API keys hidden)</p></div>
<div class="pre-wrap" id="configContent">Loading...</div>
</div>

<!-- Logs Page -->
<div class="page-view" id="page-logs">
<div class="header"><h2>Access Logs</h2><p class="subtitle">Recent API requests</p></div>
<div class="grid" id="logStats"></div>
<div class="table-wrap" style="margin-top:16px">
<div class="log-entry" style="font-weight:600;background:#f9f9f9">
<span>Timestamp</span><span>Method</span><span>Path</span><span>Status</span><span>Time</span>
</div>
<div id="logEntries"></div>
</div>
</div>

<!-- Sites Page -->
<div class="page-view" id="page-sites">
<div class="header"><h2>Sites</h2><p class="subtitle">Multi-site management</p></div>
<div id="sitesContent">
<div class="card"><p>Configure multiple sites in your <code>agentsite.config.yaml</code> using the <code>sites</code> array.</p></div>
</div>
</div>

<!-- Export/Operations Page -->
<div class="page-view" id="page-export">
<div class="header"><h2>Operations</h2><p class="subtitle">Trigger scan and generation tasks</p></div>
<div class="grid">
<div class="card">
<h3>Re-scan Site</h3>
<p style="font-size:13px;color:#666;margin-bottom:12px">Crawl the site again and update scan results.</p>
<button id="btnRescan" style="padding:8px 20px;background:#0066cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Start Rescan</button>
<div id="rescanStatus" style="margin-top:8px;font-size:12px;color:#666"></div>
</div>
<div class="card">
<h3>Regenerate Files</h3>
<p style="font-size:13px;color:#666;margin-bottom:12px">Regenerate all output files from scan results.</p>
<button id="btnRegenerate" style="padding:8px 20px;background:#388e3c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Regenerate</button>
<div id="regenStatus" style="margin-top:8px;font-size:12px;color:#666"></div>
</div>
</div>
</div>

</div>
<script>
// Router
var allPages=[];
function navigate(){
  var hash=location.hash||'#/';
  var route=hash.replace('#','');
  document.querySelectorAll('.page-view').forEach(function(el){el.classList.remove('active')});
  document.querySelectorAll('.sidebar a').forEach(function(el){el.classList.remove('active')});
  var pageMap={'/':"page-overview",'/pages':"page-pages",'/files':"page-files",'/config':"page-config",'/logs':"page-logs",'/sites':"page-sites",'/export':"page-export"};
  var pageId=pageMap[route]||'page-overview';
  var el=document.getElementById(pageId);
  if(el)el.classList.add('active');
  var link=document.querySelector('.sidebar a[href="'+hash+'"]');
  if(link)link.classList.add('active');
  if(route==='/logs')loadLogs();
  if(route==='/files')loadFiles();
  if(route==='/config')loadConfig();
}
window.addEventListener('hashchange',navigate);

// Load overview + stats
function loadOverview(){
  fetch('/api/stats').then(function(r){return r.json()}).then(function(s){
    var g=document.getElementById('statsGrid');
    g.innerHTML='<div class="card"><h3>Total Pages</h3><div class="stat">'+s.totalPages+'</div></div>'
      +'<div class="card"><h3>Total Words</h3><div class="stat">'+s.totalWords.toLocaleString()+'</div></div>'
      +'<div class="card"><h3>Docs</h3><div class="stat">'+(s.pageTypes.docs||0)+'</div></div>'
      +'<div class="card"><h3>FAQ</h3><div class="stat">'+(s.pageTypes.faq||0)+'</div></div>'
      +'<div class="card"><h3>Blog</h3><div class="stat">'+(s.pageTypes.blog||0)+'</div></div>'
      +'<div class="card"><h3>Products</h3><div class="stat">'+(s.pageTypes.product||0)+'</div></div>';
  });
  fetch('/api/pages-data').then(function(r){return r.json()}).then(function(d){
    allPages=d.pages||[];
    renderOverviewTable(allPages.slice(0,20));
    renderPagesTable(allPages);
    populateTypeFilter(allPages);
  });
}

function renderOverviewTable(pages){
  var tb=document.getElementById('overviewTable');
  tb.innerHTML=pages.map(function(p){
    return '<tr><td>'+esc(p.title)+'</td><td><span class="badge badge-'+p.type+'">'+p.type+'</span></td><td style="font-size:12px;color:#666">'+esc(p.url)+'</td><td>'+p.wordCount+'</td></tr>';
  }).join('');
}

// Pages
function renderPagesTable(pages){
  var tb=document.getElementById('pagesTable');
  tb.innerHTML=pages.map(function(p){
    var tags=(p.tags||[]).join(', ');
    return '<tr><td>'+esc(p.title)+'</td><td><span class="badge badge-'+p.type+'">'+p.type+'</span></td><td style="font-size:12px;color:#666">'+esc(p.url)+'</td><td>'+p.wordCount+'</td><td style="font-size:11px;color:#888">'+esc(tags)+'</td></tr>';
  }).join('');
}

function populateTypeFilter(pages){
  var types={};pages.forEach(function(p){types[p.type]=1});
  var sel=document.getElementById('typeFilter');
  Object.keys(types).sort().forEach(function(t){
    var o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o);
  });
}

document.getElementById('pageSearch').addEventListener('input',filterPages);
document.getElementById('typeFilter').addEventListener('change',filterPages);
function filterPages(){
  var q=document.getElementById('pageSearch').value.toLowerCase();
  var t=document.getElementById('typeFilter').value;
  var filtered=allPages.filter(function(p){
    if(t&&p.type!==t)return false;
    if(q&&p.title.toLowerCase().indexOf(q)===-1&&p.url.toLowerCase().indexOf(q)===-1)return false;
    return true;
  });
  renderPagesTable(filtered);
}

// Files
function loadFiles(){
  fetch('/api/files').then(function(r){return r.json()}).then(function(d){
    var container=document.getElementById('filesList');
    container.innerHTML=d.files.map(function(f){
      var preview=f.content?f.content.substring(0,2000):'';
      return '<div class="file-card"><div class="file-header" onclick="this.parentElement.classList.toggle(\\'open\\')"><span>'+esc(f.name)+'</span><span style="color:#888">'+formatSize(f.size)+'</span></div><div class="file-body"><pre class="pre-wrap">'+esc(preview)+(f.size>2000?'\\n...truncated':'')+'</pre></div></div>';
    }).join('');
  });
}

// Config
function loadConfig(){
  fetch('/api/config').then(function(r){return r.json()}).then(function(c){
    document.getElementById('configContent').textContent=JSON.stringify(c,null,2);
  });
}

// Logs
function loadLogs(){
  fetch('/api/access-log?limit=200').then(function(r){return r.json()}).then(function(d){
    var entries=d.entries||[];
    // Stats
    var total=entries.length;
    var ok=entries.filter(function(e){return e.statusCode<400}).length;
    var avgTime=total?Math.round(entries.reduce(function(s,e){return s+e.responseTimeMs},0)/total):0;
    document.getElementById('logStats').innerHTML=
      '<div class="card"><h3>Recent Requests</h3><div class="stat">'+total+'</div></div>'
      +'<div class="card"><h3>Success Rate</h3><div class="stat">'+(total?Math.round(ok/total*100):0)+'%</div></div>'
      +'<div class="card"><h3>Avg Response</h3><div class="stat">'+avgTime+'ms</div></div>';
    // Entries
    var container=document.getElementById('logEntries');
    container.innerHTML=entries.slice(0,100).map(function(e){
      var cls=e.statusCode<400?'status-2xx':e.statusCode<500?'status-4xx':'status-5xx';
      return '<div class="log-entry"><span>'+new Date(e.timestamp).toLocaleString()+'</span><span><b>'+e.method+'</b></span><span style="color:#666">'+esc(e.path+(e.query?'?'+e.query:''))+'</span><span class="'+cls+'">'+e.statusCode+'</span><span>'+e.responseTimeMs+'ms</span></div>';
    }).join('');
  });
}

// Operations
document.getElementById('btnRescan').addEventListener('click',function(){
  var btn=this;btn.disabled=true;btn.textContent='Scanning...';
  document.getElementById('rescanStatus').textContent='Running...';
  fetch('/api/rescan',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
    document.getElementById('rescanStatus').textContent=d.message||'Done';
    btn.disabled=false;btn.textContent='Start Rescan';
    loadOverview();
  }).catch(function(e){
    document.getElementById('rescanStatus').textContent='Error: '+e.message;
    btn.disabled=false;btn.textContent='Start Rescan';
  });
});
document.getElementById('btnRegenerate').addEventListener('click',function(){
  var btn=this;btn.disabled=true;btn.textContent='Generating...';
  document.getElementById('regenStatus').textContent='Running...';
  fetch('/api/regenerate',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
    document.getElementById('regenStatus').textContent=d.message||'Done';
    btn.disabled=false;btn.textContent='Regenerate';
  }).catch(function(e){
    document.getElementById('regenStatus').textContent='Error: '+e.message;
    btn.disabled=false;btn.textContent='Regenerate';
  });
});

// Utils
function esc(s){if(!s)return '';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function formatSize(b){if(b<1024)return b+'B';if(b<1048576)return (b/1024).toFixed(1)+'KB';return (b/1048576).toFixed(1)+'MB'}

// Init
loadOverview();
navigate();
</script>
</body>
</html>`;
