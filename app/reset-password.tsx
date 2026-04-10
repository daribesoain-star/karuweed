import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // The root _layout.tsx already called setSession() with the deep link tokens.
    // We listen for PASSWORD_RECOVERY event or check if session exists.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
      }
    });

    // Session may already be set by the time this mounts
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    setError('');

    if (!password) {
      setError('Ingresa tu nueva contraseña');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar contraseña';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>✅</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 }}>
            Contraseña actualizada
          </Text>
          <Text style={{ fontSize: 15, color: '#A0A0A0', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Tu contraseña fue cambiada exitosamente.
          </Text>
          <Button
            title="Ir al inicio"
            onPress={() => router.replace('/(tabs)')}
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>🔐</Text>
          <Text style={{ fontSize: 18, color: '#A0A0A0', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
            Verificando enlace de recuperación...
          </Text>
          <Button
            title="Volver al login"
            onPress={() => router.replace('/(auth)/login')}
            variant="secondary"
            size="medium"
          />
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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔐</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            Nueva contraseña
          </Text>
          <Text style={{ fontSize: 15, color: '#A0A0A0', lineHeight: 22 }}>
            Ingresa tu nueva contraseña para tu cuenta de KaruWeed.
          </Text>
        </View>

        {error ? (
          <View style={{
            backgroundColor: '#EF444420',
            borderWidth: 1,
            borderColor: '#EF4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}>
            <Text style={{ color: '#FCA5A5', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 16 }}>
          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Button
          title={isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          onPress={handleUpdate}
          disabled={isLoading}
          loading={isLoading}
          size="large"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>
              Volver al login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
