// scripts/market-sync.mjs
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // You may need to npm install node-fetch
import fs from 'fs';
import path from 'path';

//import { StockDataResponse, TopGainerLoserData } from '../src/datamodels/topgainerloser_model';

// 1. Log to verify environment is loading (optional, for debugging)
console.log("Checking Environment Variables...");

// 2. Pick the key (Check Service Role first, then Anon Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                    process.env.SUPABASE_ANON_KEY; 

// 3. Robust Validation
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase Credentials!");
  console.error(`URL Found: ${!!supabaseUrl}`);
  console.error(`Key Found: ${!!supabaseKey}`);
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);
export let mappedData =[];
/*
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use SERVICE ROLE for build scripts to bypass RLS
); */
// --- THE MISSING HELPER FUNCTION ---
function parseCSVold(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  // Clean headers (remove quotes and extra spaces)
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    // Regex to handle commas inside quotes if necessary, but simple split for your data
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {});
  });
}

// Simple CSV Parser for the specific format provided
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {});
  });
}
async function syncNifty() {
  console.log('🏗️ Build Phase: Starting Market Data Sync...');
  
  try {
    let rawData = [];
    // 1. Try Live Fetch (NSE API or your source)
    // 2. Fallback to Local CSV if needed
    const csvPath = path.join(process.cwd(), 'public', 'assets/top_gainers_nifty50.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    rawData = parseCSV(csvData);





    // ... [Insert your CSV parsing logic from the worker here] ...
    /*const mappedData = parseCSV(csvData).map(item => ({
      stckname: item.Symbol,
      // ... rest of your mapping
    }));*/

         // Step 3: Map to Supabase Schema
    const mappedDataInter = rawData.map(item => ({
      stckname: item.Symbol || item.symbol,
      fname: item.Symbol || item.symbol,
      sec: item.Symbol || item.symbol, // As requested
      open: parseFloat(item.Open || item.open || 0),
      high: parseFloat(item.High || item.high || 0),
      low: parseFloat(item.Low || item.low || 0),
      close: parseFloat(item["Prev. Close"] || item.previousClose || 0),
      pcnt: parseFloat(item["%chng"] || item.pChange || 0),
      vol: parseInt(item.Volume || item.totalTradedVolume || 0),
      updated_at: item["CA "] ? new Date(item["CA "]).toISOString() : new Date().toISOString()
    }));

    // Step 4: Upsert to Supabase
    const { error } = await supabase
      .from('top_gainers_nifty50')
      .upsert(mappedDataInter, { onConflict: 'stckname' });

     mappedData = mappedDataInter;

    if (error) throw error;






   /* // 3. Update Supabase
    const { error } = await supabase
      .from('top_gainers_nifty50')
      .upsert(mappedData);*/

  //  if (error) throw error;
    
    console.log('✅ Build Phase: Supabase Tables Verified & Updated.');
  } catch (err) {
    console.error('❌ Build Phase Critical Error:', err.message);
    process.exit(1); // KILL the build if data sync fails
  }
}

syncNifty();