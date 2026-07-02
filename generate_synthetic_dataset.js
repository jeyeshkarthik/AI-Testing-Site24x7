require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Configuration
const PROVIDER = process.env.LLM_PROVIDER || 'openai';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

const DATA_FILE = path.join(__dirname, 'site24x7_api_data.json');
const CSV_FILE = path.join(__dirname, 'site24x7_Dataset.csv');

// Delay helper to avoid rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Modular LLM Abstraction
 * Switch between providers easily here
 */
async function callLLM(prompt) {
  if (PROVIDER === 'openai') {
    return await callOpenAI(prompt);
  } else {
    throw new Error(`Unknown provider: ${PROVIDER}`);
  }
}

/**
 * OpenAI Implementation
 */
async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY || !OPENAI_BASE_URL) throw new Error("OpenAI credentials not set in .env");
  
  const url = OPENAI_BASE_URL.endsWith('/') ? OPENAI_BASE_URL + 'chat/completions' : OPENAI_BASE_URL + '/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Unexpected OpenAI response structure.");
  return text;
}

function buildPrompt(api) {
  return `
You are an expert IT administrator and developer using the Site24x7 API.
I will give you an API endpoint and its details.
Generate exactly 4 realistic, diverse questions or commands a user might type into a search bar to find this specific endpoint.
Make some questions formal, some casual (like slang or incomplete sentences), and some focused on the exact HTTP method (like "create", "delete", "fetch").

Endpoint: ${api.method} ${api.endpoint}
Module: ${api.sheet}
Feature: ${api.subFeature}
Description: ${api.description}
Request Fields: ${api.requestFields?.join(', ')}
Response Fields: ${api.responseFields?.join(', ')}

Output ONLY a JSON array of strings containing the 4 queries. Do not use markdown blocks, just raw JSON like: ["query 1", "query 2"]
`;
}

function escapeCsv(str) {
  if (str == null) return '';
  const text = String(str);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5; // Default to 5 to avoid burning quota
  
  console.log(`Starting synthetic data generation (Limit: ${LIMIT} endpoints, Provider: ${PROVIDER})`);
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error("Error: site24x7_api_data.json not found.");
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const apis = jsonData.apis || [];
  
  // Pick a random subset of endpoints up to the LIMIT
  const shuffled = apis.sort(() => 0.5 - Math.random());
  const selectedApis = shuffled.slice(0, LIMIT);
  
  let newRowsCount = 0;
  
  for (let i = 0; i < selectedApis.length; i++) {
    const api = selectedApis[i];
    console.log(`\n[${i+1}/${LIMIT}] Processing: ${api.method} ${api.endpoint}`);
    
    try {
      const prompt = buildPrompt(api);
      let resText = await callLLM(prompt);
      
      // Clean up response if it wrapped in markdown
      resText = resText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const queries = JSON.parse(resText);
      
      if (!Array.isArray(queries)) throw new Error("Response was not a JSON array.");
      
      const lines = [];
      const timestamp = new Date().toISOString();
      queries.forEach(q => {
        lines.push(`${escapeCsv(q)},${escapeCsv(api.endpoint)},${api.method},${escapeCsv(api.sheet)},${escapeCsv(api.subFeature)},True,${timestamp}`);
      });
      
      fs.appendFileSync(CSV_FILE, '\n' + lines.join('\n'));
      newRowsCount += queries.length;
      console.log(`  -> Added ${queries.length} queries to dataset.`);
      
    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
    }
    
    if (i < selectedApis.length - 1) {
      console.log(`  -> Waiting 4 seconds to respect rate limits...`);
      await sleep(4000);
    }
  }
  
  console.log(`\n✅ Done! Added ${newRowsCount} new synthetic queries to site24x7_Dataset.csv`);
  console.log(`Run again with --limit=X to generate more without burning your quota instantly.`);
}

main();
