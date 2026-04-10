import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

// Hardcoded: anon key is designed to be public (RLS protects data)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ymvnflwcxwgsyhramhex.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltdm5mbHdjeHdnc3locmFtaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTgwMDcsImV4cCI6MjA5MDc5NDAwN30.o-4U-sTTDXxKHtU23RkgWX6ctizVRAo1GGX6RDzxKCM';

class SecureStoreAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  }
}

const secureStore = new SecureStoreAdapter();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStore as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle app state changes for token refresh
let appState = 'active';

const subscription = AppState.addEventListener('change', async (state) => {
  if (appState === 'inactive' && state === 'active') {
    // App has come to foreground
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase.auth.refreshSession();
    }
  } else if (appState === 'active' && state.match(/inactive|background/)) {
    // App has gone to background
  }
  appState = state;
});

export const cleanupAppState = () => {
  subscription?.remove();
};
