import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import { TopGainerLoserData } from "../datamodels/topgainerloser_model";

interface Nifty50Store {
  data: TopGainerLoserData[];
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setGainers: (gainers: TopGainerLoserData[]) => void;
  clearStore: () => void;
  setError: (error: string | null) => void;
  setLoading: (status: boolean) => void;
}

export const useNifty50Gainers = create<Nifty50Store>()(
  persist(
    (set) => ({
      data: [],
      lastUpdated: null,
      isLoading: false,
      error: null,

      setGainers: (gainers) => {
        set(
          produce((state: Nifty50Store) => {
            try {
              state.data = gainers;
              state.lastUpdated = new Date().toISOString();
              state.error = null;
              state.isLoading = false;
            } catch (err) {
              state.error = "Failed to update gainer data";
              console.error("Zustand SetGainers Error:", err);
            }
          })
        );
      },

      setError: (error) => set({ error }),
      
      setLoading: (status) => set({ isLoading: status }),

      clearStore: () => {
        set({ data: [], lastUpdated: null, error: null });
      },
    }),
    {
      name: "nifty50gainers", // This is the LocalStorage Key
      storage: createJSONStorage(() => localStorage),
      // Optional: Ensure only 'data' and 'lastUpdated' are saved, not errors or loading states
      partialize: (state) => ({ 
        data: state.data, 
        lastUpdated: state.lastUpdated 
      }),
    }
  )
);