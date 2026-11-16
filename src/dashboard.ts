const emblemLight = 'data:image/png;base64,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';
const faviconTile = 'data:image/png;base64,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';

export function renderDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SpecForge dashboard · NoxaPlus</title>
<meta name="color-scheme" content="dark"/>
<link rel="icon" type="image/png" href="${faviconTile}"/>
<style>
:root{--bg:#080b14;--card:#101728;--card-2:#0b1120;--line:rgba(148,163,184,.16);--text:#e9eefb;--muted:#93a4c3;--faint:#64748b;--accent:#a78bfa;--accent-2:#22d3ee;--good:#34d399;--warn:#fbbf24;--bad:#f87171;--shadow:0 20px 60px rgba(0,0,0,.45)}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(60% 50% at 15% 0%,rgba(167,139,250,.14),transparent 65%),radial-gradient(50% 45% at 90% 0%,rgba(34,211,238,.12),transparent 60%),var(--bg);color:var(--text);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh}
a{color:var(--accent-2);text-decoration:none}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 28px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(8,11,20,.82);backdrop-filter:blur(12px);z-index:10}
.brand{display:flex;align-items:center;gap:11px;font-weight:700;letter-spacing:.01em}
.emblem{height:32px;width:auto;display:block;flex:none}
.brand small{color:var(--muted);font-weight:500}
.header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.base{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--card);border-radius:10px;padding:7px 10px;font-size:12px;color:var(--muted);max-width:100%}
.base code{color:var(--accent-2);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}
button{border:1px solid var(--line);background:var(--card);color:var(--muted);border-radius:9px;padding:7px 11px;font:inherit;font-size:12px;cursor:pointer}
button:hover{color:var(--text);border-color:rgba(167,139,250,.5)}
button.primary{background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(34,211,238,.16));border-color:rgba(167,139,250,.35);color:var(--text)}
main{max-width:1240px;margin:0 auto;padding:24px 22px 60px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.stat span{display:block;color:var(--faint);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.stat strong{font-size:24px;letter-spacing:-.02em}
.stat small{color:var(--faint);font-size:11px;margin-left:6px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow)}
.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--line);background:rgba(148,163,184,.04)}
.panel-head h2{margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.panel-head .hint{color:var(--faint);font-size:11px}
.columns{display:grid;grid-template-columns:1fr 1.15fr;gap:16px;align-items:start}
.scroll{max-height:520px;overflow:auto}
.routes{list-style:none;margin:0;padding:6px 0}
.routes li{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:9px 18px;border-top:1px solid rgba(148,163,184,.08);cursor:default}
.routes li:first-child{border-top:0}
.method{font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-align:center;padding:6px 0;border-radius:6px;background:rgba(148,163,184,.12);color:var(--muted)}
.method-GET{background:rgba(52,211,153,.14);color:#6ee7b7}
.method-POST{background:rgba(34,211,238,.14);color:#67e8f9}
.method-PUT{background:rgba(251,191,36,.14);color:#fcd34d}
.method-PATCH{background:rgba(167,139,250,.16);color:#c4b5fd}
.method-DELETE{background:rgba(248,113,113,.14);color:#fca5a5}
.route-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--text);word-break:break-all}
.route-summary{display:block;color:var(--faint);font-size:11px;margin-top:2px}
.kind{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);border:1px solid var(--line);border-radius:999px;padding:3px 8px;white-space:nowrap}
.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 18px;border-bottom:1px solid var(--line)}
.controls label{font-size:11px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em}
.controls input{width:86px;background:var(--card-2);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:6px 8px;font:inherit;font-size:12px}
.logs{width:100%;border-collapse:collapse;font-size:12px}
.logs th{text-align:left;color:var(--faint);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:10px 14px;background:rgba(148,163,184,.03);position:sticky;top:0}
.logs td{padding:9px 14px;border-top:1px solid rgba(148,163,184,.08);color:var(--muted);vertical-align:middle}
.logs tr.row{cursor:pointer}
.logs tr.row:hover td{background:rgba(167,139,250,.05)}
.logs .path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--text);word-break:break-all}
.status{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;font-size:11px}
.s2{color:var(--good)}.s3{color:var(--warn)}.s4,.s5{color:var(--bad)}
.badge{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--warn);border:1px solid rgba(251,191,36,.35);border-radius:999px;padding:2px 6px;margin-left:6px}
.empty{padding:36px 18px;text-align:center;color:var(--faint);font-size:12px}
footer{max-width:1240px;margin:0 auto;padding:0 22px 30px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--faint);font-size:11px}
.modal{position:fixed;inset:0;background:rgba(3,6,12,.72);display:none;align-items:center;justify-content:center;padding:20px;z-index:50}
.modal.open{display:flex}
.sheet{width:min(820px,100%);max-height:86vh;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px}
.sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
.sheet h3{margin:0;font-size:15px}
.sheet .meta{color:var(--faint);font-size:11px;margin-top:3px}
pre{background:var(--card-2);border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto;font:11px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:#cbd5e1;max-height:260px}
.label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:14px 0 5px}
@media (max-width:920px){.columns{grid-template-columns:1fr}header{padding:16px 18px}main{padding:18px 14px 40px}.base code{max-width:160px}}
</style>
</head>
<body>
<header>
  <div class="brand"><img class="emblem" src="${emblemLight}" alt="NoxaPlus"/><div>SpecForge <small>by NoxaPlus</small></div></div>
  <div class="header-actions">
    <span class="base">API <code id="base">loading</code><button id="copy" type="button">Copy</button></span>
    <button id="reset" type="button">Reset data</button>
  </div>
</header>
<main>
  <div class="stats">
    <div class="stat"><span>Spec</span><strong id="specTitle">-</strong><small id="specVersion"></small></div>
    <div class="stat"><span>Routes</span><strong id="routeCount">0</strong></div>
    <div class="stat"><span>Requests</span><strong id="requestCount">0</strong></div>
    <div class="stat"><span>Errors</span><strong id="errorCount">0</strong></div>
    <div class="stat"><span>Average latency</span><strong id="avgLatency">0</strong><small>ms</small></div>
  </div>
  <div class="columns">
    <section class="panel">
      <div class="panel-head"><h2>Routes</h2><span class="hint" id="stateSummary">seed 42</span></div>
      <div class="scroll"><ul class="routes" id="routes"></ul></div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Request log</h2><span class="hint" id="updated">waiting for data</span></div>
      <div class="controls">
        <label for="latency">Latency</label>
        <input id="latency" type="number" min="0" max="10000" step="50" value="0" aria-label="Simulated latency in milliseconds"/>
        <label for="errorRate">Error rate</label>
        <input id="errorRate" type="number" min="0" max="100" step="5" value="0" aria-label="Simulated error rate percent"/>
        <button class="primary" id="apply" type="button">Apply</button>
        <span class="hint">Changes last until restart</span>
      </div>
      <div class="scroll">
        <table class="logs">
          <thead><tr><th>Method</th><th>Path</th><th>Status</th><th>Time</th></tr></thead>
          <tbody id="logs"></tbody>
        </table>
        <div class="empty" id="noLogs">No requests yet. Call an API route, then refresh.</div>
      </div>
    </section>
  </div>
</main>
<footer>
  <span>SpecForge mock server · everything stays on this machine</span>
  <span><a href="https://github.com/noxaplus-star/noxaplus-specforge">NoxaPlus SpecForge</a> · MIT</span>
</footer>

<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="sheet">
    <div class="sheet-head">
      <div><h3 id="modalTitle">Request</h3><div class="meta" id="modalMeta"></div></div>
      <button id="close" type="button">Close</button>
    </div>
    <div class="label">Request body</div><pre id="reqBody">-</pre>
    <div class="label">Response body</div><pre id="resBody">-</pre>
  </div>
</div>

<script>
(function(){
  var state = null;
  var lastRequestId = null;

  function el(id){ return document.getElementById(id); }
  function escapeHtml(value){
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pretty(value){
    if(value === null || value === undefined) return '-';
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch (error) { return String(value); }
  }
  function statusClass(status){ return status >= 500 ? 's5' : status >= 400 ? 's4' : status >= 300 ? 's3' : 's2'; }

  function renderRoutes(routes){
    el('routes').innerHTML = routes.map(function(route){
      return '<li><span class="method method-' + route.method + '">' + route.method + '</span>' +
        '<div><span class="route-path">' + escapeHtml(route.path) + '</span>' +
        '<span class="route-summary">' + escapeHtml(route.summary || route.operationId) + '</span></div>' +
        '<span class="kind">' + escapeHtml(route.kind) + '</span></li>';
    }).join('');
  }

  function renderLogs(requests){
    el('noLogs').style.display = requests.length ? 'none' : 'block';
    el('logs').innerHTML = requests.map(function(entry, index){
      return '<tr class="row" data-index="' + index + '">' +
        '<td><span class="method method-' + entry.method + '">' + entry.method + '</span></td>' +
        '<td class="path">' + escapeHtml(entry.path) + (entry.simulated ? '<span class="badge">simulated</span>' : '') + '</td>' +
        '<td class="status ' + statusClass(entry.status) + '">' + entry.status + '</td>' +
        '<td>' + entry.durationMs + ' ms</td></tr>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.row'), function(row){
      row.addEventListener('click', function(){
        var entry = state.requests[Number(row.dataset.index)];
        if(!entry) return;
        el('modalTitle').textContent = entry.method + ' ' + entry.path;
        el('modalMeta').textContent = entry.time + ' · status ' + entry.status + ' · ' + entry.durationMs + ' ms';
        el('reqBody').textContent = pretty(entry.requestBody);
        el('resBody').textContent = pretty(entry.responseBody);
        el('modal').classList.add('open');
      });
    });
  }

  function render(next){
    state = next;
    el('specTitle').textContent = state.spec.title;
    el('specVersion').textContent = 'v' + state.spec.version + ' · OpenAPI ' + state.spec.openapi;
    el('routeCount').textContent = state.routes.length;
    el('requestCount').textContent = state.stats.requests;
    el('errorCount').textContent = state.stats.errors;
    el('avgLatency').textContent = state.stats.avgDuration;
    el('base').textContent = state.baseUrl || 'http://localhost';
    el('stateSummary').textContent = 'seed ' + state.runtime.seed;
    el('latency').value = state.runtime.latency;
    el('errorRate').value = Math.round(state.runtime.errorRate * 100);
    el('updated').textContent = 'updated ' + new Date().toLocaleTimeString();
    renderRoutes(state.routes);
    renderLogs(state.requests);
  }

  async function refresh(){
    try {
      var response = await fetch('/__specforge/api/state', { cache: 'no-store' });
      render(await response.json());
    } catch (error) {
      el('updated').textContent = 'dashboard disconnected';
    }
  }

  async function post(path, body){
    await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    refresh();
  }

  el('apply').addEventListener('click', function(){
    var latency = Number(el('latency').value);
    var rate = Number(el('errorRate').value) / 100;
    post('/__specforge/api/simulate', { latency: latency, errorRate: rate });
  });
  el('reset').addEventListener('click', function(){ post('/__specforge/api/reset'); });
  el('copy').addEventListener('click', async function(){
    try { await navigator.clipboard.writeText(el('base').textContent); el('copy').textContent = 'Copied'; setTimeout(function(){ el('copy').textContent = 'Copy'; }, 1500); } catch (error) {}
  });
  el('close').addEventListener('click', function(){ el('modal').classList.remove('open'); });
  el('modal').addEventListener('click', function(event){ if(event.target === el('modal')) el('modal').classList.remove('open'); });
  document.addEventListener('keydown', function(event){ if(event.key === 'Escape') el('modal').classList.remove('open'); });

  refresh();
  setInterval(refresh, 2000);
})();
</script>
</body>
</html>`;
}
