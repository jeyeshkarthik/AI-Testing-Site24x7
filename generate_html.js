const fs = require('fs');

console.log('Loading database...');
const data = JSON.parse(fs.readFileSync('site24x7_compact.json', 'utf8'));
const dataJson = JSON.stringify(data);

let tfidfJson = "null";
try { tfidfJson = fs.readFileSync('tfidf_index.json', 'utf8'); } catch(e){}

let vectorJson = "null";
try { vectorJson = fs.readFileSync('site24x7_vector.json', 'utf8'); } catch(e){}

console.log('Reading src files...');
const css = fs.readFileSync('./src/styles.css', 'utf8');
const clientJs = fs.readFileSync('./src/client.js', 'utf8');
const template = fs.readFileSync('./src/template.html', 'utf8');

console.log('Building index.html...');
let html = template.replace('${css}', css);

const jsInjection = `
  window.__SITE24X7_DB__ = ${dataJson};
  window.__SITE24X7_TFIDF__ = ${tfidfJson};
  window.__SITE24X7_VECTOR_DB__ = ${vectorJson};
  ${clientJs}
`;
html = html.replace('${clientJs}', jsInjection);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html generated. Size:', Math.round(fs.statSync('index.html').size / 1024), 'KB');
