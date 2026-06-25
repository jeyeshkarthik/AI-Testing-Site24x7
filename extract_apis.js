const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('site24x7_Admin_API.xlsx');

const allAPIs = [];

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  let currentHeaderRow = -1;
  let currentSubFeatureGroup = '';
  
  rawData.forEach((row, rowIdx) => {
    // Detect header rows
    if (row[0] === 'Sub-Feature' && row[1] === 'Endpoint Path') {
      currentHeaderRow = rowIdx;
      return;
    }
    
    // Capture section separator comments
    if (typeof row[0] === 'string' && row[0].startsWith('Below:')) {
      currentSubFeatureGroup = row[0];
      return;
    }
    
    // Parse data rows that come after a header row
    if (currentHeaderRow >= 0 && rowIdx > currentHeaderRow) {
      const subFeature = row[0];
      const endpoint = row[1];
      const method = row[2];
      const statusCode = row[3];
      const description = row[4];
      const requestPayload = row[5];
      const responseExample = row[6];
      
      if (subFeature && endpoint && method && 
          subFeature !== 'Sub-Feature' && endpoint !== 'Endpoint Path') {
        
        // Extract response fields from the response JSON
        let responseFields = [];
        if (responseExample && responseExample !== 'No payload') {
          try {
            // Try to extract field names from the response JSON string
            const fieldMatches = responseExample.match(/"([^"]+)":/g);
            if (fieldMatches) {
              responseFields = [...new Set(fieldMatches.map(f => f.replace(/[":]/g, '')))];
            }
          } catch (e) {}
        }
        
        allAPIs.push({
          sheet: sheetName,
          subFeature: subFeature.trim(),
          endpoint: endpoint.trim(),
          method: method.trim(),
          statusCode: statusCode.trim(),
          description: (description || '').trim(),
          requestPayload: (requestPayload || '').trim(),
          responseExample: (responseExample || '').trim().substring(0, 500),
          responseFields: responseFields,
          // For search: combine all text
          searchText: [sheetName, subFeature, endpoint, description, 
                       requestPayload, responseFields.join(' ')].join(' ').toLowerCase()
        });
      }
    }
  });
});

console.log(`Total APIs extracted: ${allAPIs.length}`);
console.log('\nSample entries:');
allAPIs.slice(0, 5).forEach(api => {
  console.log(`  [${api.sheet}] ${api.method} ${api.endpoint} - ${api.subFeature}`);
});

// Save all extracted API data
fs.writeFileSync('api_data.json', JSON.stringify(allAPIs, null, 2));
console.log('\nSaved to api_data.json');

// Print sheet summary
const sheetCounts = {};
allAPIs.forEach(api => {
  sheetCounts[api.sheet] = (sheetCounts[api.sheet] || 0) + 1;
});
console.log('\nAPIs per sheet:');
Object.entries(sheetCounts).forEach(([sheet, count]) => {
  console.log(`  ${sheet}: ${count}`);
});
