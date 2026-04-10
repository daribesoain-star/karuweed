import React, { useEffect } from 'react';
import { Slot, Redirect, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';

function AppContent() {
  const { user, isLoading, fetchUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  // Handle deep links for Supabase Auth (password reset, email confirmation)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // Supabase sends tokens in the URL fragment or query params
      // e.g. karuweed://reset-password#access_token=...&refresh_token=...&type=recovery
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && refreshToken) {
        // Set the session from the deep link tokens
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (type === 'recovery') {
          router.replace('/reset-password');
        }
      }
    };

    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URLs while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" backgroundColor="#0A0A0A" />
        <Text style={{ fontSize: 48, marginBottom: 8 }}>🌿</Text>
        <Text style={{ color: '#22C55E', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>
          KaruWeed
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, marginBottom: 24 }}>
          Tu cultivo, guiado por inteligencia
        </Text>
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inResetPassword = segments[0] === 'reset-password';

  if (!user && !inAuthGroup && !inResetPassword) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <Slot />
    </>
  );
}

// Error boundary to prevent crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <StatusBar style="light" backgroundColor="#0A0A0A" />
          <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
            KaruWeed
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
            Algo salió mal. Reinicia la app.
          </Text>
          <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
            {this.state.error?.message || 'Error desconocido'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
