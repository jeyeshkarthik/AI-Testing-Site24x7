const fs = require('fs');

function tokenize(q) {
  return q.toLowerCase().split(/[\s_]+/).filter(function(t) {
    return t.length > 2 && t !== 'the' && t !== 'and' && t !== 'for' && t !== 'with';
  });
}

function scoreResult(api, tokens, query) {
  var s = 0;
  var q = query.toLowerCase();
  
  tokens.forEach(function(tok) {
    if (api.endpoint.toLowerCase().indexOf(tok) >= 0) s += 12;
    if (api.subFeature.toLowerCase().indexOf(tok) >= 0) s += 10;
    if (api.sheet.toLowerCase().indexOf(tok) >= 0) s += 8;
    if (api.description.toLowerCase().indexOf(tok) >= 0) s += 6;
  });
  if (api.subFeature.toLowerCase().indexOf(q)>=0) s += 20;
  if (api.description.toLowerCase().indexOf(q)>=0) s += 15;
  if (api.endpoint.toLowerCase().indexOf(q)>=0) s += 18;
  return s;
}

async function run() {
  const { pipeline } = require('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  const vdb = JSON.parse(fs.readFileSync('site24x7_vector.json', 'utf8'));
  const compact = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
  
  async function testQuery(query) {
    console.log(`\n--- Testing: "${query}" ---`);
    const qOut = await extractor(query, { pooling: 'mean', normalize: true });
    const qv = Array.from(qOut.data);
    const tokens = tokenize(query);
    
    const results = compact.apis.map(api => {
      let score = 0;
      if (vdb[api.id]) {
        for (let i = 0; i < 384; i++) score += qv[i] * vdb[api.id][i];
      }
      
      const qLower = query.toLowerCase();
      if ((qLower.includes('create') || qLower.includes('add') || qLower.includes('new') || qLower.includes('set up')) && api.method === 'POST') score += 0.20;
      if ((qLower.includes('update') || qLower.includes('modify') || qLower.includes('change')) && api.method === 'PUT') score += 0.20;
      if ((qLower.includes('delete') || qLower.includes('remove')) && api.method === 'DELETE') score += 0.20;
      if ((qLower.includes('get') || qLower.includes('list') || qLower.includes('show')) && api.method === 'GET') score += 0.20;
      
      const bm25 = scoreResult(api, tokens, query);
      score += (bm25 * 0.003); // Add BM25 to semantic score
      
      return { id: api.id, endpoint: api.endpoint, method: api.method, score: score, bm25 };
    });
    
    results.sort((a,b) => b.score - a.score);
    for (let i = 0; i < 5; i++) {
      const api = compact.apis.find(a => a.id === results[i].id);
      console.log(`${results[i].score.toFixed(3)} (BM25:${results[i].bm25}) - ${results[i].method} ${results[i].endpoint} [${api.subFeature}]`);
    }
  }

  await testQuery("set up a new geographic region to check my servers from");
  await testQuery("create location profile");
}
run().catch(console.error);
