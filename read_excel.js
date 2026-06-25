const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('site24x7_Admin_API.xlsx');
console.log('Sheet names:', JSON.stringify(wb.SheetNames));
console.log('Total sheets:', wb.SheetNames.length);

const result = {};

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  result[sheetName] = {
    rowCount: data.length,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    sample: data.slice(0, 3)
  };
  console.log(`\n--- Sheet: "${sheetName}" ---`);
  console.log('Rows:', data.length);
  console.log('Columns:', Object.keys(data[0] || {}).join(', '));
  if (data.length > 0) {
    console.log('Sample row 1:', JSON.stringify(data[0]).substring(0, 300));
  }
});

fs.writeFileSync('excel_data.json', JSON.stringify(result, null, 2));
console.log('\nFull data written to excel_data.json');
