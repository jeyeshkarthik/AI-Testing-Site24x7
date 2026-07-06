const fs = require('fs');
const path = require('path');

const compactFile = path.join(__dirname, 'site24x7_compact.json');
const db = JSON.parse(fs.readFileSync(compactFile, 'utf8'));

const initialCount = db.apis.length;

// Keep everything EXCEPT old endpoints that are 'Custom Report'
db.apis = db.apis.filter(api => {
    const isOldCustomReport = api.id < 720 && api.subModule === 'Custom Report';
    return !isOldCustomReport;
});

const finalCount = db.apis.length;
const removed = initialCount - finalCount;

fs.writeFileSync(compactFile, JSON.stringify(db));
console.log(`Successfully removed ${removed} old Custom Report endpoints.`);
