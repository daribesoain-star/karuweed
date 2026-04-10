import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Plant } from '@/lib/types';

interface PlantStoreState {
  plants: Plant[];
  isLoading: boolean;
  error: string | null;
  fetchPlants: (userId: string) => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'created_at'>) => Promise<Plant>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  getPlantById: (id: string) => Plant | undefined;
  clearError: () => void;
}

export const usePlantStore = create<PlantStoreState>((set, get) => ({
  plants: [],
  isLoading: false,
  error: null,

  fetchPlants: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        plants: (data || []) as Plant[],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch plants';
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  addPlant: async (plant) => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .insert(plant)
        .select()
        .single();

      if (error) throw error;

      const newPlant = data as Plant;
      set((state) => ({
        plants: [newPlant, ...state.plants],
      }));

      return newPlant;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add plant';
      set({ error: message });
      throw error;
    }
  },

  updatePlant: async (id: string, updates) => {
    try {
      const { error } = await supabase
        .from('plants')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        plants: state.plants.map((plant) =>
          plant.id === id ? { ...plant, ...updates } : plant
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update plant';
      set({ error: message });
      throw error;
    }
  },

  deletePlant: async (id: string) => {
    try {
      const { error } = await supabase.from('plants').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        plants: state.plants.filter((plant) => plant.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete plant';
      set({ error: message });
      throw error;
    }
  },

  getPlantById: (id: string) => {
    return get().plants.find((plant) => plant.id === id);
  },

  clearError: () => set({ error: null }),
}));
