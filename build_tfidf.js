const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'site24x7_api_data.json');
const OUTPUT_FILE = path.join(__dirname, 'tfidf_index.json');

// Stop words to filter out
const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','but','by','for','if','in','into','is','it',
  'no','not','of','on','or','such','that','the','their','then','there','these',
  'they','this','to','was','will','with'
]);

function tokenize(text) {
  if (!text) return [];
  // Lowercase, remove non-alphanumeric, split by word boundary
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function buildIndex() {
  console.log('Loading API data from', DATA_FILE);
  let apis = [];
  try {
    apis = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading API data:', err);
    process.exit(1);
  }

  const N = apis.length;
  console.log(`Found ${N} API endpoints.`);

  // DF = Document Frequency (number of documents containing the term)
  const df = {};

  apis.forEach(api => {
    // Collect all text from this API
    const fields = [
      api.endpoint,
      api.subFeature,
      api.sheet,
      api.description,
      api.summaryText,
      api.searchText,
      ...(api.responseFields || []),
      ...(api.requestFields || [])
    ];
    
    // Get unique tokens for this document
    const docTokens = new Set();
    fields.forEach(f => {
      const tokens = tokenize(f);
      tokens.forEach(t => docTokens.add(t));
    });

    // Increment DF for each unique token in this doc
    docTokens.forEach(t => {
      df[t] = (df[t] || 0) + 1;
    });
  });

  console.log(`Extracted ${Object.keys(df).length} unique terms.`);

  // Calculate IDF
  // IDF(t) = log(N / (1 + DF(t)))
  const idf = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log(N / (1 + freq));
  }

  console.log('Writing IDF dictionary to', OUTPUT_FILE);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ idf, N }, null, 2));
  console.log('Done!');
}

buildIndex();
