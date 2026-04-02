// gainers-worker.js
import { createClient } from '@supabase/supabase-js';

// Worker state
const NIFTY_URL = 'https://www.nseindia.com/api/live-analysis-variations?index=gainers'; // Note: NSE often blocks direct CORS
const FALLBACK_CSV = '/top_gainers_nifty50.csv';

self.onmessage = async (e) => {
  const { supabaseUrl, supabaseKey } = e.data;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Worker: Starting Nifty 50 Sync...');

  try {
    let rawData = [];

    try {
      // Step 1: Attempt Live Fetch
      const response = await fetch(NIFTY_URL);
      if (!response.ok) throw new Error('NSE Live Fetch Blocked/Failed');
      const json = await response.json();
      rawData = json.data; 
    } catch (fetchErr) {
      console.warn('Worker: Live fetch failed, trying CSV fallback...', fetchErr.message);
      
      // Step 2: Fallback to CSV
      const csvResponse = await fetch(FALLBACK_CSV);
      const csvText = await csvResponse.text();
      rawData = parseCSV(csvText);
    }

    // Step 3: Map to Supabase Schema
    const mappedData = rawData.map(item => ({
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
      .upsert(mappedData, { onConflict: 'stckname' });

    if (error) throw error;

    //self.postMessage({ status: 'success', count: mappedData.length });
    // 🔥 ADD THIS: Send the mapped data back to the main thread
    self.postMessage({ 
      status: 'success', 
      count: mappedData.length,
      payload: mappedData // This is your TopGainerLoserData[]
    });


  } catch (err) {
    self.postMessage({ status: 'error', message: err.message });
  }
};

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