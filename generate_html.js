const fs = require('fs');
require('dotenv').config();

console.log('Loading database...');
const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const dataJson = JSON.stringify(data);

let tfidfJson = "null";
try { tfidfJson = fs.readFileSync('tfidf_index.json', 'utf8'); } catch(e){}

let vectorJson = "null";
try { vectorJson = fs.readFileSync('site24x7_vector.json', 'utf8'); } catch(e){}

console.log('Reading src files...');
const template = fs.readFileSync('./src/template.html', 'utf8');

console.log('Building index.html...');
let html = template;

const azureKey = process.env.AZURE_API_KEY || '';
const azureEndpoint = process.env.AZURE_ENDPOINT || '';

const scriptInjection = `<script>
  window.__AZURE_API_KEY__ = "${azureKey}";
  window.__AZURE_ENDPOINT__ = "${azureEndpoint}";
</script>`;

if (html.includes('</head>')) {
  html = html.replace('</head>', `${scriptInjection}\n</head>`);
} else {
  html = scriptInjection + '\n' + html;
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html generated. Size:', Math.round(fs.statSync('index.html').size / 1024), 'KB');
