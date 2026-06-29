const fs = require('fs');

async function buildEmbeddings() {
  console.log("Loading Transformers.js...");
  // Import transformers dynamically to handle ESM in CommonJS if needed, or just require it.
  // @xenova/transformers works with require.
  const { pipeline } = require('@xenova/transformers');

  console.log("Loading all-MiniLM-L6-v2 model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
  const apis = data.apis;
  const vectors = {}; // mapping api id -> vector array

  console.log(`Generating embeddings for ${apis.length} APIs... This may take a minute.`);
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    // Create a rich text representation of the API for semantic search
    const textToEmbed = `${api.subFeature} - ${api.description}. Endpoint: ${api.method} ${api.endpoint}. Fields: ${(api.requestFields || []).join(' ')}`;
    
    // Generate vector
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    // output.data is a Float32Array of length 384
    vectors[api.id] = Array.from(output.data);
    
    if ((i + 1) % 50 === 0) {
      console.log(`Processed ${i + 1}/${apis.length} APIs...`);
    }
  }

  console.log("Finished generating embeddings.");
  fs.writeFileSync('site24x7_vector.json', JSON.stringify(vectors), 'utf8');
  console.log(`Saved site24x7_vector.json. Size: ${Math.round(fs.statSync('site24x7_vector.json').size / 1024)} KB`);
}

buildEmbeddings().catch(console.error);
