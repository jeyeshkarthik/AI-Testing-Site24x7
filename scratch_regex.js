const fs = require('fs');

const regexes = [
    // Remove "using GET /path..." or "with POST /path..."
    /\b(?:using|with|via|for|to|make a)?\s*(?:GET|POST|PUT|DELETE|PATCH)?\s*(?:request\s*to)?\s*(?:https?:\/\/[^\s]+|\/[^\s,]+)/gi,
    // Remove standalone HTTP methods if they are left over
    /\b(GET|POST|PUT|DELETE|PATCH)\b/gi,
    // Remove "API" or "endpoint"
    /\b(API|endpoint)\b/gi
];

function cleanQuery(query) {
    let cleaned = query;
    for (let r of regexes) {
        cleaned = cleaned.replace(r, ' ');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\b(?:using|with|via|for|to|a|an|the)$/i, '').trim();
    return cleaned;
}

const lines = fs.readFileSync('site24x7_Dataset.csv', 'utf8').split('\n');
let modified = 0;

for (let i = 1; i < Math.min(lines.length, 500); i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Simple CSV split (not handling quotes perfectly, just for preview)
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;
    
    const query = line.substring(0, firstComma);
    const cleaned = cleanQuery(query);
    
    if (query !== cleaned) {
        console.log(`ORIGINAL: ${query}`);
        console.log(`CLEANED:  ${cleaned}`);
        console.log('---');
        modified++;
    }
}
console.log(`Modified ${modified} queries in first 500 lines.`);
