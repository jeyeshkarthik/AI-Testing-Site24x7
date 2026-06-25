const fs = require('fs');

const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const dataJson = JSON.stringify(data);

// Write HTML file using a different approach - write data as separate JS and reference it
const clientJs = `
(function() {
  const DB = ${dataJson};

  const sheets = DB.sheets;
  const sheetDesc = DB.sheetDescriptions;
  const apis = DB.apis;

  const sheetCounts = {};
  apis.forEach(function(a) { sheetCounts[a.sheet] = (sheetCounts[a.sheet] || 0) + 1; });

  let query = '';
  let activeSheet = 'ALL';
  let activeMethods = new Set(['GET','POST','PUT','DELETE','PATCH']);
  let currentPage = 1;
  const PAGE_SIZE = 25;
  let expandedCards = new Set();
  let lastResults = [];

  const STOPWORDS = new Set(['a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should','may','might',
    'shall','can','need','to','in','on','at','by','for','with','about','against',
    'between','into','through','during','before','after','above','below','from','up',
    'down','out','off','over','under','again','further','then','once','here','there',
    'when','where','why','how','all','both','each','few','more','most','other','some',
    'such','no','nor','not','only','own','same','so','than','too','very','just',
    'because','as','until','while','of','and','or','that','this','these','those',
    'it','its','what','which','who','whom','get','list','show','find','me','my',
    'i','give','tell','please','can','you']);

  function esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function tokenize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9_\\/\\-\\.]/g, ' ')
      .split(/\\s+/)
      .filter(function(t){ return t.length > 1 && !STOPWORDS.has(t); });
  }

  function scoreResult(api, tokens) {
    var score = 0;
    tokens.forEach(function(tok) {
      if (api.endpoint.toLowerCase().indexOf(tok) >= 0) score += 12;
      if (api.subFeature.toLowerCase().indexOf(tok) >= 0) score += 10;
      if (api.sheet.toLowerCase().indexOf(tok) >= 0) score += 8;
      if (api.description.toLowerCase().indexOf(tok) >= 0) score += 6;
      if (api.responseFields && api.responseFields.some(function(f){ return f.toLowerCase().indexOf(tok) >= 0; })) score += 7;
      if (api.requestFields && api.requestFields.some(function(f){ return f.toLowerCase().indexOf(tok) >= 0; })) score += 5;
      if (api.summaryText && api.summaryText.toLowerCase().indexOf(tok) >= 0) score += 4;
      if (api.searchText && api.searchText.indexOf(tok) >= 0) score += 1;
    });
    var qLower = tokens.join(' ');
    if (api.subFeature.toLowerCase().indexOf(qLower) >= 0) score += 20;
    if (api.description.toLowerCase().indexOf(qLower) >= 0) score += 15;
    if (api.endpoint.toLowerCase().indexOf(qLower) >= 0) score += 18;
    return score;
  }

  function highlight(text, tokens) {
    if (!tokens.length || !text) return esc(text);
    var result = esc(text);
    tokens.forEach(function(tok) {
      var safe = tok.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
      var re = new RegExp('(' + safe + ')', 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    });
    return result;
  }

  function statusClass(code) {
    if (!code) return '';
    if (code.indexOf('200') >= 0 || code.indexOf('201') >= 0) return 'ok';
    if (code.indexOf('400') >= 0 || code.indexOf('401') >= 0 || code.indexOf('403') >= 0 || code.indexOf('404') >= 0) return 'err';
    return 'warn';
  }

  // Sidebar
  function buildSidebar() {
    var el = document.getElementById('sidebarSheets');
    el.innerHTML = '';

    var allDiv = document.createElement('div');
    allDiv.className = 'sheet-item' + (activeSheet === 'ALL' ? ' active' : '');
    allDiv.innerHTML = '<span class="sheet-name">All Modules</span><span class="sheet-count">' + apis.length + '</span>';
    allDiv.addEventListener('click', function() { setSheet('ALL'); });
    el.appendChild(allDiv);

    sheets.forEach(function(sheet) {
      var div = document.createElement('div');
      div.className = 'sheet-item' + (activeSheet === sheet ? ' active' : '');
      div.innerHTML = '<span class="sheet-name">' + esc(sheet) + '</span><span class="sheet-count">' + (sheetCounts[sheet]||0) + '</span>';
      div.addEventListener('click', function() { setSheet(sheet); });
      el.appendChild(div);
    });
  }

  function setSheet(sheet) {
    activeSheet = sheet;
    currentPage = 1;
    buildSidebar();
    // update top chips
    document.querySelectorAll('#sheetFilters .chip').forEach(function(c) {
      c.classList.toggle('active', c.dataset.sheet === sheet);
    });
    renderResults();
  }
  window.setSheet = setSheet;

  // Build top filter chips
  function buildSheetChips() {
    var el = document.getElementById('sheetFilters');
    var allChip = document.createElement('div');
    allChip.className = 'chip active';
    allChip.dataset.sheet = 'ALL';
    allChip.textContent = 'All';
    el.appendChild(allChip);

    sheets.forEach(function(sheet) {
      var c = document.createElement('div');
      c.className = 'chip';
      c.dataset.sheet = sheet;
      c.textContent = sheet;
      el.appendChild(c);
    });

    el.addEventListener('click', function(e) {
      var chip = e.target.closest('.chip');
      if (!chip || !chip.dataset.sheet) return;
      setSheet(chip.dataset.sheet);
    });
  }

  // Method filters
  document.getElementById('methodFilters').addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip || !chip.dataset.method) return;
    var m = chip.dataset.method;
    if (activeMethods.has(m)) { activeMethods.delete(m); chip.classList.remove('active'); }
    else { activeMethods.add(m); chip.classList.add('active'); }
    currentPage = 1;
    renderResults();
  });

  function getResults() {
    var filtered = apis.filter(function(api) {
      if (!activeMethods.has(api.method)) return false;
      if (activeSheet !== 'ALL' && api.sheet !== activeSheet) return false;
      return true;
    });

    if (!query) return filtered.map(function(api){ return {api:api, score:0}; });

    var tokens = tokenize(query);
    if (!tokens.length) return filtered.map(function(api){ return {api:api, score:0}; });

    var scored = filtered.map(function(api){ return {api:api, score:scoreResult(api,tokens)}; })
      .filter(function(r){ return r.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });

    return scored;
  }

  function renderPagination(total) {
    var totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return '';
    var btns = '<button class="page-btn" ' + (currentPage===1?'disabled':'') + ' onclick="goPage(' + (currentPage-1) + ')">← Prev</button>';
    var range = [];
    for (var i=1; i<=totalPages; i++) {
      if (i===1 || i===totalPages || (i>=currentPage-2 && i<=currentPage+2)) range.push(i);
    }
    var prev = 0;
    range.forEach(function(p) {
      if (prev && p-prev>1) btns += '<span class="page-btn" style="pointer-events:none">…</span>';
      btns += '<button class="page-btn ' + (p===currentPage?'active':'') + '" onclick="goPage(' + p + ')">' + p + '</button>';
      prev = p;
    });
    btns += '<button class="page-btn" ' + (currentPage===Math.ceil(total/PAGE_SIZE)?'disabled':'') + ' onclick="goPage(' + (currentPage+1) + ')">Next →</button>';
    return '<div class="pagination">' + btns + '</div>';
  }

  function renderCardsHtml(pageResults, tokens, maxScore) {
    return pageResults.map(function(r) {
      var api = r.api; var score = r.score;
      var sc = statusClass(api.statusCode);
      var pct = maxScore ? Math.round((score/maxScore)*100) : 0;
      var isExp = expandedCards.has(api.id);
      var reqF = (api.requestFields||[]).slice(0,8);
      var resF = (api.responseFields||[]).slice(0,8);
      return '<div class="api-card' + (isExp?' expanded':'') + '" data-id="' + api.id + '">' +
        '<div class="card-header">' +
          '<span class="method-badge ' + api.method + '">' + api.method + '</span>' +
          '<div class="card-main">' +
            '<div class="endpoint-row">' +
              '<span class="endpoint-path">' + highlight(api.endpoint, tokens) + '</span>' +
              '<span class="status-badge ' + sc + '">' + esc(api.statusCode) + '</span>' +
            '</div>' +
            '<div class="card-description">' + highlight(api.description, tokens) + '</div>' +
            '<div class="card-meta">' +
              '<span class="meta-tag sheet-tag">' + esc(api.sheet) + '</span>' +
              '<span class="meta-tag">' + esc(api.subFeature) + '</span>' +
              resF.map(function(f){ return '<span class="meta-tag field-tag">' + esc(f) + '</span>'; }).join('') +
            '</div>' +
          '</div>' +
          (score > 0 ? '<div class="score-bar-wrap"><span class="score-label">' + pct + '%</span><div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div></div>' : '') +
          '<span class="expand-toggle">▾</span>' +
        '</div>' +
        '<div class="card-detail" style="display:' + (isExp?'block':'none') + '">' +
          '<div class="detail-grid">' +
            (reqF.length ? '<div class="detail-section"><div class="detail-label">📤 Request Fields</div><div class="field-list">' + reqF.map(function(f){ return '<span class="field-pill">' + esc(f) + '</span>'; }).join('') + '</div></div>' : '') +
            (resF.length ? '<div class="detail-section"><div class="detail-label">📥 Response Fields</div><div class="field-list">' + resF.map(function(f){ return '<span class="field-pill">' + esc(f) + '</span>'; }).join('') + '</div></div>' : '') +
          '</div>' +
          (api.summaryText ? '<div style="margin-top:14px"><div class="detail-label">📋 Response Summary</div><div class="code-block">' + esc(api.summaryText) + '</div></div>' : '') +
          (api.requestPayload ? '<div style="margin-top:14px"><div class="detail-label">📦 Example Request</div><div class="code-block">' + esc(api.requestPayload) + '</div></div>' : '') +
          '<a class="try-btn" href="https://www.site24x7.com' + esc(api.endpoint) + '" target="_blank" rel="noopener">↗ Open in Site24x7 Demo</a>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderResults() {
    var results = getResults();
    lastResults = results;
    var total = results.length;
    var maxScore = results.length ? results[0].score : 1;
    var pageResults = results.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
    var tokens = query ? tokenize(query) : [];
    var html = '';

    if (!query && activeSheet === 'ALL') {
      html = '<div class="results-header"><span class="results-count">Showing all <strong>' + total + '</strong> endpoints · Click a module to filter, or type a query above</span></div>';
      html += '<div class="landing-grid">';
      sheets.forEach(function(sheet) {
        var desc = (sheetDesc[sheet]||'').substring(0, 180);
        html += '<div class="sheet-overview-card" onclick="setSheet(\\'' + sheet.replace(/'/g,"\\\\'") + '\\')">' +
          '<div class="soc-header"><span class="soc-name">' + esc(sheet) + '</span><span class="soc-count">' + (sheetCounts[sheet]||0) + '</span></div>' +
          '<p class="soc-desc">' + esc(desc) + '</p>' +
          '</div>';
      });
      html += '</div>';
      html += '<div style="margin-top:24px"><div class="results-header"><span class="results-count">All Endpoints</span></div>';
      html += renderCardsHtml(pageResults, tokens, maxScore);
      html += renderPagination(total);
      html += '</div>';
    } else if (total === 0) {
      html = '<div class="results-header"><span class="results-count">No results for "<strong>' + esc(query) + '</strong>" in ' + (activeSheet==='ALL'?'all modules':esc(activeSheet)) + '</span></div>';
      html += '<div class="empty-state"><div class="empty-icon">🔎</div><h3>No results found</h3><p>Try different keywords, or browse by module using the sidebar.</p></div>';
    } else {
      if (query) {
        html = '<div class="results-header"><span class="results-count"><strong>' + total + '</strong> result' + (total!==1?'s':'') + ' for "<em>' + esc(query) + '</em>"</span></div>';
      } else {
        html = '<div class="results-header"><span class="results-count"><strong>' + total + '</strong> endpoints in <em>' + esc(activeSheet) + '</em></span></div>';
      }
      html += renderCardsHtml(pageResults, tokens, maxScore);
      html += renderPagination(total);
    }

    document.getElementById('resultsArea').innerHTML = html;

    // Attach card click handlers
    document.querySelectorAll('.api-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.try-btn')) return;
        var id = parseInt(card.dataset.id);
        if (expandedCards.has(id)) { expandedCards.delete(id); card.classList.remove('expanded'); }
        else { expandedCards.add(id); card.classList.add('expanded'); }
        var detail = card.querySelector('.card-detail');
        if (detail) detail.style.display = expandedCards.has(id) ? 'block' : 'none';
      });
      var id = parseInt(card.dataset.id);
      if (expandedCards.has(id)) {
        card.classList.add('expanded');
        var d = card.querySelector('.card-detail');
        if (d) d.style.display = 'block';
      }
    });
  }

  window.goPage = function(p) {
    var totalPages = Math.ceil(lastResults.length / PAGE_SIZE);
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderResults();
    window.scrollTo({top:0,behavior:'smooth'});
  };

  // Search
  var searchInput = document.getElementById('searchInput');
  var clearBtn = document.getElementById('clearBtn');
  var searchBtn = document.getElementById('searchBtn');

  function doSearch() {
    query = searchInput.value.trim();
    currentPage = 1;
    clearBtn.style.display = query ? 'block' : 'none';
    renderResults();
  }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
  searchInput.addEventListener('input', function() {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    if (!searchInput.value.trim()) { query=''; renderResults(); }
  });
  clearBtn.addEventListener('click', function() {
    searchInput.value=''; query=''; clearBtn.style.display='none'; renderResults();
  });

  // Init
  buildSheetChips();
  buildSidebar();
  renderResults();
  document.getElementById('hTotalAPIs').textContent = apis.length;
})();
`;

const css = `
    :root {
      --bg: #0b0d14;
      --bg2: #111420;
      --bg3: #161926;
      --card: #1a1e2e;
      --card-hover: #1f2438;
      --border: #252a3d;
      --border-glow: #3d4a6e;
      --text: #e4e8f5;
      --text-dim: #8b93b8;
      --text-muted: #535b7a;
      --accent: #5b8af5;
      --accent2: #7c6df5;
      --accent-glow: rgba(91,138,245,0.15);
      --green: #34d399;
      --green-bg: rgba(52,211,153,0.1);
      --red: #f87171;
      --red-bg: rgba(248,113,113,0.1);
      --amber: #fbbf24;
      --amber-bg: rgba(251,191,36,0.1);
      --purple: #c084fc;
      --purple-bg: rgba(192,132,252,0.1);
      --blue: #60a5fa;
      --blue-bg: rgba(96,165,250,0.1);
      --tag-bg: #1e2540;
      --radius: 12px;
      --radius-sm: 8px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--border-glow); }

    header { position: sticky; top: 0; z-index: 100; background: rgba(11,13,20,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 0 24px; }
    .header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 16px; height: 64px; }
    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon { width: 34px; height: 34px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; box-shadow: 0 0 16px rgba(91,138,245,0.4); }
    .logo-text { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }
    .logo-text span { color: var(--accent); }
    .header-stats { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .stat-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-dim); background: var(--bg3); border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; text-decoration: none; transition: border-color 0.2s; }
    .stat-chip:hover { border-color: var(--accent); }
    .stat-chip strong { color: var(--accent); font-weight: 600; }

    .hero { padding: 48px 24px 32px; max-width: 1400px; margin: 0 auto; }
    .hero-title { font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin-bottom: 8px; background: linear-gradient(135deg, #fff 0%, var(--accent) 60%, var(--accent2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-subtitle { font-size: 15px; color: var(--text-dim); margin-bottom: 28px; }

    .search-wrapper { position: relative; max-width: 860px; }
    .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; font-size: 18px; }
    #searchInput { width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: var(--radius); color: var(--text); font-family: 'Inter', sans-serif; font-size: 16px; padding: 16px 180px 16px 50px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
    #searchInput:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow), 0 0 24px rgba(91,138,245,0.1); }
    #searchInput::placeholder { color: var(--text-muted); }
    .search-actions { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 8px; }
    .clear-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; font-size: 14px; display: none; transition: color 0.2s; }
    .clear-btn:hover { color: var(--text); }
    .search-btn { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: var(--radius-sm); color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; padding: 9px 20px; cursor: pointer; transition: opacity 0.2s, transform 0.1s; letter-spacing: 0.2px; }
    .search-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .search-btn:active { transform: translateY(0); }

    .filter-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .filter-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { background: var(--bg3); border: 1px solid var(--border); border-radius: 20px; color: var(--text-dim); font-size: 12px; font-weight: 500; padding: 4px 12px; cursor: pointer; transition: all 0.15s; user-select: none; }
    .chip:hover { border-color: var(--accent); color: var(--accent); }
    .chip.active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }
    .method-chip { font-family: 'JetBrains Mono', monospace; }
    .chip[data-method="GET"].active { background: var(--green-bg); border-color: var(--green); color: var(--green); }
    .chip[data-method="POST"].active { background: var(--blue-bg); border-color: var(--blue); color: var(--blue); }
    .chip[data-method="PUT"].active { background: var(--amber-bg); border-color: var(--amber); color: var(--amber); }
    .chip[data-method="DELETE"].active { background: var(--red-bg); border-color: var(--red); color: var(--red); }
    .chip[data-method="PATCH"].active { background: var(--purple-bg); border-color: var(--purple); color: var(--purple); }
    .divider { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }

    .main { max-width: 1400px; margin: 0 auto; padding: 0 24px 60px; display: grid; grid-template-columns: 260px 1fr; gap: 24px; }

    .sidebar { position: sticky; top: 80px; height: calc(100vh - 100px); overflow-y: auto; padding-right: 4px; }
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-title { font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; padding-left: 4px; }
    .sheet-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s; border: 1px solid transparent; margin-bottom: 2px; }
    .sheet-item:hover { background: var(--bg3); border-color: var(--border); }
    .sheet-item.active { background: var(--accent-glow); border-color: var(--accent); }
    .sheet-name { font-size: 13px; color: var(--text-dim); font-weight: 500; }
    .sheet-item.active .sheet-name { color: var(--accent); }
    .sheet-item:hover .sheet-name { color: var(--text); }
    .sheet-count { font-size: 11px; background: var(--tag-bg); color: var(--text-muted); padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .sheet-item.active .sheet-count { background: rgba(91,138,245,0.2); color: var(--accent); }

    .results-area { min-width: 0; }
    .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .results-count { font-size: 13px; color: var(--text-dim); }
    .results-count strong { color: var(--text); font-weight: 600; }

    .api-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 12px; transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s; cursor: pointer; overflow: hidden; }
    .api-card:hover { border-color: var(--border-glow); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .api-card.expanded { border-color: var(--accent); }
    .card-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px; }
    .method-badge { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; letter-spacing: 0.5px; }
    .method-badge.GET { background: var(--green-bg); color: var(--green); }
    .method-badge.POST { background: var(--blue-bg); color: var(--blue); }
    .method-badge.PUT { background: var(--amber-bg); color: var(--amber); }
    .method-badge.DELETE { background: var(--red-bg); color: var(--red); }
    .method-badge.PATCH { background: var(--purple-bg); color: var(--purple); }
    .card-main { flex: 1; min-width: 0; }
    .endpoint-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .endpoint-path { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 600px; }
    .status-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; font-weight: 600; }
    .status-badge.ok { background: var(--green-bg); color: var(--green); }
    .status-badge.err { background: var(--red-bg); color: var(--red); }
    .status-badge.warn { background: var(--amber-bg); color: var(--amber); }
    .card-description { font-size: 13px; color: var(--text-dim); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-meta { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
    .meta-tag { font-size: 11px; padding: 2px 8px; border-radius: 6px; background: var(--tag-bg); color: var(--text-muted); font-weight: 500; }
    .sheet-tag { background: rgba(91,138,245,0.08); color: var(--accent); border: 1px solid rgba(91,138,245,0.2); }
    .field-tag { background: var(--purple-bg); color: var(--purple); }
    .expand-toggle { color: var(--text-muted); font-size: 14px; margin-left: auto; flex-shrink: 0; transition: transform 0.2s; }
    .api-card.expanded .expand-toggle { transform: rotate(180deg); }
    .score-bar-wrap { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .score-label { font-size: 11px; color: var(--text-muted); }
    .score-bar { width: 60px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .score-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 2px; }

    .card-detail { padding: 0 18px 18px; border-top: 1px solid var(--border); animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .detail-label { font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .field-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .field-pill { font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 3px 9px; border-radius: 6px; background: var(--tag-bg); color: var(--text-dim); border: 1px solid var(--border); }
    .code-block { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 180px; overflow-y: auto; }
    .try-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; border-radius: var(--radius-sm); color: #fff; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; padding: 7px 16px; cursor: pointer; text-decoration: none; transition: opacity 0.2s; }
    .try-btn:hover { opacity: 0.85; }

    .empty-state { text-align: center; padding: 80px 40px; color: var(--text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { font-size: 18px; color: var(--text-dim); margin-bottom: 8px; }
    .empty-state p { font-size: 14px; line-height: 1.6; }

    mark { background: rgba(91,138,245,0.3); color: var(--accent); border-radius: 2px; padding: 0 1px; }

    .landing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .sheet-overview-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
    .sheet-overview-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); opacity: 0; transition: opacity 0.2s; }
    .sheet-overview-card:hover::before { opacity: 1; }
    .sheet-overview-card:hover { border-color: var(--border-glow); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .soc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .soc-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .soc-count { font-size: 20px; font-weight: 700; color: var(--accent); }
    .soc-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 28px; flex-wrap: wrap; }
    .page-btn { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-dim); font-family: 'Inter', sans-serif; font-size: 13px; padding: 8px 14px; cursor: pointer; transition: all 0.15s; }
    .page-btn:hover { border-color: var(--accent); color: var(--accent); }
    .page-btn.active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); font-weight: 600; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    @media (max-width: 900px) {
      .main { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .hero-title { font-size: 26px; }
      .detail-grid { grid-template-columns: 1fr; }
      .endpoint-path { max-width: 280px; }
    }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site24x7 API Search — Explore 720 Endpoints Across 15 Modules</title>
  <meta name="description" content="Search and explore all Site24x7 Admin APIs across 15 feature sheets — find endpoints, data fields, and descriptions instantly." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="#">
      <div class="logo-icon">🔍</div>
      <span class="logo-text">Site24x7 <span>API</span> Search</span>
    </a>
    <div class="header-stats">
      <div class="stat-chip">🗂️ <strong id="hTotalAPIs">720</strong> endpoints</div>
      <div class="stat-chip">📋 <strong>15</strong> modules</div>
      <a class="stat-chip" href="https://www.site24x7.com/app/demo" target="_blank" rel="noopener">🌐 Site24x7 Demo</a>
    </div>
  </div>
</header>

<section class="hero">
  <h1 class="hero-title">Site24x7 API Explorer</h1>
  <p class="hero-subtitle">Search across 720 endpoints from 15 feature modules. Find APIs, response fields, and payloads instantly.</p>
  <div class="search-wrapper">
    <span class="search-icon">⌕</span>
    <input type="text" id="searchInput" placeholder='Try "monitor groups", "webhook", "server template", "tag listing", "download java"…' autocomplete="off" spellcheck="false" />
    <div class="search-actions">
      <button class="clear-btn" id="clearBtn" title="Clear search">✕</button>
      <button class="search-btn" id="searchBtn">Search</button>
    </div>
  </div>
  <div class="filter-row">
    <span class="filter-label">METHOD:</span>
    <div class="filter-chips" id="methodFilters">
      <div class="chip method-chip active" data-method="GET">GET</div>
      <div class="chip method-chip active" data-method="POST">POST</div>
      <div class="chip method-chip active" data-method="PUT">PUT</div>
      <div class="chip method-chip active" data-method="DELETE">DELETE</div>
      <div class="chip method-chip active" data-method="PATCH">PATCH</div>
    </div>
    <div class="divider"></div>
    <span class="filter-label">MODULE:</span>
    <div class="filter-chips" id="sheetFilters"></div>
  </div>
</section>

<div class="main">
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-title">Feature Modules</div>
      <div id="sidebarSheets"></div>
    </div>
  </aside>
  <main class="results-area" id="resultsArea">
    <div class="empty-state"><div class="empty-icon">⚡</div><h3>Loading…</h3></div>
  </main>
</div>

<script>
${clientJs}
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html generated. Size:', Math.round(fs.statSync('index.html').size / 1024), 'KB');
