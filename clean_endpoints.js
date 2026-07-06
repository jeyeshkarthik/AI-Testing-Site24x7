const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'mapped_endpoints.json');
const outputFile = path.join(__dirname, 'mapped_endpoints.json');

const endpoints = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`Initial endpoints: ${endpoints.length}`);

// Map to keep track of unique endpoints by method + url
const uniqueEndpoints = new Map();

for (const ep of endpoints) {
    // Replace any path segment that is purely numeric with {id}
    // E.g. /15698000069743001 -> /{id}
    let cleanedUrl = ep.url;
    try {
        const parsedUrl = new URL(ep.url);
        
        // Clean path segments
        const pathSegments = parsedUrl.pathname.split('/');
        const cleanedSegments = pathSegments.map(segment => {
            if (/^\d+$/.test(segment)) {
                return '{id}';
            }
            return segment;
        });
        
        parsedUrl.pathname = cleanedSegments.join('/');
        cleanedUrl = parsedUrl.toString();
        
    } catch (e) {
        // Fallback regex if URL parsing fails
        cleanedUrl = ep.url.replace(/\/\d+(?=\/|$)/g, '/{id}');
    }

    const key = `${ep.method} ${cleanedUrl}`;

    if (!uniqueEndpoints.has(key)) {
        uniqueEndpoints.set(key, {
            ...ep,
            url: cleanedUrl // Update URL to the parameterized version
        });
    }
}

const cleanedList = Array.from(uniqueEndpoints.values());
console.log(`Cleaned endpoints: ${cleanedList.length}`);
console.log(`Total after merging with 720: ${cleanedList.length + 720}`);

fs.writeFileSync(outputFile, JSON.stringify(cleanedList, null, 2));
console.log(`Saved cleaned endpoints to ${outputFile}`);
