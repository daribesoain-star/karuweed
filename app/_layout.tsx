import React, { useEffect, useState } from 'react';
import { Slot, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

function AppContent() {
  const { user, isLoading, fetchUser } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    fetchUser();
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

  if (!user && !inAuthGroup) {
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
