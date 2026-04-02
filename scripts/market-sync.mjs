// scripts/market-sync.mjs
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // You may need to npm install node-fetch
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import {decrypt } from './runtime-env.mjs'

//import { StockDataResponse, TopGainerLoserData } from '../src/datamodels/topgainerloser_model';

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
async function decryptenv() {

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
   console.log('starting decryptenv '  );
   console.log('current working directory ' +__dirname);
    
     const encryptedData = fs.readFileSync('.env.encrypted', 'utf8');
     console.log('encryptedData ' +JSON.stringify(encryptedData));
      let decryptedEnv =   decrypt(encryptedData)
     //const decryptedEnv = decrypt(encryptedData)  ; //.decrypt(encryptedData);
     
      // Parse string and inject into process.env
       decryptedEnv.split('\n').forEach(line => {
          const [key, ...value] = line.split('=');
          if (key && value) {
              process.env[key.trim()] = value.join('=').trim();
          }
      });
      
  
        
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
    else { 
      console.log('SUPABASE ENVIROMENT KEYS AVAILABLE  ' +JSON.stringify({ URL: supabaseUrl , KEY : supabaseKey}));
       
    }


    
    const supabase = createClient(supabaseUrl, supabaseKey);



   
      console.log("🔓 Environment decrypted and injected.");
      console.log("🔓 STARTING to FETCH NIFTY 50 GAINERS ");
      console.log("🔓 STARTING to FETCH NIFTY 50 GAINERS ");
      console.log("🔓 STARTING to FETCH NIFTY 50 GAINERS ");
      console.log("🔓 STARTING to FETCH NIFTY 50 GAINERS "); 


      syncNifty(supabase);
      // Run the Next.js command
      //const cmd = process.argv[2] === 'build' ? 'next build' : 'next dev';
     // spawn(cmd, { stdio: 'inherit', shell: true });
  
  } catch (error) {
      console.error("❌ Failed to decrypt environment:", error.message);
      process.exit(1);
  }


}
async function remoteFetch(NIFTY_URL , FALLBACK_CSV ) {

   
    let rawData = [];

    try {
      // Step 1: Attempt Live Fetch
      console.log('📡 Attempting NSE Live Fetch...');
        
        // NSE requires a User-Agent header or it will hang/block
        const response = await fetch(NIFTY_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            },
            timeout: 5000 // Stop waiting after 5 seconds
        });

        if (!response.ok) throw new Error(`NSE Status: ${response.status}`);
        
        const json = await response.json();
        return json.data; // CRITICAL: You must return the data!


     /* console.warn('MARKET-SYNC:: Live fetch failed, starting.', NIFTY_URL);
      const response = await fetch(NIFTY_URL);
      if (!response.ok) throw new Error('NSE Live Fetch Blocked/Failed');
      const json = await response.json();
      rawData = json.data; */
    } catch (fetchErr) {
    /*  console.warn('MARKET-SYNC:: Live fetch failed, trying CSV fallback...', fetchErr.message);
      const csvPath = path.join(process.cwd(), 'public', 'assets'+ FALLBACK_CSV );
      console.log("csvPath ::: "+csvPath)
      // Step 2: Fallback to CSV
      const csvResponse = await fetch(FALLBACK_CSV);
      const csvText = await csvResponse.text();
      rawData = parseCSV(csvText); */
      console.warn('⚠️ Live fetch failed, pivoting to local CSV fallback...');
        
      // Use fs instead of fetch for local files
      const csvPath = path.join(process.cwd(), 'public', 'assets', FALLBACK_CSV);
      console.log("📂 Reading local fallback from:", csvPath);
      
      if (fs.existsSync(csvPath)) {
          const csvText = fs.readFileSync(csvPath, 'utf8');
          return parseCSV(csvText); // Return the parsed CSV data
      } else {
          throw new Error(`Fallback file not found at ${csvPath}`);
      }


    }
}




async function syncNifty(supabase) {
  console.log('🏗️ Build Phase: Starting Market Data Sync...');
  const NIFTY_URL = 'https://www.nseindia.com/api/live-analysis-variations?index=gainers'; // Note: NSE often blocks direct CORS
  const FALLBACK_CSV = '/top_gainers_nifty50.csv';
  try {
    let rawData = [];
    // 1. Try Live Fetch (NSE API or your source)
     rawData =await  remoteFetch( NIFTY_URL, FALLBACK_CSV);
    
     if ( rawData === undefined || rawData !== null  || (Array.isArray(rawData) && rawData.length ==0 )){
        console.warn('MARKET-SYNC:: fetch 2nd time from public, trying CSV fallback...');
        // 2. Fallback to Local CSV if needed
      const csvPath = path.join(process.cwd(), 'public', 'assets/top_gainers_nifty50.csv');
      console.log("csvPath ::: "+csvPath)
      const csvData = fs.readFileSync(csvPath, 'utf8');
      rawData = parseCSV(csvData);

     }
  





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
    /*const { error } = await supabase
      .from('top_gainers_nifty50')
      .upsert(mappedDataInter, { onConflict: 'stckname' });
    */
    // --- UPDATED STEP 3: CLEAR OLD DATA & INSERT NEW ---
    console.log("🧹 Clearing old market data from Supabase...");

    // 1. Delete all existing rows
    // We use .neq('stckname', '0') or .gt('id', 0) as a "match all" filter
    const { error: deleteError } = await supabase
      .from('top_gainers_nifty50')
      .delete()
      .neq('stckname', ''); // This selects every row where stckname isn't empty

    if (deleteError) {
      console.error("❌ Failed to clear old data:", deleteError.message);
      throw deleteError;
    }

    console.log("📤 Inserting fresh Top Gainers...");

    // 2. Perform a fresh Insert
    const { error: insertError } = await supabase
      .from('top_gainers_nifty50')
      .insert(mappedDataInter);

    if (insertError) {
      console.error("❌ Failed to insert fresh data:", insertError.message);
      throw insertError;
    }

    console.log(`✅ Success: Table truncated and ${mappedDataInter.length} new records added.`);




     mappedData = mappedDataInter;

     // if (error) throw error;






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


decryptenv();
