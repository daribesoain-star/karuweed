import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setLocalError('');
    clearError();

    if (!email) {
      setLocalError('Ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Ingresa un correo electrónico válido');
      return;
    }

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Error is already set in the store
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>📧</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 }}>
            Revisa tu correo
          </Text>
          <Text style={{ fontSize: 15, color: '#A0A0A0', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Enviamos un link para restablecer tu contraseña a {email}. Revisa tu bandeja de entrada y carpeta de spam.
          </Text>
          <Button
            title="Volver al login"
            onPress={() => router.replace('/(auth)/login')}
            size="large"
          />
          <TouchableOpacity
            onPress={() => { setSent(false); setLocalError(''); clearError(); }}
            style={{ marginTop: 20, padding: 8 }}
          >
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>
              ¿No recibiste el email? Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 16, left: 0, padding: 8 }}
        >
          <Text style={{ color: '#22C55E', fontSize: 16 }}>← Volver</Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            Recuperar contraseña
          </Text>
          <Text style={{ fontSize: 15, color: '#A0A0A0', lineHeight: 22 }}>
            Ingresa el email con el que te registraste y te enviaremos un link para crear una nueva contraseña.
          </Text>
        </View>

        {(localError || error) && (
          <View style={{
            backgroundColor: '#EF4444' + '20',
            borderWidth: 1,
            borderColor: '#EF4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}>
            <Text style={{ color: '#FCA5A5', fontSize: 14 }}>{localError || error}</Text>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Button
          title={isLoading ? 'Enviando...' : 'Enviar link de recuperación'}
          onPress={handleReset}
          disabled={isLoading}
          loading={isLoading}
          size="large"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#A0A0A0', fontSize: 14 }}>¿Recordaste tu contraseña? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
