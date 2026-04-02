import { useEffect } from 'react';

export function useNiftySync(onDataReceived) {
  useEffect(() => {
    if (window.Worker) {
      const syncWorker = new Worker('/gainers-worker.js', { type: 'module' });

        // 2. Pick the key (Check Service Role first, then Anon Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                    process.env.SUPABASE_ANON_KEY; 

      // Pass credentials to the worker
      syncWorker.postMessage({
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey
      });

      /*syncWorker.onmessage = (e) => {
        if (e.data.status === 'success') {
          console.log(`🚀 Market Sync Complete: ${e.data.count} stocks updated.`);
        } else {
          console.error('❌ Market Sync Failed:', e.data.message);
        }
      };*/
      syncWorker.onmessage = (e) => {
        if (e.data.status === 'success') {
          console.log(`🚀 Market Sync Complete: ${e.data.count} stocks updated.`);
          
          // 🔥 Trigger the Zustand update with the payload from the worker
          if (onDataReceived && e.data.payload) {
            onDataReceived(e.data.payload);
          }
        } else {
          console.error('❌ Market Sync Failed:', e.data.message);
        }
      };


      return () => syncWorker.terminate();
    }
  }, [onDataReceived]);
}