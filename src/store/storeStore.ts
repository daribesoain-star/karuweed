import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Store } from '../lib/types';

interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  isLoading: boolean;
  error: string | null;
  fetchStores: (countryCode?: string) => Promise<void>;
  fetchNearbyStores: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  selectStore: (store: Store | null) => void;
  clearError: () => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  selectedStore: null,
  isLoading: false,
  error: null,

  fetchStores: async (countryCode?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('stores').select('*').order('name');
      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }
      const { data, error } = await query;
      if (error) throw error;
      set({ stores: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchNearbyStores: async (lat: number, lng: number, radiusKm = 50) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all stores then filter by distance client-side
      // (Supabase doesn't have PostGIS by default, so we calculate haversine)
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;

      const nearby = (data || [])
        .map((store) => ({
          ...store,
          distance: haversineDistance(lat, lng, store.latitude, store.longitude),
        }))
        .filter((store) => store.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      set({ stores: nearby, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectStore: (store) => set({ selectedStore: store }),
  clearError: () => set({ error: null }),
}));

// Haversine formula for distance between two coordinates in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
