import { createClient } from '@supabase/supabase-js';
import { StockDataResponse, TopGainerLoserData } from '../../datamodels/topgainerloser_model';
import { useNifty50Gainers } from '@/hooks/use-nifty50gainers'; // Import your store
import { useCallback } from 'react';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * PURE UTILITY: Fetches from DB and transforms
 */
export async function fetchTopGainersData(category: string): Promise<StockDataResponse> {
  try {
    let tableName: string;
    
    // Select appropriate table based on category
    switch (category.toLowerCase()) {
      case 'all':
        tableName = 'top_gainers_all';
        break;
      case 'nifty50':
        tableName = 'top_gainers_nifty50';
        break;
      case 'nifty200':
        tableName = 'top_gainers_nifty200';
        break;
      default:
        throw new Error('Invalid category specified');
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('pcnt', { ascending: false });

    if (error) throw error;

    const transformedData = data.map((record: TopGainerLoserData) => ({
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
    return { data: transformedData, error: null };
    
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error occurred') 
    };
  }
}

/**
 * RECOMPOSABLE HOOK: Uses Zustand Local Storage first, then Supabase
 */
export function useTopGainers(category: string) {
  const { data: storedData, setGainers, setLoading, setError, isLoading, error } = useNifty50Gainers();

  const refreshData = useCallback(async () => {
    // Only handle Nifty50 for the Zustand store as per your requirement nifty50
    if (category.toLowerCase() !== 'top_gainers_nifty50') {
      return await fetchTopGainersData(category);
    }

    setLoading(true);
    const result = await fetchTopGainersData(category);

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setGainers(result.data);
    }
    setLoading(false);
    return result;
  }, [category, setGainers, setLoading, setError]);
  const newErr = { error }
  const rtObj =  {
    // If it's nifty50, return storedData immediately (from Local Storage), 
    // otherwise it returns null until refreshed.
    data: category.toLowerCase() === 'top_gainers_nifty50' ? storedData : null,
    isLoading,
    error :newErr instanceof Error ? newErr : new Error(error!) ,
    refreshData
  };
  return rtObj;
}
