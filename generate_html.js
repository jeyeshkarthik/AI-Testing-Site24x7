const fs = require('fs');

const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const dataJson = JSON.stringify(data);

let tfidfJson = "null";
try { tfidfJson = fs.readFileSync('tfidf_index.json', 'utf8'); } catch(e){}

const clientJs = `
(function() {
  var DB = ${dataJson};
  var TFIDF_DB = ${tfidfJson};
  var sheets = DB.sheets;
  var sheetDesc = DB.sheetDescriptions;
  var apis = DB.apis;

  var sheetCounts = {};
  apis.forEach(function(a) { sheetCounts[a.sheet] = (sheetCounts[a.sheet] || 0) + 1; });

  var query = '';
  var activeSheet = 'ALL';
  var activeMethods = new Set(['GET','POST','PUT','DELETE','PATCH']);
  var currentPage = 1;
  var PAGE_SIZE = 20;
  var expandedCards = new Set();
  var lastResults = [];
  var activeTab = 'results'; // 'results' | 'history' | 'dataset'

  // ── PERSISTENT STORE ──
  var STORAGE_KEY_DS = 's247_dataset';
  var STORAGE_KEY_HX = 's247_history';

  function loadStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; }
  }
  function saveStore(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e){}
  }

  var dataset = loadStore(STORAGE_KEY_DS);   // [{id, query, api, markedCorrect, addedAt}]
  var searchHistory = loadStore(STORAGE_KEY_HX);  // [{query, topResult, resultCount, searchedAt}]

  function updateBadges() {
    var dsBadge = document.getElementById('datasetBadge');
    var hxBadge = document.getElementById('historyBadge');
    if (dsBadge) dsBadge.textContent = dataset.length;
    if (hxBadge) hxBadge.textContent = searchHistory.length;
  }

  function recordHistory(q, results) {
    if (!q) return;
    var top = results.length ? results[0].api : null;
    searchHistory.unshift({ query: q, topResult: top ? top.endpoint : '', resultCount: results.length, searchedAt: new Date().toISOString() });
    if (searchHistory.length > 100) searchHistory = searchHistory.slice(0, 100);
    saveStore(STORAGE_KEY_HX, searchHistory);
    updateBadges();
  }

  function addToDataset(apiId, markedCorrect) {
    var api = apis.find(function(a){ return a.id === apiId; });
    if (!api) return;
    var existing = dataset.findIndex(function(d){ return d.apiId === apiId && d.query === query; });
    if (existing >= 0) {
      if (markedCorrect) dataset[existing].markedCorrect = true;
      showToast(markedCorrect ? 'Marked as correct!' : 'Already in dataset');
    } else {
      dataset.unshift({
        id: Date.now(),
        query: query,
        apiId: apiId,
        endpoint: api.endpoint,
        method: api.method,
        sheet: api.sheet,
        subFeature: api.subFeature,
        description: api.description,
        markedCorrect: !!markedCorrect,
        addedAt: new Date().toISOString()
      });
      showToast(markedCorrect ? '&#10003; Marked correct \u2014 saved to dataset' : '&#43; Added to dataset');
    }
    saveStore(STORAGE_KEY_DS, dataset);
    updateBadges();
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
  }

  var STOPWORDS = new Set(['a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should','may','might',
    'shall','can','need','to','in','on','at','by','for','with','about','against',
    'between','into','through','during','before','after','above','below','from','up',
    'down','out','off','over','under','again','further','then','once','here','there',
    'when','where','why','how','all','both','each','few','more','most','other','some',
    'such','no','nor','not','only','own','same','so','than','too','very','just',
    'because','as','until','while','of','and','or','that','this','these','those',
    'it','its','what','which','who','whom','me','my','i','give','tell','please','you']);

  function esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function tokenize(text) {
    if (!text) return [];
    return String(text).toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\\s+/)
      .filter(function(t){ return t.length > 1 && !STOPWORDS.has(t); });
  }

  if (TFIDF_DB) {
    apis.forEach(function(api) {
      var allText = [
        api.endpoint, api.subFeature, api.sheet, api.description, api.summaryText, api.searchText,
        (api.responseFields||[]).join(' '), (api.requestFields||[]).join(' ')
      ].join(' ');
      api._tokens = tokenize(allText);
    });
  }

  function scoreResult(api, tokens) {
    if (!tokens || !tokens.length) return 0;
    var searchType = document.getElementById('searchType');
    var isSemantic = searchType && searchType.value === 'semantic';

    var s = 0;
    var q = tokens.join(' ');

    if (TFIDF_DB && isSemantic && api._tokens) {
      var k1 = 1.5;
      var b = 0.75;
      var dl = api._tokens.length;
      var avgdl = TFIDF_DB.avgdl || 74;

      tokens.forEach(function(tok) {
        var tf = 0;
        for (var i=0; i<api._tokens.length; i++) {
          if (api._tokens[i] === tok || api._tokens[i].indexOf(tok) === 0) tf++; 
        }
        if (tf > 0) {
          var idf = TFIDF_DB.idf[tok] || Math.log(TFIDF_DB.N);
          var bm25 = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl))));
          s += (bm25 * 5); // Scale up BM25 score
        }
      });
      if (api.endpoint.toLowerCase().indexOf(q) >= 0) s += 40;
    }

    tokens.forEach(function(tok) {
      if (api.endpoint.toLowerCase().indexOf(tok) >= 0) s += 12;
      if (api.subFeature.toLowerCase().indexOf(tok) >= 0) s += 10;
      if (api.sheet.toLowerCase().indexOf(tok) >= 0) s += 8;
      if (api.description.toLowerCase().indexOf(tok) >= 0) s += 6;
      if (api.responseFields && api.responseFields.some(function(f){ return f.toLowerCase().indexOf(tok)>=0; })) s += 7;
      if (api.requestFields && api.requestFields.some(function(f){ return f.toLowerCase().indexOf(tok)>=0; })) s += 5;
      if (api.summaryText && api.summaryText.toLowerCase().indexOf(tok)>=0) s += 4;
      if (api.searchText && api.searchText.indexOf(tok)>=0) s += 1;
    });
    if (api.subFeature.toLowerCase().indexOf(q)>=0) s += 20;
    if (api.description.toLowerCase().indexOf(q)>=0) s += 15;
    if (api.endpoint.toLowerCase().indexOf(q)>=0) s += 18;
    return s;
  }

  function highlight(text, tokens) {
    if (!tokens.length || !text) return esc(text);
    var r = esc(text);
    tokens.forEach(function(tok) {
      var safe = tok.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g,'\\\\$&');
      r = r.replace(new RegExp('('+safe+')', 'gi'), '<mark>$1</mark>');
    });
    return r;
  }

  function getStatusClass(code) {
    if (!code) return 'status-other';
    if (code.indexOf('200')>=0||code.indexOf('201')>=0) return 'status-ok';
    if (code.indexOf('400')>=0||code.indexOf('401')>=0||code.indexOf('403')>=0||code.indexOf('404')>=0) return 'status-err';
    return 'status-warn';
  }

  // Sidebar
  function buildSidebar() {
    var el = document.getElementById('sidebarSheets');
    el.innerHTML = '';
    var allDiv = document.createElement('div');
    allDiv.className = 'sidebar-item' + (activeSheet==='ALL'?' active':'');
    allDiv.innerHTML = '<span class="si-name">All Modules</span><span class="si-count">'+apis.length+'</span>';
    allDiv.addEventListener('click', function(){ setSheet('ALL'); });
    el.appendChild(allDiv);
    sheets.forEach(function(sheet) {
      var d = document.createElement('div');
      d.className = 'sidebar-item' + (activeSheet===sheet?' active':'');
      d.innerHTML = '<span class="si-name">'+esc(sheet)+'</span><span class="si-count">'+(sheetCounts[sheet]||0)+'</span>';
      d.addEventListener('click', function(){ setSheet(sheet); });
      el.appendChild(d);
    });
  }

  function setSheet(sheet) {
    activeSheet = sheet;
    currentPage = 1;
    buildSidebar();
    document.querySelectorAll('#moduleChips .mchip').forEach(function(c){
      c.classList.toggle('active', c.dataset.sheet === sheet);
    });
    renderResults();
  }
  window.setSheet = setSheet;

  function buildModuleChips() {
    var el = document.getElementById('moduleChips');
    var all = document.createElement('span');
    all.className = 'mchip active';
    all.dataset.sheet = 'ALL';
    all.textContent = 'All';
    el.appendChild(all);
    sheets.forEach(function(s) {
      var c = document.createElement('span');
      c.className = 'mchip';
      c.dataset.sheet = s;
      c.textContent = s;
      el.appendChild(c);
    });
    el.addEventListener('click', function(e){
      var c = e.target.closest('.mchip');
      if (!c) return;
      setSheet(c.dataset.sheet);
    });
  }

  // Method filter
  document.getElementById('methodFilters').addEventListener('click', function(e) {
    var btn = e.target.closest('.method-filter-btn');
    if (!btn) return;
    var m = btn.dataset.method;
    if (activeMethods.has(m)) { activeMethods.delete(m); btn.classList.remove('active'); }
    else { activeMethods.add(m); btn.classList.add('active'); }
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
    return filtered.map(function(api){ return {api:api, score:scoreResult(api,tokens)}; })
      .filter(function(r){ return r.score > 0; })
      .sort(function(a,b){ return b.score - a.score; });
  }

  function renderPagination(total) {
    var totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return '';
    var btns = '<button class="pg-btn" '+(currentPage===1?'disabled':'')+' onclick="goPage('+(currentPage-1)+')">&#8592; Prev</button>';
    var range = [];
    for (var i=1;i<=totalPages;i++) {
      if (i===1||i===totalPages||(i>=currentPage-2&&i<=currentPage+2)) range.push(i);
    }
    var prev=0;
    range.forEach(function(p) {
      if (prev && p-prev>1) btns += '<span class="pg-dots">…</span>';
      btns += '<button class="pg-btn'+(p===currentPage?' active':'')+'" onclick="goPage('+p+')">'+p+'</button>';
      prev=p;
    });
    btns += '<button class="pg-btn" '+(currentPage===totalPages?'disabled':'')+' onclick="goPage('+(currentPage+1)+')">Next &#8594;</button>';
    return '<div class="pagination">'+btns+'</div>';
  }

  function methodColor(m) {
    var map = {GET:'method-get',POST:'method-post',PUT:'method-put',DELETE:'method-delete',PATCH:'method-patch'};
    return map[m] || 'method-other';
  }

  function renderCardsHtml(pageResults, tokens, maxScore) {
    if (!pageResults.length) return '';
    return pageResults.map(function(r) {
      var api = r.api; var score = r.score;
      var pct = maxScore && score ? Math.round((score/maxScore)*100) : 0;
      var isExp = expandedCards.has(api.id);
      var resF = (api.responseFields||[]).slice(0,12);
      var reqF = (api.requestFields||[]).slice(0,8);
      var sc = getStatusClass(api.statusCode);

      // Response fields table rows
      var fieldRows = resF.map(function(f) {
        return '<tr class="field-row">' +
          '<td class="field-name">'+esc(f)+'</td>' +
          '<td><span class="type-badge">string</span></td>' +
          '<td class="field-desc">The <strong>'+esc(f)+'</strong> property from the API response.</td>' +
        '</tr>';
      }).join('');

      return '<div class="result-card'+(isExp?' expanded':'')+'" data-id="'+api.id+'">' +
        '<div class="rc-header">' +
          '<div class="rc-top">' +
            '<span class="method-badge '+methodColor(api.method)+'">'+api.method+'</span>' +
            '<span class="rc-endpoint">'+highlight(api.endpoint, tokens)+'</span>' +
            '<span class="rc-client-tag">Client</span>' +
            '<span class="rc-module-tag">'+esc(api.sheet.toUpperCase().replace(/ /g,'_'))+'</span>' +
            (score > 0 ? '<span style="margin-left:auto; font-size:11px; color:#9ca3af; font-family:monospace;">Score: '+Math.round(score)+'</span>' : '') +
          '</div>' +
          '<div class="rc-desc">'+highlight(api.description, tokens)+'</div>' +
          '<div class="rc-meta">'+esc(api.subFeature)+'</div>' +
          '<div class="rc-actions">' +
            '<button class="action-btn btn-correct" data-apiid="'+api.id+'" onclick="event.stopPropagation();markCorrect('+api.id+')">&#10003; Mark Correct</button>' +
            '<button class="action-btn btn-dataset" data-apiid="'+api.id+'" onclick="event.stopPropagation();addDataset('+api.id+')">&#43; Add to Dataset</button>' +
            '<button class="action-btn btn-try" data-apiid="'+api.id+'" onclick="event.stopPropagation();tryApi('+api.id+')">&#9654; Try API</button>' +
          '</div>' +
        '</div>' +
        '<div class="rc-try-panel" id="try-panel-'+api.id+'" style="display:none"></div>' +
        (resF.length || reqF.length || api.summaryText ? 
        '<div class="rc-detail" style="display:'+(isExp?'block':'none')+'">' +
          (resF.length ? '<div class="detail-section-label">RESPONSE FIELDS</div>' +
          '<table class="fields-table">' +
          '<colgroup><col style="width:180px"><col style="width:90px"><col></colgroup>' +
          fieldRows +
          '</table>' : '') +
          (reqF.length ? '<div class="detail-section-label" style="margin-top:12px">REQUEST FIELDS</div>' +
          '<div class="req-fields">'+reqF.map(function(f){ return '<span class="req-pill">'+esc(f)+'</span>'; }).join('')+'</div>' : '') +
          (api.summaryText ? '<div class="summary-box">'+esc(api.summaryText)+'</div>' : '') +
        '</div>' : '') +
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

    // Update result count line
    var countEl = document.getElementById('resultCount');
    if (!query && activeSheet === 'ALL') {
      countEl.textContent = total + ' endpoint(s) — browse all modules';
    } else if (query) {
      countEl.textContent = total + ' result(s) — keyword search';
    } else {
      countEl.textContent = total + ' endpoint(s) in ' + activeSheet;
    }

    if (!query && activeSheet === 'ALL') {
      // Module overview cards
      html = '<div class="module-grid">';
      sheets.forEach(function(sheet) {
        html += '<div class="module-card" onclick="setSheet(this.dataset.s)" data-s="'+esc(sheet)+'">' +
          '<div class="mc-top"><span class="mc-name">'+esc(sheet)+'</span><span class="mc-count">'+(sheetCounts[sheet]||0)+'</span></div>' +
          '<p class="mc-desc">'+esc((sheetDesc[sheet]||'').substring(0,140))+'</p>' +
        '</div>';
      });
      html += '</div>';
      html += '<div class="section-divider">All Endpoints</div>';
      html += renderCardsHtml(pageResults, tokens, maxScore);
      html += renderPagination(total);
    } else if (total === 0) {
      html = '<div class="no-results">' +
        '<div class="nr-icon">&#128269;</div>' +
        '<h3>No results found</h3>' +
        '<p>Try different keywords, or browse a module from the sidebar.</p>' +
        '<p style="margin-top:6px;font-size:12px;color:#aaa">Examples: "monitor groups", "webhook", "server template", "tag listing"</p>' +
      '</div>';
    } else {
      html = renderCardsHtml(pageResults, tokens, maxScore);
      html += renderPagination(total);
    }

    document.getElementById('resultsPane').innerHTML = html;

    // Card click = expand/collapse detail
    document.querySelectorAll('.result-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn')) return;
        var id = parseInt(card.dataset.id);
        var detail = card.querySelector('.rc-detail');
        if (!detail) return;
        if (expandedCards.has(id)) { expandedCards.delete(id); card.classList.remove('expanded'); detail.style.display='none'; }
        else { expandedCards.add(id); card.classList.add('expanded'); detail.style.display='block'; }
      });
      var id = parseInt(card.dataset.id);
      if (expandedCards.has(id)) {
        card.classList.add('expanded');
        var d = card.querySelector('.rc-detail');
        if (d) d.style.display='block';
      }
    });
  }

  window.goPage = function(p) {
    var tp = Math.ceil(lastResults.length/PAGE_SIZE);
    if (p<1||p>tp) return;
    currentPage = p;
    renderResults();
    window.scrollTo({top:0,behavior:'smooth'});
  };

  window.markCorrect = function(apiId) {
    if (!query) { showToast('Type a query first to mark a correct answer'); return; }
    addToDataset(apiId, true);
  };

  window.addDataset = function(apiId) {
    if (!query) { showToast('Type a query first before adding to dataset'); return; }
    addToDataset(apiId, false);
  };

  // ── PROXY / TRY API ──
  var PROXY_URL = 'http://localhost:3334';
  var proxyConnected = false;

  function checkProxyStatus() {
    fetch(PROXY_URL + '/status', { signal: AbortSignal.timeout(1500) })
      .then(function(r){ return r.json(); })
      .then(function(d){
        proxyConnected = d.ok;
        var dot = document.getElementById('proxyDot');
        var lbl = document.getElementById('proxyLabel');
        if (dot) dot.style.background = proxyConnected ? '#16a34a' : '#ef4444';
        if (lbl) lbl.textContent = proxyConnected ? (d.hasCookie ? 'Proxy: Ready' : 'Proxy: No Cookie') : 'Proxy: Off';
        if (proxyConnected && !d.hasCookie) { if (dot) dot.style.background = '#f59e0b'; }
      })
      .catch(function(){
        proxyConnected = false;
        var dot = document.getElementById('proxyDot');
        var lbl = document.getElementById('proxyLabel');
        if (dot) dot.style.background = '#ef4444';
        if (lbl) lbl.textContent = 'Proxy: Off';
      });
  }

  window.tryApi = function(apiId) {
    var api = apis.find(function(a){ return a.id === apiId; });
    if (!api) return;
    var panel = document.getElementById('try-panel-' + apiId);
    if (!panel) return;

    if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }

    if (!proxyConnected) {
      panel.style.display = 'block';
      panel.innerHTML = '<div class="try-error">&#9888; Proxy not running. Start it with <code>npm run proxy</code> then refresh.</div>';
      return;
    }

    var rawEp = api.endpoint;
    var method = api.method.toUpperCase();
    var hasBody = (method === 'POST' || method === 'PUT' || method === 'PATCH');
    var pathParams = [];
    var paramRegex = /\{([^}]+)\}/g;
    var match;
    while ((match = paramRegex.exec(rawEp)) !== null) {
      pathParams.push(match[1]);
    }

    panel.style.display = 'block';

    var html = '<div class="try-input-form">';
    html += '<div class="try-input-title">Configure Request</div>';
    
    pathParams.forEach(function(param) {
      html += '<div class="try-input-group">';
      html += '<label>URL Param: <code>' + esc(param) + '</code></label>';
      html += '<input type="text" id="param-' + apiId + '-' + param + '" placeholder="Enter value for ' + esc(param) + '" />';
      html += '</div>';
    });

    html += '<div class="try-input-group">';
    html += '<label>Query String (Optional)</label>';
    html += '<input type="text" id="query-' + apiId + '" placeholder="?period=1&status=up" />';
    html += '</div>';

    if (hasBody) {
      html += '<div class="try-input-group">';
      html += '<label>Request Body (JSON)</label>';
      html += '<textarea id="body-' + apiId + '" rows="4" placeholder="{\\n  // Enter JSON payload here\\n}"></textarea>';
      html += '</div>';
    }

    html += '<button class="action-btn" onclick="executeApi(' + apiId + ')">&#9654; Execute Request</button>';
    html += '</div>';
    panel.innerHTML = html;
  };

  window.executeApi = function(apiId) {
    var api = apis.find(function(a){ return a.id === apiId; });
    var panel = document.getElementById('try-panel-' + apiId);
    var rawEp = api.endpoint;
    var method = api.method.toUpperCase();
    var hasBody = (method === 'POST' || method === 'PUT' || method === 'PATCH');
    
    // Replace parameters
    var finalEp = rawEp;
    var paramRegex = /\{([^}]+)\}/g;
    var match;
    while ((match = paramRegex.exec(rawEp)) !== null) {
      var param = match[1];
      var input = document.getElementById('param-' + apiId + '-' + param);
      if (input && input.value) {
        finalEp = finalEp.replace('{' + param + '}', input.value.trim());
      }
    }

    var queryInput = document.getElementById('query-' + apiId);
    if (queryInput && queryInput.value.trim()) {
      var qs = queryInput.value.trim();
      if (!qs.startsWith('?')) qs = '?' + qs;
      finalEp += qs;
    }

    var bodyData = null;
    if (hasBody) {
      var bodyInput = document.getElementById('body-' + apiId);
      if (bodyInput && bodyInput.value.trim()) {
        bodyData = bodyInput.value.trim();
      }
    }

    var fullUrl = (finalEp.startsWith('http://') || finalEp.startsWith('https://')) ? finalEp : 'https://www.site24x7.com' + finalEp;
    var proxyTarget = PROXY_URL + '/proxy?url=' + encodeURIComponent(fullUrl);

    panel.innerHTML = '<div class="try-loading">&#9654; Calling ' + esc(api.method) + ' ' + esc(finalEp) + '…</div>';

    var fetchOpts = { method: api.method };
    if (bodyData) {
      fetchOpts.body = bodyData;
      fetchOpts.headers = { 'Content-Type': 'application/json' };
    }

    fetch(proxyTarget, fetchOpts)
      .then(function(r) {
        var status = r.status;
        return r.text().then(function(body) { return { status: status, body: body }; });
      })
      .then(function(result) {
        var pretty = result.body;
        try { pretty = JSON.stringify(JSON.parse(result.body), null, 2); } catch(e){}
        var statusCls = result.status < 300 ? 'try-status-ok' : result.status < 500 ? 'try-status-warn' : 'try-status-err';
        panel.innerHTML =
          '<div class="try-resp-header">' +
            '<span class="try-method-badge method-' + api.method.toLowerCase() + '">' + api.method + '</span>' +
            '<code class="try-ep">' + esc(finalEp) + '</code>' +
            '<span class="try-status ' + statusCls + '">' + result.status + '</span>' +
            '<button class="try-close" onclick="document.getElementById(\\'try-panel-' + apiId + '\\').style.display=\\'none\\'" title="Close">&#10005;</button>' +
          '</div>' +
          '<pre class="try-body">' + esc(pretty) + '</pre>';
      })
      .catch(function(err) {
      panel.innerHTML = '<div class="try-error">&#9888; Request failed: ' + esc(err.message) + '</div>';
      });
  };

  // ── SETTINGS MODAL ──
  window.openSettings = function() {
    var c = localStorage.getItem('s247_cookie') || '';
    var a = localStorage.getItem('s247_auth') || '';
    var g = localStorage.getItem('s247_gemini_key') || '';
    var p = localStorage.getItem('s247_llm_provider') || 'gemini';
    document.getElementById('cookieInput').value = c;
    document.getElementById('authTokenInput').value = a;
    if (document.getElementById('geminiKeyInput')) document.getElementById('geminiKeyInput').value = g;
    if (document.getElementById('llmProviderSelect')) document.getElementById('llmProviderSelect').value = p;
    document.getElementById('settingsModal').style.display = 'flex';
  };
  window.closeSettings = function() {
    document.getElementById('settingsModal').style.display = 'none';
  };
  window.saveCookie = function() {
    var cookieVal = (document.getElementById('cookieInput') || {}).value || '';
    var authVal = (document.getElementById('authTokenInput') || {}).value || '';
    var geminiVal = (document.getElementById('geminiKeyInput') || {}).value || '';
    var providerVal = (document.getElementById('llmProviderSelect') || {}).value || 'gemini';
    
    if (document.getElementById('geminiKeyInput')) {
      localStorage.setItem('s247_gemini_key', geminiVal.trim());
      localStorage.setItem('s247_llm_provider', providerVal);
    }
    if (!cookieVal.trim() && !authVal.trim() && !geminiVal.trim()) { showToast('Please paste a cookie, auth token, or API key first'); return; }
    var btn = document.getElementById('saveCookieBtn');
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
    fetch(PROXY_URL + '/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: cookieVal.trim(), authToken: authVal.trim() })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (btn) { btn.textContent = 'Save Settings'; btn.disabled = false; }
      if (d.ok) {
        showToast('&#10003; Settings saved — proxy is ready!');
        checkProxyStatus();
        closeSettings();
      } else {
        showToast('Error: ' + d.message);
      }
    })
    .catch(function(){
      if (btn) { btn.textContent = 'Save Settings'; btn.disabled = false; }
      showToast('Could not reach proxy. Is it running?');
    });
  };

  document.getElementById('settingsModal').addEventListener('click', function(e){
    if (e.target === this) closeSettings();
  });

  // Check proxy status on load and every 15s
  checkProxyStatus();
  setInterval(checkProxyStatus, 15000);

  window.removeFromDataset = function(id) {
    dataset = dataset.filter(function(d){ return d.id !== id; });
    saveStore(STORAGE_KEY_DS, dataset);
    updateBadges();
    renderActiveTab();
  };

  window.clearHistory = function() {
    if (!confirm('Clear all Q&A history?')) return;
    searchHistory = [];
    saveStore(STORAGE_KEY_HX, searchHistory);
    updateBadges();
    renderActiveTab();
  };

  window.clearDataset = function() {
    if (!confirm('Clear entire dataset?')) return;
    dataset = [];
    saveStore(STORAGE_KEY_DS, dataset);
    updateBadges();
    renderActiveTab();
  };

  window.exportDataset = function(fmt) {
    if (!dataset.length) { showToast('Dataset is empty'); return; }
    var content, filename, mime;
    if (fmt === 'csv') {
      var rows = ['query,endpoint,method,sheet,subFeature,markedCorrect,addedAt'];
      dataset.forEach(function(d) {
        rows.push([
          '"'+d.query.replace(/"/g,'""')+'"',
          '"'+d.endpoint+'"',
          d.method,
          '"'+d.sheet+'"',
          '"'+d.subFeature.replace(/"/g,'""')+'"',
          d.markedCorrect ? 'true' : 'false',
          d.addedAt
        ].join(','));
      });
      content = rows.join(String.fromCharCode(10));
      filename = 'site24x7_dataset.csv';
      mime = 'text/csv';
    } else {
      content = JSON.stringify(dataset, null, 2);
      filename = 'site24x7_dataset.json';
      mime = 'application/json';
    }
    var blob = new Blob([content], {type: mime});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded ' + filename);
  };

  window.exportHistory = function() {
    if (!searchHistory.length) { showToast('History is empty'); return; }
    var blob = new Blob([JSON.stringify(searchHistory, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'site24x7_history.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Search
  var inp = document.getElementById('searchInput');
  var clrBtn = document.getElementById('clearBtn');

  function doSearch() {
    query = inp.value.trim();
    currentPage = 1;
    clrBtn.style.visibility = query ? 'visible' : 'hidden';
    activeTab = 'results';
    setTabActive('results');
    var results = getResults();
    lastResults = results;
    recordHistory(query, results);
    renderResults();
  }

  document.getElementById('searchBtn').addEventListener('click', doSearch);
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
  inp.addEventListener('input', function(){
    clrBtn.style.visibility = inp.value ? 'visible' : 'hidden';
    if (!inp.value.trim()) { query=''; renderResults(); }
  });
  clrBtn.addEventListener('click', function(){
    inp.value=''; query=''; clrBtn.style.visibility='hidden'; renderResults();
  });

  // ── TABS ──
  function setTabActive(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === tab); });
  }

  function renderDatasetTab() {
    var pane = document.getElementById('resultsPane');
    var countEl = document.getElementById('resultCount');
    countEl.textContent = dataset.length + ' saved Q&A pair(s)';
    if (!dataset.length) {
      pane.innerHTML = '<div class="no-results"><div class="nr-icon">&#128193;</div><h3>Dataset is empty</h3>' +
        '<p>Search for an API, then click <strong>Mark Correct</strong> or <strong>Add to Dataset</strong> on any result.</p></div>';
      return;
    }
    var html = '<div class="ds-toolbar">' +
      '<span class="ds-info">'+dataset.length+' pair(s) &bull; '+dataset.filter(function(d){return d.markedCorrect;}).length+' marked correct</span>' +
      '<div class="ds-btns">' +
        '<button class="ds-btn" onclick="exportDataset(&quot;json&quot;)">&#8615; Export JSON</button>' +
        '<button class="ds-btn" onclick="exportDataset(&quot;csv&quot;)">&#8615; Export CSV</button>' +
        '<button class="ds-btn ds-btn-danger" onclick="clearDataset()">&#128465; Clear All</button>' +
      '</div></div>';
    html += '<table class="ds-table"><thead><tr>' +
      '<th>Query</th><th>Endpoint</th><th>Method</th><th>Module</th><th>Correct?</th><th>Added</th><th></th>' +
    '</tr></thead><tbody>';
    dataset.forEach(function(d) {
      html += '<tr>' +
        '<td class="ds-query">'+esc(d.query)+'</td>' +
        '<td class="ds-ep"><code>'+esc(d.endpoint)+'</code></td>' +
        '<td><span class="method-badge method-'+d.method.toLowerCase()+'">'+d.method+'</span></td>' +
        '<td class="ds-sheet">'+esc(d.sheet)+'</td>' +
        '<td class="ds-correct">'+(d.markedCorrect ? '<span class="correct-yes">&#10003; Yes</span>' : '<span class="correct-no">&#8212;</span>')+'</td>' +
        '<td class="ds-date">'+new Date(d.addedAt).toLocaleDateString()+'</td>' +
        '<td><button class="ds-remove" onclick="removeFromDataset('+d.id+')">&#215;</button></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    pane.innerHTML = html;
  }

  function renderHistoryTab() {
    var pane = document.getElementById('resultsPane');
    var countEl = document.getElementById('resultCount');
    countEl.textContent = searchHistory.length + ' search(es) in history';
    if (!searchHistory.length) {
      pane.innerHTML = '<div class="no-results"><div class="nr-icon">&#128336;</div><h3>No search history yet</h3>' +
        '<p>Your searches will appear here automatically.</p></div>';
      return;
    }
    var html = '<div class="ds-toolbar">' +
      '<span class="ds-info">'+searchHistory.length+' recent search(es)</span>' +
      '<div class="ds-btns">' +
        '<button class="ds-btn" onclick="exportHistory()">&#8615; Export JSON</button>' +
        '<button class="ds-btn ds-btn-danger" onclick="clearHistory()">&#128465; Clear</button>' +
      '</div></div>';
    html += '<table class="ds-table"><thead><tr>' +
      '<th>Query</th><th>Top Result</th><th>Results</th><th>When</th>' +
    '</tr></thead><tbody>';
    searchHistory.forEach(function(h) {
      html += '<tr class="hx-row" onclick="replaySearch(this.dataset.q)" data-q="'+esc(h.query)+'">' +
        '<td class="ds-query">'+esc(h.query)+'</td>' +
        '<td class="ds-ep"><code>'+esc(h.topResult||'\u2014')+'</code></td>' +
        '<td>'+h.resultCount+'</td>' +
        '<td class="ds-date">'+new Date(h.searchedAt).toLocaleString()+'</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    pane.innerHTML = html;
  }

  var aiChatHistory = [{ role: 'ai', text: 'Hi! I am your AI Agent. What would you like to automate or query today?' }];

  function renderAITab() {
    var pane = document.getElementById('resultsPane');
    var countEl = document.getElementById('resultCount');
    countEl.innerHTML = '<span style="color:#1d4ed8; font-weight:600;">✨ AI Agent Active</span>';
    
    var html = '<div class="ai-chat-container">';
    html += '<div class="ai-chat-messages" id="aiChatMessages">';
    aiChatHistory.forEach(function(msg) {
      var contentHtml = msg.role === 'ai' ? (msg.isHtml ? msg.text : parseMD(msg.text)) : esc(msg.text);
      html += '<div class="chat-msg chat-' + msg.role + '">' +
                '<div class="chat-bubble">' + contentHtml + '</div>' +
              '</div>';
    });
    html += '</div>';
    
    html += '<div class="ai-chat-input-area">' +
              '<input type="text" id="aiChatInput" placeholder="e.g. Change the threshold profile of all my Windows servers" />' +
              '<button class="ai-chat-btn" onclick="sendAiMessage()">Send</button>' +
            '</div>';
    html += '</div>';
    pane.innerHTML = html;
    
    var msgsEl = document.getElementById('aiChatMessages');
    if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;

    var inputEl = document.getElementById('aiChatInput');
    if (inputEl) {
      inputEl.focus();
      inputEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendAiMessage();
      });
    }
  }

  function parseMD(md) {
    if (!md) return '';
    var html = esc(md);
    var b3 = String.fromCharCode(96, 96, 96);
    var b1 = String.fromCharCode(96);
    html = html.replace(new RegExp(b3 + '[a-z]*\\\\n([\\\\s\\\\S]*?)' + b3, 'gi'), function(m, code) {
      return '<pre style="background:#1e293b; color:#e2e8f0; padding:10px; border-radius:6px; overflow-x:auto; margin:8px 0; font-family:monospace; font-size:11px; text-align:left;">' + code + '</pre>';
    });
    html = html.replace(new RegExp(b1 + '([^' + b1 + ']+)' + b1, 'g'), '<code style="background:#e2e8f0; color:#b91c1c; padding:2px 4px; border-radius:3px; font-family:monospace;">$1</code>');
    html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    html = html.replace(/\\n/g, '<br/>');
    return html;
  }

  window.sendAiMessage = async function() {
    var inputEl = document.getElementById('aiChatInput');
    if (!inputEl) return;
    var txt = inputEl.value.trim();
    if (!txt) return;
    
    var geminiKey = localStorage.getItem('s247_gemini_key') || '';
    if (!geminiKey) {
      showToast('Please configure your Gemini API Key in Settings first.');
      openSettings();
      return;
    }
    
    aiChatHistory.push({ role: 'user', text: txt });
    var loadingIndex = aiChatHistory.length;
    aiChatHistory.push({ role: 'ai', text: 'Thinking...' });
    
    inputEl.value = '';
    renderAITab();

    try {
      var tokens = tokenize(txt);
      var allApisScored = apis.map(function(api){ return {api:api, score:scoreResult(api,tokens)}; })
        .filter(function(r){ return r.score > 0; })
        .sort(function(a,b){ return b.score - a.score; })
        .slice(0, 5);
        
      var contextStr = allApisScored.map(function(r, idx) {
        var a = r.api;
        return "API " + (idx+1) + ":\\n" +
               "Name/Desc: " + a.subFeature + " - " + a.description + "\\n" +
               "Endpoint: " + a.method + " " + a.endpoint + "\\n" +
               "Request Fields: " + (a.requestFields ? a.requestFields.join(', ') : 'None');
      }).join("\\n\\n");

      var systemPrompt = "You are an AI Agent for Site24x7 APIs. The user wants to perform an action.\\n" +
        "Here are the top relevant Site24x7 API endpoints from our database for their request:\\n\\n" +
        contextStr + "\\n\\n" +
        "Instructions:\\n" +
        "1. Identify the single correct API to use.\\n" +
        "2. Generate the JSON payload required.\\n" +
        "3. You MUST output ONLY a raw JSON object (do not use markdown or backticks) matching this schema:\\n" +
        "{ \\"method\\": \\"GET\\", \\"endpoint\\": \\"/app/api/..\\", \\"payload\\": {}, \\"explanation\\": \\"Why this API.\\" }\\n" +
        "If none match, return { \\"error\\": \\"No relevant API found.\\" }";

      var body = {
        contents: [
          { parts: [{ text: systemPrompt + "\\n\\nUser Request: " + txt }] }
        ]
      };

      var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      var data = await res.json();
      
      if (data.error) {
        aiChatHistory[loadingIndex].text = "Error from Gemini: " + data.error.message;
      } else if (data.candidates && data.candidates[0].content) {
        var reply = data.candidates[0].content.parts[0].text.trim();
        var b3 = String.fromCharCode(96,96,96);
        if (reply.startsWith(b3 + 'json')) reply = reply.substring(7);
        if (reply.startsWith(b3)) reply = reply.substring(3);
        if (reply.endsWith(b3)) reply = reply.substring(0, reply.length - 3);
        
        try {
          var j = JSON.parse(reply);
          if (j.error) {
            aiChatHistory[loadingIndex].text = j.error;
          } else {
            var payloadStr = typeof j.payload === 'string' ? j.payload : JSON.stringify(j.payload, null, 2);
            var mCls = j.method ? j.method.toLowerCase() : 'other';
            
            var cardHtml = '<div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-top:8px; font-family:-apple-system,sans-serif;">';
            cardHtml += '<div style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">';
            cardHtml += '<span class="try-method-badge method-' + mCls + '">' + esc(j.method) + '</span>';
            cardHtml += '<code style="font-family:monospace; font-size:12px; color:#1e293b; font-weight:600;">' + esc(j.endpoint) + '</code>';
            cardHtml += '</div>';
            cardHtml += '<pre style="padding:12px 14px; margin:0; background:#1e293b; color:#e2e8f0; font-family:monospace; font-size:11px; overflow-x:auto;">' + esc(payloadStr) + '</pre>';
            cardHtml += '<div style="padding:12px 14px; font-size:12px; color:#475569; line-height:1.5;">' + esc(j.explanation) + '</div>';
            
            window.aiExecActions = window.aiExecActions || [];
            var actionId = window.aiExecActions.length;
            window.aiExecActions.push({ method: j.method, endpoint: j.endpoint, payload: payloadStr, index: loadingIndex });
            
            var btnClick = "executeAiAction(" + actionId + ")";
            cardHtml += '<div style="padding:10px 14px; border-top:1px solid #e2e8f0; background:#f8fafc;">';
            cardHtml += '<button class="ai-chat-btn" onclick="' + btnClick + '">Execute Request &#9654;</button>';
            cardHtml += '</div>';
            cardHtml += '</div>';
            cardHtml += '<div id="ai-exec-result-' + loadingIndex + '"></div>';
            
            aiChatHistory[loadingIndex] = { role: 'ai', text: cardHtml, isHtml: true };
          }
        } catch(err) {
          aiChatHistory[loadingIndex].text = "Parse error: " + err.message + "\\n\\nRaw Output:\\n" + reply;
        }
      } else {
        aiChatHistory[loadingIndex].text = "Error: Unexpected response format from Gemini.";
      }
    } catch (e) {
      aiChatHistory[loadingIndex].text = "Network Error: " + e.message;
    }
    
    renderAITab();
  };

  window.executeAiAction = function(actionId) {
    var action = window.aiExecActions[actionId];
    if (!action) return;
    
    var method = action.method;
    var endpoint = action.endpoint;
    var payloadStr = action.payload;
    var loadingIndex = action.index;
    
    var fullUrl = (endpoint.startsWith('http://') || endpoint.startsWith('https://')) ? endpoint : 'https://www.site24x7.com' + endpoint;
    var proxyTarget = PROXY_URL + '/proxy?url=' + encodeURIComponent(fullUrl);

    var resultDiv = document.getElementById('ai-exec-result-' + loadingIndex);
    if (resultDiv) {
      resultDiv.innerHTML = '<div class="try-loading" style="padding:16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; margin-top:8px;">&#9203; Executing ' + esc(method) + ' ' + esc(endpoint) + '…</div>';
    }
    
    var fetchOpts = { method: method.toUpperCase() };
    if (fetchOpts.method !== 'GET' && payloadStr && payloadStr.trim() !== '' && payloadStr.trim() !== '{}') {
      fetchOpts.body = payloadStr;
      fetchOpts.headers = { 'Content-Type': 'application/json' };
    }

    fetch(proxyTarget, fetchOpts)
      .then(function(r) {
        var status = r.status;
        return r.text().then(function(body) { return { status: status, body: body }; });
      })
      .then(function(result) {
        var pretty = result.body;
        try { pretty = JSON.stringify(JSON.parse(result.body), null, 2); } catch(e){}
        var statusCls = result.status < 300 ? 'try-status-ok' : result.status < 500 ? 'try-status-warn' : 'try-status-err';
        var html = '<div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-top:8px; background:#0f172a;">' +
            '<div class="try-resp-header">' +
              '<span class="try-method-badge method-' + fetchOpts.method.toLowerCase() + '">' + esc(fetchOpts.method) + '</span>' +
              '<code class="try-ep">' + esc(endpoint) + '</code>' +
              '<span class="try-status ' + statusCls + '">' + result.status + '</span>' +
            '</div>' +
            '<pre class="try-body">' + esc(pretty) + '</pre>' +
          '</div>';
        if (resultDiv) resultDiv.innerHTML = html;
      })
      .catch(function(err) {
        if (resultDiv) resultDiv.innerHTML = '<div class="try-error" style="margin-top:8px;">&#9888; Proxy Request failed: ' + esc(err.message) + '</div>';
      });
  };

  function renderActiveTab() {
    if (activeTab === 'dataset') renderDatasetTab();
    else if (activeTab === 'history') renderHistoryTab();
    else if (activeTab === 'ai') renderAITab();
    else renderResults();
  }

  window.replaySearch = function(q) {
    document.getElementById('searchInput').value = q;
    query = q;
    currentPage = 1;
    activeTab = 'results';
    setTabActive('results');
    document.getElementById('clearBtn').style.visibility = 'visible';
    renderResults();
  };

  document.getElementById('searchInput').addEventListener('input', function(e) {
    query = e.target.value;
    currentPage = 1;
    doSearch();
  });

  var searchTypeSelect = document.getElementById('searchType');
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', function(e) {
      currentPage = 1;
      doSearch();
    });
  }

  document.getElementById('clearBtn').addEventListener('click', function(){
    inp.value=''; query=''; clrBtn.style.visibility='hidden'; renderResults();
  });

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setTabActive(btn.dataset.tab);
      renderActiveTab();
    });
  });

  buildModuleChips();
  buildSidebar();
  renderResults();
  updateBadges();
  document.getElementById('hTotalCount').textContent = apis.length + ' endpoints';
})();
`;

const css = `
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f6fa;
    color: #1f2937;
    min-height: 100vh;
    font-size: 13px;
  }
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:#f1f1f1; }
  ::-webkit-scrollbar-thumb { background:#ccc; border-radius:4px; }

  /* ── TOP NAV ── */
  .top-nav {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 24px;
    display: flex;
    align-items: center;
    height: 52px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.2px;
  }
  .nav-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav-stat {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 3px 10px;
    border-radius: 12px;
  }
  .nav-stat strong { color: #1d4ed8; }
  .settings-btn {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #374151;
    font-size: 12px;
    padding: 5px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: background 0.15s;
  }
  .settings-btn:hover { background: #e5e7eb; }
  .settings-icon { font-size: 13px; }

  /* Proxy indicator */
  .proxy-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 3px 10px;
  }
  .proxy-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
    transition: background 0.3s;
  }

  /* Try API panel */
  .rc-try-panel {
    border-top: 1px solid #e5e7eb;
    background: #0f172a;
    border-radius: 0 0 8px 8px;
    overflow: hidden;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
  .try-resp-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    flex-wrap: wrap;
  }
  .try-ep {
    font-family: 'SF Mono','Fira Code','Consolas',monospace;
    font-size: 11px;
    color: #94a3b8;
    flex: 1;
    word-break: break-all;
  }
  .try-status {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .try-status-ok   { background: #14532d; color: #4ade80; }
  .try-status-warn { background: #713f12; color: #fbbf24; }
  .try-status-err  { background: #7f1d1d; color: #f87171; }
  .try-method-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .try-close {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 13px;
    margin-left: auto;
    padding: 2px 5px;
    border-radius: 3px;
  }
  .try-close:hover { color: #f87171; background: #1e293b; }
  .try-body {
    color: #e2e8f0;
    font-family: 'SF Mono','Fira Code','Consolas',monospace;
    font-size: 11px;
    line-height: 1.55;
    padding: 12px 16px;
    overflow-x: auto;
    max-height: 320px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .try-loading, .try-error {
    padding: 12px 16px;
    font-size: 12px;
    font-family: 'SF Mono','Fira Code','Consolas',monospace;
  }
  .try-loading { color: #94a3b8; }
  .try-error   { color: #f87171; }
  .try-error code { background: #1e293b; padding: 1px 5px; border-radius: 3px; }

  /* Try API Input Form */
  .try-input-form {
    padding: 16px;
    background: #0f172a;
    border-radius: 6px;
    margin: 10px;
    border: 1px solid #1e293b;
  }
  .try-input-title {
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .try-input-group {
    margin-bottom: 12px;
  }
  .try-input-group label {
    display: block;
    color: #94a3b8;
    font-size: 11px;
    margin-bottom: 6px;
  }
  .try-input-group label code {
    color: #38bdf8;
    background: rgba(56,189,248,0.1);
    padding: 2px 4px;
    border-radius: 3px;
  }
  .try-input-group input, .try-input-group textarea {
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    color: #f8fafc;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .try-input-group input:focus, .try-input-group textarea:focus {
    border-color: #3b82f6;
    outline: none;
  }
  .try-input-form .action-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 4px;
  }
  .try-input-form .action-btn:hover { background: #1d4ed8; }

  /* Settings Modal */
  .settings-modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  .settings-modal {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    width: 520px;
    max-width: 95vw;
    padding: 28px;
    animation: fadeIn 0.18s ease;
  }
  .sm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .sm-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }
  .sm-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 18px;
    padding: 2px;
    border-radius: 4px;
  }
  .sm-close:hover { color: #374151; background: #f3f4f6; }
  .sm-section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .sm-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 10px;
  }
  .sm-desc code {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: 'SF Mono','Fira Code','Consolas',monospace;
    font-size: 11px;
    color: #1d4ed8;
  }
  .sm-steps {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    color: #374151;
    line-height: 1.7;
    margin-bottom: 14px;
  }
  .sm-steps ol { padding-left: 16px; }
  #cookieInput, #authTokenInput, #geminiKeyInput {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 11px;
    font-family: 'SF Mono','Fira Code','Consolas',monospace;
    color: #111827;
    padding: 9px 12px;
    resize: vertical;
    min-height: 70px;
    outline: none;
    background: #fafafa;
    transition: border-color 0.15s;
  }
  #cookieInput:focus, #authTokenInput:focus, #geminiKeyInput:focus { border-color: #1d4ed8; background: #fff; }
  .sm-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sm-proxy-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
  }
  .sm-proxy-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #ef4444;
    transition: background 0.3s;
  }
  .sm-save-btn {
    background: #1d4ed8;
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    padding: 8px 22px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .sm-save-btn:hover { background: #1e40af; }
  .sm-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── SEARCH SECTION ── */
  .search-section {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px 24px 12px;
  }
  .search-row {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 900px;
  }
  .search-box {
    flex: 1;
    position: relative;
  }
  #searchInput {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    color: #111827;
    padding: 8px 32px 8px 12px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
  }
  #searchInput:focus {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29,78,216,0.08);
  }
  #searchInput::placeholder { color: #9ca3af; }
  #clearBtn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 13px;
    visibility: hidden;
    padding: 2px;
    line-height: 1;
  }
  #clearBtn:hover { color: #374151; }
  .search-type-select {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
    color: #374151;
    padding: 8px 10px;
    outline: none;
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
  }
  #searchBtn {
    background: #1d4ed8;
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    padding: 8px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  #searchBtn:hover { background: #1e40af; }

  /* Tabs */
  .tabs-row {
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 10px;
    border-bottom: none;
  }
  .tab-btn {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b7280;
    font-size: 12px;
    font-family: inherit;
    font-weight: 500;
    padding: 6px 14px 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.15s, border-color 0.15s;
  }
  .tab-btn:hover { color: #1d4ed8; }
  .tab-btn.active { color: #1d4ed8; border-bottom-color: #1d4ed8; }
  .tab-badge {
    background: #e5e7eb;
    color: #374151;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 8px;
    font-weight: 600;
  }
  .tab-btn.active .tab-badge { background: #dbeafe; color: #1d4ed8; }

  /* ── LAYOUT ── */
  .layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    max-width: 1300px;
    margin: 0 auto;
    min-height: calc(100vh - 120px);
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: #fff;
    border-right: 1px solid #e5e7eb;
    padding: 12px 0;
    position: sticky;
    top: 52px;
    height: calc(100vh - 52px);
    overflow-y: auto;
  }
  .sidebar-section-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #9ca3af;
    padding: 8px 14px 4px;
  }
  .sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all 0.12s;
  }
  .sidebar-item:hover { background: #f3f4f6; }
  .sidebar-item.active { background: #eff6ff; border-left-color: #1d4ed8; }
  .si-name { font-size: 12px; color: #374151; font-weight: 400; }
  .sidebar-item.active .si-name { color: #1d4ed8; font-weight: 500; }
  .si-count { font-size: 11px; color: #9ca3af; background: #f3f4f6; padding: 1px 6px; border-radius: 8px; }
  .sidebar-item.active .si-count { background: #dbeafe; color: #1d4ed8; }

  /* Method filters in sidebar */
  .sidebar-divider { height: 1px; background: #e5e7eb; margin: 10px 0; }
  .method-filters-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #9ca3af;
    padding: 4px 14px;
  }
  #methodFilters { padding: 4px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .method-filter-btn {
    font-size: 11px;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', monospace;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.12s;
    letter-spacing: 0.3px;
  }
  .method-filter-btn.active[data-method="GET"]    { background:#dcfce7; border-color:#86efac; color:#15803d; }
  .method-filter-btn.active[data-method="POST"]   { background:#dbeafe; border-color:#93c5fd; color:#1d4ed8; }
  .method-filter-btn.active[data-method="PUT"]    { background:#fef9c3; border-color:#fde047; color:#a16207; }
  .method-filter-btn.active[data-method="DELETE"] { background:#fee2e2; border-color:#fca5a5; color:#b91c1c; }
  .method-filter-btn.active[data-method="PATCH"]  { background:#f3e8ff; border-color:#d8b4fe; color:#7c3aed; }

  /* Module chips */
  .module-chips-bar { padding: 6px 14px 6px; }
  #moduleChips { display: flex; flex-wrap: wrap; gap: 4px; }
  .mchip {
    font-size: 11px; padding: 2px 8px; border-radius: 10px;
    border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280;
    cursor: pointer; transition: all 0.12s; user-select: none;
  }
  .mchip:hover { border-color: #93c5fd; color: #1d4ed8; }
  .mchip.active { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; font-weight: 500; }

  /* ── MAIN ── */
  .main-area {
    padding: 16px 20px;
    min-width: 0;
  }

  .result-meta-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  #resultCount {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
  }

  /* ── RESULT CARD ── */
  .result-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 10px;
    transition: box-shadow 0.15s, border-color 0.15s;
    overflow: hidden;
  }
  .result-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-color: #d1d5db; }
  .result-card.expanded { border-color: #93c5fd; }

  .rc-header { padding: 12px 16px; cursor: pointer; }

  .rc-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .method-badge {
    font-size: 11px;
    font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }
  .method-get    { background:#dcfce7; color:#15803d; }
  .method-post   { background:#dbeafe; color:#1d4ed8; }
  .method-put    { background:#fef9c3; color:#a16207; }
  .method-delete { background:#fee2e2; color:#b91c1c; }
  .method-patch  { background:#f3e8ff; color:#7c3aed; }
  .method-other  { background:#f3f4f6; color:#6b7280; }

  .rc-endpoint {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    color: #1d4ed8;
    font-weight: 500;
    word-break: break-all;
  }
  .rc-client-tag {
    font-size: 10px;
    padding: 1px 7px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 3px;
    color: #6b7280;
    font-weight: 500;
    flex-shrink: 0;
  }
  .rc-module-tag {
    font-size: 10px;
    padding: 1px 7px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 3px;
    color: #1d4ed8;
    font-weight: 600;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .rc-score {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .score-pct {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    min-width: 30px;
    text-align: right;
  }
  .score-track {
    width: 80px;
    height: 5px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }
  .score-fill {
    height: 100%;
    background: #1d4ed8;
    border-radius: 3px;
    transition: width 0.3s;
  }

  .rc-desc {
    font-size: 12px;
    color: #374151;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .rc-meta {
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  .rc-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .action-btn {
    font-size: 11px;
    font-family: inherit;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.12s;
    display: flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  .btn-correct {
    background: #fff;
    border: 1px solid #d1d5db;
    color: #374151;
  }
  .btn-correct:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn-dataset {
    background: #fff;
    border: 1px solid #d1d5db;
    color: #374151;
  }
  .btn-dataset:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn-try {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }
  .btn-try:hover { background: #dbeafe; }

  /* Card detail */
  .rc-detail {
    border-top: 1px solid #f3f4f6;
    padding: 12px 16px;
    background: #fafafa;
  }
  .detail-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  /* Fields table */
  .fields-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .field-row { border-bottom: 1px solid #f3f4f6; }
  .field-row:last-child { border-bottom: none; }
  .field-row td { padding: 6px 8px; vertical-align: top; }
  .field-name {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    color: #1f2937;
    font-weight: 500;
    white-space: nowrap;
  }
  .type-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    font-family: 'SF Mono', 'Fira Code', monospace;
    white-space: nowrap;
  }
  .field-desc { font-size: 12px; color: #6b7280; line-height: 1.4; }

  .req-fields { display: flex; flex-wrap: wrap; gap: 5px; }
  .req-pill {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    padding: 2px 8px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #374151;
  }
  .summary-box {
    margin-top: 10px;
    padding: 8px 12px;
    background: #f3f4f6;
    border-radius: 5px;
    font-size: 11px;
    color: #6b7280;
    line-height: 1.5;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  /* Module overview */
  .module-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }
  .module-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.15s;
    border-top: 2px solid #e5e7eb;
  }
  .module-card:hover { border-top-color: #1d4ed8; box-shadow: 0 2px 8px rgba(0,0,0,0.07); transform: translateY(-1px); }
  .mc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .mc-name { font-size: 13px; font-weight: 600; color: #111827; }
  .mc-count { font-size: 18px; font-weight: 700; color: #1d4ed8; }
  .mc-desc { font-size: 11px; color: #9ca3af; line-height: 1.5; display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden; }

  .section-divider {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #9ca3af;
    text-transform: uppercase;
    margin: 4px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e7eb;
  }

  /* Empty / No results */
  .no-results {
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;
  }
  .nr-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.6; }
  .no-results h3 { font-size: 16px; color: #374151; margin-bottom: 6px; }
  .no-results p { font-size: 12px; line-height: 1.6; }

  /* Highlight */
  mark { background: #fef08a; color: #713f12; border-radius: 2px; padding: 0 1px; }

  /* Pagination */
  .pagination { display:flex; align-items:center; justify-content:center; gap:4px; margin-top:20px; flex-wrap:wrap; }
  .pg-btn {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 5px;
    color: #374151; font-family: inherit; font-size: 12px;
    padding: 5px 10px; cursor: pointer; transition: all 0.12s;
  }
  .pg-btn:hover { border-color: #93c5fd; color: #1d4ed8; }
  .pg-btn.active { background: #1d4ed8; border-color: #1d4ed8; color: #fff; font-weight: 600; }
  .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .pg-dots { padding: 5px 4px; color: #9ca3af; font-size: 12px; }

  @media (max-width: 800px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid #e5e7eb; }
    .search-row { flex-wrap: wrap; }
    .search-type-select { display: none; }
  }

  /* ── TOAST ── */
  #toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #111827;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 18px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    z-index: 9999;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
  }
  #toast.show { opacity: 1; transform: translateY(0); }

  /* ── DATASET / HISTORY TABLES ── */
  .ds-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ds-info { font-size: 12px; color: #6b7280; }
  .ds-btns { display: flex; gap: 6px; flex-wrap: wrap; }
  .ds-btn {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    color: #374151;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .ds-btn:hover { background: #f3f4f6; border-color: #9ca3af; }
  .ds-btn-danger { color: #b91c1c; border-color: #fca5a5; }
  .ds-btn-danger:hover { background: #fee2e2; }

  .ds-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .ds-table thead { background: #f9fafb; }
  .ds-table th {
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    border-bottom: 1px solid #e5e7eb;
  }
  .ds-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
  .ds-table tr:last-child td { border-bottom: none; }
  .ds-table tbody tr:hover { background: #f9fafb; }
  .hx-row { cursor: pointer; }
  .hx-row:hover { background: #eff6ff !important; }
  .ds-query { font-weight: 500; color: #111827; max-width: 160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ds-ep code { font-family: 'SF Mono','Fira Code','Consolas',monospace; font-size:11px; color:#1d4ed8; word-break:break-all; }
  .ds-sheet { color: #6b7280; white-space: nowrap; }
  .ds-date { color: #9ca3af; white-space: nowrap; }
  .ds-correct { text-align: center; }
  .correct-yes { color: #15803d; font-weight: 600; }
  .correct-no  { color: #d1d5db; }
  .ds-remove {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 15px;
    padding: 2px 5px;
    border-radius: 3px;
    transition: color 0.12s, background 0.12s;
  }
  .ds-remove:hover { color: #b91c1c; background: #fee2e2; }

  /* ── AI CHAT ── */
  .ai-chat-container { display: flex; flex-direction: column; height: calc(100vh - 160px); background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .ai-chat-messages { flex: 1; padding: 16px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
  .chat-msg { display: flex; }
  .chat-user { justify-content: flex-end; }
  .chat-ai { justify-content: flex-start; }
  .chat-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-wrap: break-word; }
  .chat-user .chat-bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 2px; }
  .chat-ai .chat-bubble { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .ai-chat-input-area { display: flex; padding: 12px 16px; background: #fff; border-top: 1px solid #e2e8f0; gap: 10px; }
  #aiChatInput { flex: 1; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 24px; outline: none; font-size: 13px; transition: all 0.2s; font-family: inherit; }
  #aiChatInput:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .ai-chat-btn { background: #2563eb; color: #fff; border: none; border-radius: 24px; padding: 0 20px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 13px; }
  .ai-chat-btn:hover { background: #1d4ed8; }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test with AI — Site24x7 API Search</title>
  <meta name="description" content="Search and explore all Site24x7 Admin APIs across 15 feature modules. Find endpoints, data fields, and payloads instantly." />
  <style>${css}</style>
</head>
<body>

<!-- Top Nav -->
<nav class="top-nav">
  <span class="nav-title">Test with AI</span>
  <div class="nav-right">
    <span class="nav-stat">&#128202; <strong id="hTotalCount">720 endpoints</strong></span>
    <div class="proxy-indicator" title="Local proxy status">
      <div class="proxy-dot" id="proxyDot"></div>
      <span id="proxyLabel">Proxy: Off</span>
    </div>
    <button class="settings-btn" onclick="openSettings()"><span class="settings-icon">&#9881;</span> Settings</button>
  </div>
</nav>

<!-- Settings Modal -->
<div class="settings-modal-overlay" id="settingsModal">
  <div class="settings-modal">
    <div class="sm-header">
      <span class="sm-title">&#9881; Settings — Live API Testing</span>
      <button class="sm-close" onclick="closeSettings()" title="Close">&#10005;</button>
    </div>

    <div class="sm-section-title">Session Cookie</div>
    <p class="sm-desc">
      Paste your Site24x7 session cookie below. This is sent to the local proxy server (<code>localhost:3334</code>) and never leaves your machine.
    </p>
    <div class="sm-steps">
      <ol>
        <li>Open <strong>site24x7.com/app/demo</strong> in Chrome</li>
        <li>Press <strong>F12</strong> &rarr; Network tab &rarr; filter by Fetch/XHR</li>
        <li>Click any <code>/app/api/</code> request &rarr; Headers &rarr; copy the <strong>Cookie:</strong> value</li>
      </ol>
    </div>
    <textarea id="cookieInput" placeholder="zaaid=...; JSESSIONID=...; CT_CSRF_TOKEN=..."></textarea>

    <div class="sm-section-title" style="margin-top:20px;">OAuth Token (Required for some APIs)</div>
    <p class="sm-desc">
      From the same request headers, copy the <strong>Authorization</strong> value.
    </p>
    <textarea id="authTokenInput" placeholder="Zoho-oauthtoken 1000.b2a5fbfa0d2ed..."></textarea>

    <div class="sm-section-title" style="margin-top:20px;">AI Agent Configuration</div>
    <p class="sm-desc">Select your LLM provider and paste your API key to enable the AI Agent.</p>
    <div style="margin-bottom:10px;">
      <select id="llmProviderSelect" style="width:100%; border:1px solid #d1d5db; border-radius:6px; padding:8px 10px; font-family:inherit; font-size:12px; outline:none; background:#fafafa;">
        <option value="gemini">Google Gemini (Gemini 1.5 Pro/Flash)</option>
        <option value="openai">OpenAI (GPT-4o)</option>
      </select>
    </div>
    <textarea id="geminiKeyInput" placeholder="Paste your API key here..." style="min-height: 40px;"></textarea>

    <div class="sm-footer">
      <div class="sm-proxy-status">
        <div class="sm-proxy-dot" id="smProxyDot"></div>
        <span id="smProxyLabel">Checking proxy…</span>
      </div>
      <button class="sm-save-btn" id="saveCookieBtn" onclick="saveCookie()">Save Settings</button>
    </div>
  </div>
</div>

<!-- Search Section -->
<div class="search-section">
  <div class="search-row">
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="list the monitor groups" autocomplete="off" spellcheck="false" />
      <button id="clearBtn" title="Clear">&#10005;</button>
    </div>
    <select id="searchType" class="search-type-select">
      <option value="keyword">Keyword search (no AI)</option>
      <option value="semantic">Semantic Search (TF-IDF)</option>
    </select>
    <button id="searchBtn">&#128269; Search</button>
  </div>
  <div class="tabs-row">
    <button class="tab-btn active" data-tab="results">Results</button>
    <button class="tab-btn" data-tab="ai" style="color: #1d4ed8; font-weight: 600;">✨ AI Agent</button>
    <button class="tab-btn" data-tab="history">Q&amp;A History <span class="tab-badge" id="historyBadge">0</span></button>
    <button class="tab-btn" data-tab="dataset">Dataset <span class="tab-badge" id="datasetBadge">0</span></button>
  </div>
</div>

<!-- Layout -->
<div class="layout">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-section-title">Feature Modules</div>
    <div id="sidebarSheets"></div>

    <div class="sidebar-divider"></div>
    <div class="method-filters-label">HTTP Method</div>
    <div id="methodFilters">
      <button class="method-filter-btn active" data-method="GET">GET</button>
      <button class="method-filter-btn active" data-method="POST">POST</button>
      <button class="method-filter-btn active" data-method="PUT">PUT</button>
      <button class="method-filter-btn active" data-method="DELETE">DELETE</button>
      <button class="method-filter-btn active" data-method="PATCH">PATCH</button>
    </div>
    <div class="sidebar-divider"></div>
    <div class="method-filters-label">Module Filter</div>
    <div class="module-chips-bar"><div id="moduleChips"></div></div>
  </aside>

  <!-- Main -->
  <main class="main-area">
    <div class="result-meta-bar">
      <span id="resultCount">Loading…</span>
    </div>
    <div id="resultsPane">
      <div class="no-results"><div class="nr-icon">&#9889;</div><h3>Loading…</h3></div>
    </div>
  </main>

</div>

<!-- Toast -->
<div id="toast"></div>

<script>
${clientJs}
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html generated. Size:', Math.round(fs.statSync('index.html').size / 1024), 'KB');
