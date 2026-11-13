export function renderDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SpecForge dashboard · NoxaPlus</title>
<meta name="color-scheme" content="dark"/>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23a78bfa'/%3E%3Ctext x='16' y='22' font-family='Segoe UI,sans-serif' font-size='17' font-weight='700' text-anchor='middle' fill='%23080b14'%3ES%3C/text%3E%3C/svg%3E"/>
<style>
:root{--bg:#080b14;--card:#101728;--card-2:#0b1120;--line:rgba(148,163,184,.16);--text:#e9eefb;--muted:#93a4c3;--faint:#64748b;--accent:#a78bfa;--accent-2:#22d3ee;--good:#34d399;--warn:#fbbf24;--bad:#f87171;--shadow:0 20px 60px rgba(0,0,0,.45)}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(60% 50% at 15% 0%,rgba(167,139,250,.14),transparent 65%),radial-gradient(50% 45% at 90% 0%,rgba(34,211,238,.12),transparent 60%),var(--bg);color:var(--text);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh}
a{color:var(--accent-2);text-decoration:none}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 28px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(8,11,20,.82);backdrop-filter:blur(12px);z-index:10}
.brand{display:flex;align-items:center;gap:11px;font-weight:700;letter-spacing:.01em}
.mark{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:grid;place-items:center;color:#0a0f1c;font-weight:900;font-size:15px}
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
  <div class="brand"><span class="mark">S</span><div>SpecForge <small>by NoxaPlus</small></div></div>
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
