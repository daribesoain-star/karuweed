import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Button } from 'A/components/Button';
import { Input } from 'A/components/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      // Error is already set in the store with Spanish translation
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo area */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🌿</Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            KaruWeed
          </Text>
          <Text style={{ fontSize: 16, color: '#A0A0A0' }}>
            Tu compañero de cultivo de cannabis
          </Text>
        </View>

        {/* Error display */}
        {(localError || error) && (
          <View style={{
            backgroundColor: '#EF4444' + '20',
            borderWidth: 1,
            borderColor: '#EF4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}>
            <Text style={{ color: '#FCA5A5', fontSize: 14 }}>
              {localError || error}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={{ marginBottom: 16 }}>
          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={{ marginBottom: 16 }}
          />
          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
            containerStyle={{ marginBottom: 8 }}
          />
        </View>

        {/* Forgot password link */}
        <TouchableOpacity
          onPress={() => { clearError(); router.push('/(auth)/forgot-password'); }}
          style={{ alignSelf: 'flex-end', marginBottom: 24, padding: 4 }}
        >
          <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '500' }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

        <Button
          title={isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          onPress={handleLogin}
          disabled={isLoading}
          loading={isLoading}
          size="large"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#A0A0A0', fontSize: 14 }}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => { clearError(); router.push('/(auth)/register'); }}>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
