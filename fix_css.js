const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles.css');
let css = fs.readFileSync(cssPath); // read as buffer to handle null bytes safely
let cssStr = css.toString('utf16le'); // Try to see if it's completely UTF-16? No, the first part is UTF-8.

// Better to read as latin1, find the index of the good part, then slice.
cssStr = css.toString('latin1');
const marker = 'body.dark-mode .ai-act-footer { background: #1e293b; border-top-color: #475569; }';
const idx = cssStr.indexOf(marker);

if (idx > -1) {
    // Keep everything up to the marker + its length
    const cleanStr = cssStr.substring(0, idx + marker.length);
    // Convert back to utf8 buffer (since it was originally utf8, latin1 reading preserves bytes for the ascii part)
    const cleanBuffer = Buffer.from(cleanStr, 'latin1');
    
    const newCss = `
  /* New Accordion Sidebar Styles */
  .sidebar-submodule {
    display: flex;
    align-items: center;
    padding: 8px 15px 8px 30px;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
    background: #f8fafc;
    border-left: 3px solid transparent;
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.2s ease;
    user-select: none;
  }
  .sidebar-submodule:hover { background: #e2e8f0; color: #1e293b; }
  .sidebar-submodule.active { background: #eff6ff; color: #1d4ed8; font-weight: 500; border-left-color: #3b82f6; }
  
  .ssm-name { flex: 1; }
  .ssm-count {
    background: #cbd5e1;
    color: #334155;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
  }
  .sidebar-submodule.active .ssm-count { background: #bfdbfe; color: #1d4ed8; }

  body.dark-mode .sidebar-submodule { background: #0f172a; color: #94a3b8; border-bottom-color: #1e293b; }
  body.dark-mode .sidebar-submodule:hover { background: #1e293b; color: #e2e8f0; }
  body.dark-mode .sidebar-submodule.active { background: #172554; color: #93c5fd; border-left-color: #2563eb; }
  body.dark-mode .ssm-count { background: #334155; color: #cbd5e1; }
  body.dark-mode .sidebar-submodule.active .ssm-count { background: #1e40af; color: #93c5fd; }
`;
    
    fs.writeFileSync(cssPath, Buffer.concat([cleanBuffer, Buffer.from(newCss, 'utf8')]));
    console.log("Fixed CSS successfully!");
} else {
    console.log("Marker not found.");
}
