const fs = require('fs');

const data = fs.readFileSync('site24x7_Dataset.csv', 'utf8');
const lines = data.split('\n');
const header = lines[0];

const seenQueries = new Set();
const cleanLines = [header];

let duplicateCount = 0;
let badPathCount = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  let parts = [];
  let current = '';
  let inQuotes = false;
  for(let j=0; j<line.length; j++) {
      if(line[j] === '"') inQuotes = !inQuotes;
      else if(line[j] === ',' && !inQuotes) { parts.push(current); current = ''; }
      else current += line[j];
  }
  parts.push(current);
  
  if (parts.length < 2) continue;
  
  let query = parts[0];
  if (query.startsWith('"') && query.endsWith('"')) {
    query = query.substring(1, query.length - 1);
  }
  
  const queryLower = query.toLowerCase();
  
  // Check for duplicates
  if (seenQueries.has(queryLower)) {
    duplicateCount++;
    continue;
  }
  
  // Check for bad patterns (API paths, "http", etc.)
  if (queryLower.includes('/app/api') || queryLower.includes('/api/') || queryLower.includes('http://') || queryLower.includes('https://') || queryLower.includes('endpoint')) {
    badPathCount++;
    continue;
  }
  
  seenQueries.add(queryLower);
  cleanLines.push(line);
}

fs.writeFileSync('site24x7_Dataset.csv', cleanLines.join('\n') + '\n', 'utf8');
console.log(`Original lines: ${lines.length}`);
console.log(`Duplicates removed: ${duplicateCount}`);
console.log(`Bad path queries removed: ${badPathCount}`);
console.log(`Final clean lines: ${cleanLines.length}`);
