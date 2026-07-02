import { pipeline, env, cos_sim } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

env.allowLocalModels = false;

let extractor = null;
let vectorDB = null;

async function init(dbUrl) {
  postMessage({ type: 'status', message: 'Loading AI Model & Vector DB...' });
  try {
    const [ext, vecRes] = await Promise.all([
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
      fetch(dbUrl)
    ]);
    
    extractor = ext;
    vectorDB = await vecRes.json();
    
    postMessage({ type: 'ready' });
  } catch(e) {
    postMessage({ type: 'error', error: e.message });
  }
}

self.onmessage = async (e) => {
  if (e.data.type === 'init') {
    init(e.data.dbUrl);
  } else if (e.data.type === 'search') {
    if (!extractor || !vectorDB) {
      postMessage({ type: 'search_result', id: e.data.id, results: [] });
      return;
    }
    
    const query = e.data.query;
    try {
      const out = await extractor(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(out.data);
      
      const results = [];
      for (const [apiId, apiVectors] of Object.entries(vectorDB)) {
        if (!apiVectors || apiVectors.length === 0) continue;
        let maxScore = -1;
        // Check if apiVectors is an array of vectors (array of arrays) or just one vector (array of numbers)
        if (Array.isArray(apiVectors[0])) {
          for (const vec of apiVectors) {
            const score = cos_sim(queryVector, vec);
            if (score > maxScore) maxScore = score;
          }
        } else {
          maxScore = cos_sim(queryVector, apiVectors);
        }
        results.push({ id: parseInt(apiId), score: maxScore });
      }
      
      results.sort((a,b) => b.score - a.score);
      postMessage({ type: 'search_result', id: e.data.id, results: results });
    } catch(err) {
      postMessage({ type: 'search_result', id: e.data.id, results: [] });
    }
  }
};
