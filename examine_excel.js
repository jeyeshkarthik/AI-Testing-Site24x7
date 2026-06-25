const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('site24x7_Admin_API.xlsx');

const allData = {};

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  // Get raw data with header row
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  console.log(`\n=== Sheet: "${sheetName}" ===`);
  console.log('Total rows:', rawData.length);
  
  // Print first 10 rows to understand structure
  rawData.slice(0, 15).forEach((row, i) => {
    const nonEmpty = row.filter(c => c !== '');
    if (nonEmpty.length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(row).substring(0, 200));
    }
  });
});
