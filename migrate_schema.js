const fs = require('fs');
const path = require('path');

const compactFile = path.join(__dirname, 'site24x7_compact.json');
const db = JSON.parse(fs.readFileSync(compactFile, 'utf8'));

const newModules = {
    "Admin": new Set(),
    "Reports": new Set()
};

for (const api of db.apis) {
    if (api.sheet === 'Reports') {
        // These are the new ones
        api.module = "Reports";
        api.subModule = api.subFeature || 'General';
    } else if (api.sheet === 'Report Settings' || api.subFeature === 'Custom Report' || api.subFeature === 'Customize Report') {
        // Move old reports stuff into Reports
        api.module = "Reports";
        // If it was under Configuration Profiles but it's a Custom Report, make its subModule Custom Report
        api.subModule = api.subFeature === 'Custom Report' || api.subFeature === 'Customize Report' 
            ? 'Custom Report' 
            : api.sheet;
    } else {
        // Everything else is Admin
        api.module = "Admin";
        api.subModule = api.sheet;
    }

    // Add to modules list
    newModules[api.module].add(api.subModule);
}

// Convert sets to arrays
db.modules = {
    "Admin": Array.from(newModules["Admin"]).sort(),
    "Reports": Array.from(newModules["Reports"]).sort()
};

// Remove old sheets array to enforce the new schema
delete db.sheets;

fs.writeFileSync(compactFile, JSON.stringify(db));
console.log(`Migration complete. Admin has ${db.modules.Admin.length} sub-modules. Reports has ${db.modules.Reports.length} sub-modules.`);
