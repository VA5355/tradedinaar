// app/components/MarketSync.tsx
'use client'; // This is mandatory for Hooks

import { useNiftySync } from '@/hooks/nifty50gainers'; // Adjust path as needed\
import { TopGainerLoserData } from '../datamodels/topgainerloser_model';
import { useEffect , useCallback} from 'react';
//import { supabase } from '@/utils/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useNifty50Gainers } from '@/hooks/use-nifty50gainers';
import { useFirebaseAuth } from "@/utils/firebaseAuthContext";
import JSXStyle from 'styled-jsx/style';

export let gainersData: TopGainerLoserData[] ;
export default function MarketSync() {
// Inside your data fetching function
const { firebaseUser } = useFirebaseAuth();

  // This triggers the useEffect inside your hook
  const {  data  , setGainers, setLoading, setError } = useNifty50Gainers();
  const localDaata = data;
  // Create  memoized callback to handle data from the worker
  const handleWorkerData = useCallback((data: TopGainerLoserData[]) => {
    console.log(' data reom handleWorker Data '+JSON.stringify(data))
    setGainers(data);
  }, [setGainers]);


 // 1. Trigger the Background Worker Sync (CSV -> Supabase -> Zustand)
 useNiftySync(handleWorkerData);


       // 2. Pick the key (Check Service Role first, then Anon Key)
//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
//                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
//                    process.env.SUPABASE_ANON_KEY; 


  //const supabase = createClient(supabaseUrl!, supabaseKey!);

  const mappedData : TopGainerLoserData[] = [].map((record: TopGainerLoserData) => ({
    stckname: record.stckname,
    close: record.close,
    open: record.open,
    high: record.high,
    low: record.low,
    vol: record.vol,
    vol2: record.vol2,
    vol3: record.vol3,
    vol4: record.vol4,
    vol5: record.vol5,
    pcnt: record.pcnt,
    sec: record.sec,
    pc: record.pc,
    pc2: record.pc2,
    pc3: record.pc3,
    pc4: record.pc4,
    pc5: record.pc5,
    pc6: record.pc6,
    pc7: record.pc7,
    fname: record.fname,
    max52: record.max52,
    min52: record.min52
  }));
   gainersData = mappedData

   // 2. Optional: Initial Fetch from Supabase on load 
  // (In case the worker hasn't run yet or failed)
   useEffect(() => {
    console.log("insode Market Sync useEffect ")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    async function syncToZustand() {
      setLoading(true);
      try {
        if(!firebaseUser) { 
            console.log(" firebaseuser not present fetch from localstorage ")
            console.log('local storage nifty50gainers '+JSON.stringify(localDaata));

        } //return; // DON'T fetch if the token isn't ready yet!
        const { data, error } = await supabase
          .from('top_gainers_nifty50')
          .select('*');

        if (error) throw error;

        if (data) {
          setGainers(data as TopGainerLoserData[]); // Cast to your TopGainerLoserData type
        }
        
      } catch (err) {
       // @ts-expect-error type can be any
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    syncToZustand();
  }, [setGainers, setLoading, setError]);



  // This component renders nothing visually
  return null;
}