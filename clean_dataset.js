const fs = require('fs');

const regexes = [
    // Remove "using GET /path..." or "with POST /path..."
    /\b(?:using|with|via|for|to|make a)?\s*(?:GET|POST|PUT|DELETE|PATCH)?\s*(?:request\s*to)?\s*(?:https?:\/\/[^\s]+|\/[^\s,]+)/gi,
    
    // Remove standalone HTTP methods but CASE-SENSITIVE so we don't break "How do I get..."
    /\b(GET|POST|PUT|DELETE|PATCH)\b/g,
    
    // Remove "API" or "endpoint"
    /\b(API|endpoint|endpoints)\b/gi
];

function cleanQuery(query) {
    let cleaned = query;
    for (let r of regexes) {
        cleaned = cleaned.replace(r, ' ');
    }
    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Clean trailing prepositions left behind
    cleaned = cleaned.replace(/\b(?:using|with|via|for|to|a|an|the|\?)$/i, '').trim();
    // Clean trailing question mark if word was removed before it
    cleaned = cleaned.replace(/\s\?$/, '?');
    return cleaned || query; // fallback if we accidentally erased the whole string
}

const inputPath = 'site24x7_Dataset.csv';
const lines = fs.readFileSync(inputPath, 'utf8').split('\n');

let modifiedCount = 0;
let outputLines = [];

// Header
outputLines.push(lines[0]);

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // The CSV has commas in some fields, so we only want the first comma for the query
    // Wait, some queries might have commas in quotes. But looking at our dataset, 
    // the query is the first field and usually doesn't contain commas, or we can use regex.
    // The safest is to match the first column properly, or just use string indexOf since 
    // we know the structure: query,endpoint,method,sheet,subFeature,markedCorrect,addedAt
    
    // A better approach for this specific CSV: split by the first comma (or use a simple parser)
    // Actually, looking at the data, the query is everything before the first `,/app/api/` or `,https://`
    
    // Let's use a standard CSV parser approach:
    // We know the second column is the endpoint, which always starts with `/` or `https://`
    let firstComma = line.indexOf(',/');
    if (firstComma === -1) {
        firstComma = line.indexOf(',https://');
    }
    
    if (firstComma === -1) {
        // Fallback to first comma
        firstComma = line.indexOf(',');
    }
    
    if (firstComma === -1) {
        outputLines.push(line);
        continue;
    }
    
    const query = line.substring(0, firstComma);
    const restOfLine = line.substring(firstComma);
    
    const cleaned = cleanQuery(query);
    
    if (query !== cleaned) {
        modifiedCount++;
    }
    
    outputLines.push(cleaned + restOfLine);
}

fs.writeFileSync(inputPath, outputLines.join('\n'));
console.log(`Successfully cleaned dataset. Modified ${modifiedCount} queries.`);
