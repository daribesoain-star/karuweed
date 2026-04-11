import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('CL');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [localError, setLocalError] = useState('');

  const countries = [
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'ES', name: 'España', flag: '🇪🇸' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  ];

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!email || !password || !confirmPassword || !fullName) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Ingresa un correo electrónico válido');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await signUp(email, password, fullName, countryCode);

      // If we get here without error, signup succeeded
      // Check if user was auto-logged-in (no email confirmation required)
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        // Email confirmation required
        Alert.alert(
          'Revisa tu correo',
          `Enviamos un link de confirmación a ${email}. Revisa tu bandeja de entrada y spam.`,
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
      // If user is set, _layout.tsx will auto-redirect to (tabs)
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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            Crear Cuenta
          </Text>
          <Text style={{ fontSize: 16, color: '#A0A0A0' }}>
            Únete a la comunidad KaruWeed
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
            <Text style={{ color: '#FCA5A5', fontSize: 14 }}>
              {localError || error}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Input
            label="Nombre completo"
            placeholder="Tu nombre"
            value={fullName}
            onChangeText={setFullName}
            editable={!isLoading}
            containerStyle={{ marginBottom: 16 }}
          />
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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
            containerStyle={{ marginBottom: 16 }}
          />
          <Input
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            secureTextEntry
            containerStyle={{ marginBottom: 16 }}
          />

          {/* Country Selector */}
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              País
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(true)}
              style={{
                backgroundColor: '#1A1A2E',
                borderWidth: 1,
                borderColor: '#3A3A4E',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                {selectedCountry.flag}  {selectedCountry.name}
              </Text>
              <Text style={{ color: '#A0A0A0', fontSize: 14 }}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title={isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          onPress={handleRegister}
          disabled={isLoading}
          loading={isLoading}
          size="large"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#A0A0A0', fontSize: 14 }}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => { clearError(); router.push('/(auth)/login'); }}>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#1A1A2E',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '60%',
            paddingTop: 16,
          }}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#3A3A4E' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Selecciona tu país</Text>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCountryCode(item.code);
                    setShowCountryPicker(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: countryCode === item.code ? '#0B3D2E' : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: '#3A3A4E20',
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{item.flag}</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, flex: 1 }}>{item.name}</Text>
                  {countryCode === item.code && (
                    <Text style={{ color: '#22C55E', fontWeight: '600' }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#3A3A4E' }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 16, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
