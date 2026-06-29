
window.aiExtractor = null;
window.aiExtractorLoading = false;

(function() {
  var DB = window.__SITE24X7_DB__;
  var TFIDF_DB = window.__SITE24X7_TFIDF__;
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
      .split(/\s+/)
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
      var safe = tok.replace(/[-\\/\\^$*+?.()|[\\]{}]/g,'\\$&');
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

  async function getResults() {
    var filtered = apis.filter(function(api) {
      if (!activeMethods.has(api.method)) return false;
      if (activeSheet !== 'ALL' && api.sheet !== activeSheet) return false;
      return true;
    });
    if (!query) return filtered.map(function(api){ return {api:api, score:0}; });

    var type = document.getElementById('searchType').value;
    if (type === 'semantic') {
      if (!window.aiExtractor) {
        if (!window.aiExtractorLoading) {
           window.aiExtractorLoading = true;
           var rc = document.getElementById('resultCount');
           if (rc) rc.innerHTML = '<i>Loading AI Search Model (happens once)...</i>';
           
           import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js')
             .then(function(transformers) {
               transformers.env.allowLocalModels = false;
               return transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                 progress_callback: function(x) {
                   var rcc = document.getElementById('resultCount');
                   if (x.status !== 'ready' && rcc) rcc.innerHTML = '<i>Downloading AI Model: ' + Math.round(x.progress||0) + '%</i>';
                 }
               });
             })
             .then(function(extractor) {
               window.aiExtractor = extractor;
               window.aiExtractorLoading = false;
               renderResults();
             }).catch(function(e) {
               var rce = document.getElementById('resultCount');
               if (rce) rce.innerHTML = '<i>Error loading model: ' + e.message + '</i>';
               window.aiExtractorLoading = false;
             });
        }
        return filtered.map(function(api){ return {api:api, score:0}; });
      }
      
      var out = await window.aiExtractor(query, { pooling: 'mean', normalize: true });
      var qv = Array.from(out.data);
      var vdb = window.__SITE24X7_VECTOR_DB__ || {};
      
      var tokens = tokenize(query);

      return filtered.map(function(api) {
        var apiVec = vdb[api.id];
        var score = 0;
        if (apiVec) {
          for (var i = 0; i < 384; i++) score += qv[i] * apiVec[i];
        }
        
        // Hybrid Intent Boosting: Semantic models often cluster verbs poorly. 
        // We add an absolute boost to the correct HTTP method based on conversational verbs.
        var qLower = query.toLowerCase();
        if ((qLower.indexOf('create')>-1 || qLower.indexOf('add')>-1 || qLower.indexOf('new')>-1 || qLower.indexOf('set up')>-1) && api.method === 'POST') score += 0.20;
        if ((qLower.indexOf('update')>-1 || qLower.indexOf('modify')>-1 || qLower.indexOf('change')>-1) && api.method === 'PUT') score += 0.20;
        if ((qLower.indexOf('delete')>-1 || qLower.indexOf('remove')>-1) && api.method === 'DELETE') score += 0.20;
        if ((qLower.indexOf('get')>-1 || qLower.indexOf('list')>-1 || qLower.indexOf('show')>-1) && api.method === 'GET') score += 0.20;

        // True Hybrid: Incorporate BM25 score to ground the vector search in exact keywords
        var bm25 = scoreResult(api, tokens);
        score += (bm25 * 0.003);

        return { api: api, score: score };
      }).filter(function(r){ return r.score > 0.25; })
        .sort(function(a,b){ return b.score - a.score; });
    }

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
            (score > 0 ? '<span style="margin-left:auto; font-size:11px; color:#9ca3af; font-family:monospace;">' + (score <= 1.05 ? Math.round(score * 100) + '% Match' : 'Score: ' + Math.round(score)) + '</span>' : '') +
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

  async function renderResults() {
    var results = await getResults();
    lastResults = results;
    var total = results.length;
    var maxScore = results.length ? results[0].score : 1;
    var pageResults = results.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
    var tokens = query ? tokenize(query) : [];
    var html = '';

    // Update result count line
    var countEl = document.getElementById('resultCount');
    if (!window.aiExtractorLoading) {
      var stype = document.getElementById('searchType').value;
      if (!query && activeSheet === 'ALL') {
        countEl.textContent = total + ' endpoint(s) — browse all modules';
      } else if (query) {
        countEl.textContent = total + ' result(s) — ' + (stype === 'semantic' ? 'semantic search' : 'keyword search');
      } else {
        countEl.textContent = total + ' endpoint(s) in ' + activeSheet;
      }
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
      html += '<textarea id="body-' + apiId + '" rows="4" placeholder="{\n  // Enter JSON payload here\n}"></textarea>';
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
            '<button class="try-close" onclick="document.getElementById(\'try-panel-' + apiId + '\').style.display=\'none\'" title="Close">&#10005;</button>' +
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
    var m = localStorage.getItem('s247_gemini_model') || 'gemini-2.0-flash';
    document.getElementById('cookieInput').value = c;
    document.getElementById('authTokenInput').value = a;
    if (document.getElementById('geminiKeyInput')) document.getElementById('geminiKeyInput').value = g;
    if (document.getElementById('llmProviderSelect')) document.getElementById('llmProviderSelect').value = p;
    if (document.getElementById('geminiModelInput')) document.getElementById('geminiModelInput').value = m;
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
    var modelVal = (document.getElementById('geminiModelInput') || {}).value || 'gemini-2.0-flash';
    
    if (document.getElementById('geminiKeyInput')) {
      localStorage.setItem('s247_gemini_key', geminiVal.trim());
      localStorage.setItem('s247_llm_provider', providerVal);
      localStorage.setItem('s247_gemini_model', modelVal.trim() || 'gemini-2.0-flash');
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
  window.search = async function() {
    query = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    document.getElementById('clearBtn').style.visibility = query ? 'visible' : 'hidden';
    await renderResults();
    var results = lastResults;
    recordHistory(query, results);
  };

  document.getElementById('searchBtn').addEventListener('click', search);
  document.getElementById('searchInput').addEventListener('keyup', function(e) { if(e.key==='Enter') search(); });
  document.getElementById('searchInput').addEventListener('input', function(){
    if (!document.getElementById('searchInput').value.trim()) { query=''; renderResults(); }
    document.getElementById('clearBtn').style.visibility = document.getElementById('searchInput').value ? 'visible' : 'hidden';
  });
  document.getElementById('clearBtn').addEventListener('click', function(){
    document.getElementById('searchInput').value=''; query=''; document.getElementById('clearBtn').style.visibility='hidden'; renderResults();
  });
  document.getElementById('searchType').addEventListener('change', function() { currentPage=1; renderResults(); });

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
      if (msg.role === 'user') {
        html += '<div class="chat-msg chat-user"><div class="chat-bubble">' + esc(msg.text) + '</div></div>';
      } else {
        var contentHtml = msg.isHtml ? msg.text : (window.marked ? marked.parse(msg.text) : esc(msg.text).replace(/\n/g,'<br>'));
        html += '<div class="chat-msg chat-ai"><div class="chat-bubble markdown-body">' + contentHtml + '</div></div>';
      }
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
    html = html.replace(new RegExp(b3 + '[a-z]*\\\n([\\\s\\\S]*?)' + b3, 'gi'), function(m, code) {
      return '<pre style="background:#1e293b; color:#e2e8f0; padding:10px; border-radius:6px; overflow-x:auto; margin:8px 0; font-family:monospace; font-size:11px; text-align:left;">' + code + '</pre>';
    });
    html = html.replace(new RegExp(b1 + '([^' + b1 + ']+)' + b1, 'g'), '<code style="background:#e2e8f0; color:#b91c1c; padding:2px 4px; border-radius:3px; font-family:monospace;">$1</code>');
    html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br/>');
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
        return "API " + (idx+1) + ":\n" +
               "Name/Desc: " + a.subFeature + " - " + a.description + "\n" +
               "Endpoint: " + a.method + " " + a.endpoint + "\n" +
               "Request Fields: " + (a.requestFields ? a.requestFields.join(', ') : 'None');
      }).join("\n\n");

      var systemPrompt = "You are an AI Agent for Site24x7 APIs. The user wants to perform an action.\n" +
        "Here are the top relevant Site24x7 API endpoints from our database for their request:\n\n" +
        contextStr + "\n\n" +
        "Instructions:\n" +
        "1. Identify the correct API(s) to use based on the context OR the previous conversation.\n" +
        "2. Generate the JSON payloads required for all necessary actions.\n" +
        "3. You MUST output ONLY a raw JSON object (do not use markdown or backticks) matching this schema:\n" +
        "{ \"explanation\": \"Overall explanation\", \"actions\": [ { \"method\": \"GET\", \"endpoint\": \"/app/api/..\", \"payload\": {}, \"explanation\": \"Why this step.\" } ] }\n" +
        "If the user is asking to modify or update the previous payload, simply output the updated JSON object in the actions array.\n" +
        "If the user is just making conversation (e.g. 'hello', 'thanks'), return: { \"reply\": \"Your conversational response here\" }\n" +
        "If they are asking for an API that doesn't exist and there is no previous context, return: { \"error\": \"No relevant API found.\" }";

      var contents = [];
      aiChatHistory.forEach(function(msg, idx) {
        if (idx === 0) return; // Skip intro message
        if (idx >= loadingIndex - 1) return; // Skip the current user prompt and 'Thinking...' message
        
        var role = msg.role === 'ai' ? 'model' : 'user';
        var textContent = msg.rawText || msg.text;
        
        // Merge consecutive messages of the same role (Gemini requires alternating roles)
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += "\n" + textContent;
        } else {
          contents.push({ role: role, parts: [{ text: textContent }] });
        }
      });
      
      // Ensure the very first message is from 'user' (Gemini requirement)
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: "Start of conversation." }] });
      }

      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt + "\n\nUser Request: " + txt }]
      });

      var body = { contents: contents };

      var activeModel = localStorage.getItem('s247_gemini_model') || 'gemini-2.5-flash';
      var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + activeModel + ":generateContent?key=" + geminiKey, {
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
            aiChatHistory[loadingIndex] = { role: 'ai', text: j.error, rawText: reply };
          } else if (j.reply) {
            aiChatHistory[loadingIndex] = { role: 'ai', text: j.reply, rawText: reply };
          } else {
            var actions = j.actions || [];
            if (!j.actions && j.method) actions = [j]; // Fallback for single action
            
            if (actions.length === 0) {
              aiChatHistory[loadingIndex] = { role: 'ai', text: "No actions generated.", rawText: reply };
            } else {
              var cardHtml = '<div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">';
              if (j.explanation) {
                cardHtml += '<div style="font-size:13px; color:#334155; margin-bottom:4px;">' + esc(j.explanation) + '</div>';
              }
              
              actions.forEach(function(act) {
                var payloadStr = typeof act.payload === 'string' ? act.payload : JSON.stringify(act.payload, null, 2);
                var mCls = act.method ? act.method.toLowerCase() : 'other';
                
                var actHtml = '<div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; font-family:-apple-system,sans-serif;">';
                actHtml += '<div style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">';
                actHtml += '<span class="try-method-badge method-' + mCls + '">' + esc(act.method) + '</span>';
                actHtml += '<code style="font-family:monospace; font-size:12px; color:#1e293b; font-weight:600;">' + esc(act.endpoint) + '</code>';
                actHtml += '</div>';
                actHtml += '<pre style="padding:12px 14px; margin:0; background:#1e293b; color:#e2e8f0; font-family:monospace; font-size:11px; overflow-x:auto;">' + esc(payloadStr) + '</pre>';
                actHtml += '<div style="padding:12px 14px; font-size:12px; color:#475569; line-height:1.5;">' + esc(act.explanation) + '</div>';
                
                window.aiExecActions = window.aiExecActions || [];
                var actionId = window.aiExecActions.length;
                window.aiExecActions.push({ method: act.method, endpoint: act.endpoint, payload: payloadStr, index: loadingIndex });
                
                var btnClick = "executeAiAction(" + actionId + ")";
                actHtml += '<div style="padding:10px 14px; border-top:1px solid #e2e8f0; background:#f8fafc;">';
                actHtml += '<button class="ai-chat-btn" onclick="' + btnClick + '">Execute Request &#9654;</button>';
                actHtml += '</div>';
                actHtml += '<div id="ai-exec-result-' + actionId + '"></div>';
                actHtml += '</div>';
                
                cardHtml += actHtml;
              });
              
              cardHtml += '</div>';
              aiChatHistory[loadingIndex] = { role: 'ai', text: cardHtml, isHtml: true, rawText: reply };
            }
          }
        } catch(err) {
          aiChatHistory[loadingIndex] = { role: 'ai', text: "Parse error: " + err.message + "\n\nRaw Output:\n" + reply, rawText: reply };
        }
      } else {
        aiChatHistory[loadingIndex] = { role: 'ai', text: "Error: Unexpected response format from Gemini.", rawText: "Error" };
      }
    } catch (e) {
      aiChatHistory[loadingIndex] = { role: 'ai', text: "Network Error: " + e.message, rawText: "Error" };
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

    var resultDiv = document.getElementById('ai-exec-result-' + actionId);
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
        summarizeExecution(actionId, result.body, result.status);
      })
      .catch(function(err) {
        if (resultDiv) resultDiv.innerHTML = '<div class="try-error" style="margin-top:8px;">&#9888; Proxy Request failed: ' + esc(err.message) + '</div>';
      });
  };

  window.summarizeExecution = async function(actionId, apiResponseRaw, status) {
    var action = window.aiExecActions[actionId];
    if (!action) return;
    
    var geminiKey = localStorage.getItem('s247_gemini_key') || '';
    if (!geminiKey) return;

    var summaryIndex = aiChatHistory.length;
    aiChatHistory.push({ role: 'ai', text: 'Analyzing response...' });
    renderAITab();

    try {
      var systemPrompt = "You are a Site24x7 AI Agent. You just executed this API endpoint: " + action.method + " " + action.endpoint + "\n" +
        "The HTTP status code was: " + status + "\n" +
        "Here is the raw JSON response from the server:\n" + apiResponseRaw + "\n\n" +
        "Instructions:\n" +
        "1. Write a 1 to 2 sentence plain English summary of whether the action succeeded or failed.\n" +
        "2. If it succeeded, extract and mention 1 or 2 key pieces of data (like the created ID, name, or count).\n" +
        "3. Do NOT output raw JSON or code blocks. Just output a friendly text message to the user.";

      var body = {
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ]
      };

      var activeModel = localStorage.getItem('s247_gemini_model') || 'gemini-2.5-flash';
      var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + activeModel + ":generateContent?key=" + geminiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      var data = await res.json();
      
      if (data.error) {
        aiChatHistory[summaryIndex] = { role: 'ai', text: "Analysis error: " + data.error.message, rawText: data.error.message };
      } else if (data.candidates && data.candidates[0].content) {
        var reply = data.candidates[0].content.parts[0].text.trim();
        aiChatHistory[summaryIndex] = { role: 'ai', text: "&#128161; **Summary:** " + reply, rawText: reply };
      } else {
        aiChatHistory[summaryIndex] = { role: 'ai', text: "Could not analyze response.", rawText: "Error" };
      }
    } catch (e) {
      aiChatHistory[summaryIndex] = { role: 'ai', text: "Analysis Network Error: " + e.message, rawText: "Error" };
    }
    
    renderAITab();
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



  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setTabActive(btn.dataset.tab);
      renderActiveTab();
    });
  });

  if (document.getElementById('themeToggleBtn')) {
    var themeBtn = document.getElementById('themeToggleBtn');
    themeBtn.addEventListener('click', function() {
      var isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('site24x7_theme', isDark ? 'dark' : 'light');
      themeBtn.innerHTML = '<span class="settings-icon">' + (isDark ? '&#9789;' : '&#9728;') + '</span>';
    });
    if (localStorage.getItem('site24x7_theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeBtn.innerHTML = '<span class="settings-icon">&#9789;</span>';
    }
  }

  buildModuleChips();
  buildSidebar();
  renderResults();
  updateBadges();
  document.getElementById('hTotalCount').textContent = apis.length + ' endpoints';
})();