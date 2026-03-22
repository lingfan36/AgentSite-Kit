export const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgentSite Kit</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#fafafa;display:flex;min-height:100vh;color:#111;-webkit-font-smoothing:antialiased}
.sidebar{width:200px;background:#111;color:#888;padding:32px 0 20px;position:fixed;height:100vh;overflow-y:auto}
.sidebar h1{font-size:13px;font-weight:500;letter-spacing:2px;text-transform:uppercase;padding:0 24px 32px;color:#555}
.sidebar nav{display:flex;flex-direction:column;gap:2px}
.sidebar a{display:block;padding:10px 24px;color:#666;text-decoration:none;font-size:13px;font-weight:400;transition:color .15s;border-left:2px solid transparent}
.sidebar a:hover{color:#ccc}
.sidebar a.active{color:#fff;border-left-color:#fff}
.main{margin-left:200px;flex:1;padding:40px 48px;min-height:100vh;max-width:1200px}
h2{font-size:24px;font-weight:600;letter-spacing:-0.5px;margin-bottom:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:32px}
.card{background:#fff;padding:24px;border-radius:10px;border:1px solid #e8e8e8}
.card h3{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:10px}
.stat{font-size:36px;font-weight:600;color:#111;letter-spacing:-1px}
.table-wrap{background:#fff;border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;margin-bottom:32px}
table{width:100%;border-collapse:collapse}
th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #f0f0f0;font-size:13px}
th{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#999;background:#fff}
td{color:#333}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:500;background:#f0f0f0;color:#555}
.toolbar{display:flex;gap:10px;margin-bottom:20px}
.toolbar input,.toolbar select{padding:10px 14px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff;color:#111;outline:none;transition:border-color .15s}
.toolbar input:focus,.toolbar select:focus{border-color:#999}
.toolbar input{flex:1;min-width:200px}
.pre-wrap{background:#fff;border:1px solid #e8e8e8;border-radius:10px;padding:20px;font-family:'SF Mono',Consolas,monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-all;max-height:500px;overflow-y:auto;margin-bottom:20px;color:#333}
.file-card{background:#fff;border-radius:10px;border:1px solid #e8e8e8;margin-bottom:12px;overflow:hidden}
.file-card .file-header{padding:14px 20px;font-weight:500;font-size:13px;display:flex;justify-content:space-between;cursor:pointer;transition:background .15s}
.file-card .file-header:hover{background:#fafafa}
.file-card .file-body{padding:20px;display:none;border-top:1px solid #f0f0f0}
.file-card.open .file-body{display:block}
.log-entry{display:grid;grid-template-columns:180px 56px 1fr 56px 72px;gap:8px;padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:12px;align-items:center}
.log-entry:last-child{border-bottom:none}
.status-2xx{color:#333}.status-4xx{color:#a0a}.status-5xx{color:#c00}
.page-view{display:none}
.page-view.active{display:block}
.site-switcher{padding:12px 24px;margin-top:10px}
.site-switcher select{width:100%;padding:6px 8px;border-radius:6px;border:1px solid #333;background:#222;color:#ccc;font-size:12px}
btn{display:inline-block;padding:10px 24px;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:background .15s}
btn:hover{background:#333}
btn:disabled{opacity:.4;cursor:not-allowed}
.op-status{margin-top:10px;font-size:12px;color:#888}
</style>
</head>
<body>
<div class="sidebar">
<h1>AgentSite</h1>
<div class="site-switcher" id="siteSwitcher" style="display:none">
<select id="siteSelect"></select>
</div>
<nav>
<a href="#/" class="active">Overview</a>
<a href="#/pages">Pages</a>
<a href="#/files">Files</a>
<a href="#/config">Config</a>
<a href="#/logs">Logs</a>
<a href="#/sites">Sites</a>
<a href="#/export">Operations</a>
</nav>
</div>
<div class="main">

<div class="page-view active" id="page-overview">
<h2>Overview</h2>
<div class="grid" id="statsGrid"></div>
<div class="table-wrap">
<table><thead><tr><th>Title</th><th>Type</th><th>URL</th><th>Words</th></tr></thead>
<tbody id="overviewTable"></tbody></table>
</div>
</div>

<div class="page-view" id="page-pages">
<h2>Pages</h2>
<div class="toolbar">
<input type="text" id="pageSearch" placeholder="Search pages...">
<select id="typeFilter"><option value="">All types</option></select>
</div>
<div class="table-wrap">
<table><thead><tr><th>Title</th><th>Type</th><th>URL</th><th>Words</th><th>Tags</th></tr></thead>
<tbody id="pagesTable"></tbody></table>
</div>
</div>

<div class="page-view" id="page-files">
<h2>Files</h2>
<div id="filesList"></div>
</div>

<div class="page-view" id="page-config">
<h2>Config</h2>
<div class="pre-wrap" id="configContent">Loading...</div>
</div>

<div class="page-view" id="page-logs">
<h2>Logs</h2>
<div class="grid" id="logStats"></div>
<div class="table-wrap" style="margin-top:4px">
<div class="log-entry" style="font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#999">
<span>Timestamp</span><span>Method</span><span>Path</span><span>Status</span><span>Time</span>
</div>
<div id="logEntries"></div>
</div>
</div>

<div class="page-view" id="page-sites">
<h2>Sites</h2>
<div id="sitesContent">
<div class="card"><p style="font-size:13px;color:#666;line-height:1.6">Configure multiple sites in <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:12px">agentsite.config.yaml</code> using the <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:12px">sites</code> array.</p></div>
</div>
</div>

<div class="page-view" id="page-export">
<h2>Operations</h2>
<div class="grid" style="grid-template-columns:1fr 1fr">
<div class="card">
<h3>Re-scan</h3>
<p style="font-size:13px;color:#666;margin:8px 0 16px;line-height:1.5">Crawl the site and update scan results.</p>
<button class="btn" id="btnRescan">Start Rescan</button>
<div class="op-status" id="rescanStatus"></div>
</div>
<div class="card">
<h3>Regenerate</h3>
<p style="font-size:13px;color:#666;margin:8px 0 16px;line-height:1.5">Regenerate all output files from scan data.</p>
<button class="btn" id="btnRegenerate">Regenerate</button>
<div class="op-status" id="regenStatus"></div>
</div>
</div>
</div>

</div>
<script>
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

function loadOverview(){
  fetch('/api/stats').then(function(r){return r.json()}).then(function(s){
    var g=document.getElementById('statsGrid');
    g.innerHTML='<div class="card"><h3>Pages</h3><div class="stat">'+s.totalPages+'</div></div>'
      +'<div class="card"><h3>Words</h3><div class="stat">'+s.totalWords.toLocaleString()+'</div></div>'
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
  document.getElementById('overviewTable').innerHTML=pages.map(function(p){
    return '<tr><td>'+esc(p.title)+'</td><td><span class="badge">'+p.type+'</span></td><td style="font-size:12px;color:#999">'+esc(p.url)+'</td><td style="color:#999">'+p.wordCount+'</td></tr>';
  }).join('');
}

function renderPagesTable(pages){
  document.getElementById('pagesTable').innerHTML=pages.map(function(p){
    var tags=(p.tags||[]).join(', ');
    return '<tr><td>'+esc(p.title)+'</td><td><span class="badge">'+p.type+'</span></td><td style="font-size:12px;color:#999">'+esc(p.url)+'</td><td style="color:#999">'+p.wordCount+'</td><td style="font-size:11px;color:#bbb">'+esc(tags)+'</td></tr>';
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

function loadFiles(){
  fetch('/api/files').then(function(r){return r.json()}).then(function(d){
    document.getElementById('filesList').innerHTML=d.files.map(function(f){
      var preview=f.content?f.content.substring(0,2000):'';
      return '<div class="file-card"><div class="file-header" onclick="this.parentElement.classList.toggle(\\'open\\')"><span>'+esc(f.name)+'</span><span style="color:#bbb;font-weight:400">'+formatSize(f.size)+'</span></div><div class="file-body"><pre class="pre-wrap" style="margin:0;border:0;padding:0">'+esc(preview)+(f.size>2000?'\\n...':'')+'</pre></div></div>';
    }).join('');
  });
}

function loadConfig(){
  fetch('/api/config').then(function(r){return r.json()}).then(function(c){
    document.getElementById('configContent').textContent=JSON.stringify(c,null,2);
  });
}

function loadLogs(){
  fetch('/api/access-log?limit=200').then(function(r){return r.json()}).then(function(d){
    var entries=d.entries||[];
    var total=entries.length;
    var ok=entries.filter(function(e){return e.statusCode<400}).length;
    var avgTime=total?Math.round(entries.reduce(function(s,e){return s+e.responseTimeMs},0)/total):0;
    document.getElementById('logStats').innerHTML=
      '<div class="card"><h3>Requests</h3><div class="stat">'+total+'</div></div>'
      +'<div class="card"><h3>Success</h3><div class="stat">'+(total?Math.round(ok/total*100):0)+'%</div></div>'
      +'<div class="card"><h3>Avg Time</h3><div class="stat">'+avgTime+'<span style="font-size:14px;font-weight:400;color:#999">ms</span></div></div>';
    document.getElementById('logEntries').innerHTML=entries.slice(0,100).map(function(e){
      var cls=e.statusCode<400?'status-2xx':e.statusCode<500?'status-4xx':'status-5xx';
      return '<div class="log-entry"><span style="color:#999">'+new Date(e.timestamp).toLocaleString()+'</span><span style="font-weight:500">'+e.method+'</span><span style="color:#888">'+esc(e.path+(e.query?'?'+e.query:''))+'</span><span class="'+cls+'">'+e.statusCode+'</span><span style="color:#999">'+e.responseTimeMs+'ms</span></div>';
    }).join('');
  });
}

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

function esc(s){if(!s)return '';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function formatSize(b){if(b<1024)return b+'B';if(b<1048576)return (b/1024).toFixed(1)+'KB';return (b/1048576).toFixed(1)+'MB'}

loadOverview();
navigate();
</script>
</body>
</html>`;
