'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent } from "@/components/ui/sheet"
import SparkAreaStocks from '@/components/chart/chart-stock-single'
import { useTopGainers } from '@/lib/supabaseDB/supabase_topgainers';
import { formatStockDataForChart } from '@/lib/supabaseDB/helper_formatdata';
import SparkAreaStocksLoading from '@/components/chart/chart-stock-loading';
import StockDetailSideBarPage from '@/components/custom/cust_sidebar_stockdetails';
import { useNifty50Gainers } from '@/hooks/use-nifty50gainers';

interface TopGainersSectionProps {
  selectedCategory: string;
}

export default function TopGainersSection({ selectedCategory }: TopGainersSectionProps) {
  const [stockName, setStockName] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // 1. Rename 'data' to 'topGainersData'
const { 
  data: topGainersData, 
  isLoading, 
  error, 
  refreshData 
} = useTopGainers(selectedCategory);

// 2. Rename 'data' to 'niftyData'
const { 
  data: niftyData 
} = useNifty50Gainers();

// 3. Logic: Use topGainers if it has content, otherwise fallback to niftyData
const displayData = (niftyData && niftyData.length > 0) 
  ? niftyData
  :topGainersData  ;


  useEffect(() => {
    // This triggers the fetch and updates the Zustand store automatically
    refreshData();
  }, [selectedCategory, refreshData]);

  const handleStockClick = (stock: string) => {
    setStockName(stock)
    setIsSheetOpen(true)
  }

  // Handle Loading state from the hook
  if (isLoading && (!displayData || displayData.length === 0)) {
    return (
      <div className="container mx-auto p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <SparkAreaStocksLoading key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error && (!displayData || displayData.length === 0) ) {
      
    return (
      <div className="p-4 text-red-500">
        Error: {error instanceof Error ? error.message : String(error)}
      </div>
    );
 
  }

  return (
    <div className="container mx-auto p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayData?.map((stock, index) => {
          const formattedData = formatStockDataForChart(stock);
          return (
            <div key={stock.stckname || index} onClick={() => handleStockClick(stock.stckname)} className="cursor-pointer">
              <SparkAreaStocks
                stockName={formattedData.stockName}
                symbol={formattedData.symbol}
                currentPrice={formattedData.currentPrice}
                percentageChange={formattedData.percentageChange}
                dayRange={formattedData.dayRange}
                weekRange={formattedData.weekRange}
                volume={formattedData.volume}
                smavolume4={formattedData.smavolume4}
                data={formattedData.performance.map((value, i) => ({
                  month: `Day ${i + 1}`,
                  Performance: value
                }))}
                className="max-w-xl"
              />
            </div>
          );
        })}
      </div>
        {/**  */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}  >
        <SheetContent className="w-full overflow-auto">
          <div className="mt-4">
            {/**  <StockDetailSideBarPage stockname={stockName} />*/}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}