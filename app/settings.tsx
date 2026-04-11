import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'karuweed_settings';

interface AppSettings {
  checkinReminder: boolean;
  checkinHour: number;
  wateringAlert: boolean;
  wateringIntervalDays: number;
  darkMode: boolean;
  measurementUnit: 'cm' | 'in';
  language: 'es' | 'en';
}

const DEFAULT_SETTINGS: AppSettings = {
  checkinReminder: true,
  checkinHour: 9,
  wateringAlert: true,
  wateringIntervalDays: 2,
  darkMode: true,
  measurementUnit: 'cm',
  language: 'es',
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SETTINGS_KEY).then((val) => {
      if (val) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(val) });
        } catch { /* use defaults */ }
      }
      setLoaded(true);
    });
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
  };

  const wateringOptions = [1, 2, 3, 5, 7];
  const hourOptions = [7, 8, 9, 10, 12, 18, 20];

  const handleChangeCheckinHour = () => {
    const buttons = hourOptions.map((h) => ({
      text: `${h}:00${h === settings.checkinHour ? ' (actual)' : ''}`,
      onPress: () => updateSetting('checkinHour', h),
    }));
    buttons.push({ text: 'Cancelar', onPress: () => {} });
    Alert.alert('Hora del recordatorio', 'Selecciona a que hora quieres el recordatorio de check-in', buttons);
  };

  const handleChangeWateringInterval = () => {
    const buttons = wateringOptions.map((d) => ({
      text: `Cada ${d} dia${d > 1 ? 's' : ''}${d === settings.wateringIntervalDays ? ' (actual)' : ''}`,
      onPress: () => updateSetting('wateringIntervalDays', d),
    }));
    buttons.push({ text: 'Cancelar', onPress: () => {} });
    Alert.alert('Frecuencia de riego', 'Cada cuantos dias riegas normalmente?', buttons);
  };

  const handleChangeUnit = () => {
    updateSetting('measurementUnit', settings.measurementUnit === 'cm' ? 'in' : 'cm');
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginLeft: 16 }}>Configuración</Text>
        </View>

        {/* Notifications */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Notificaciones
          </Text>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A4E', overflow: 'hidden' }}>
            {/* Check-in reminder toggle */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#3A3A4E' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>Recordatorio de check-in</Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Recibe una alerta diaria para revisar tus plantas</Text>
              </View>
              <Switch
                value={settings.checkinReminder}
                onValueChange={(v) => updateSetting('checkinReminder', v)}
                trackColor={{ false: '#3A3A4E', true: '#22C55E60' }}
                thumbColor={settings.checkinReminder ? '#22C55E' : '#A0A0A0'}
              />
            </View>

            {/* Check-in hour */}
            {settings.checkinReminder && (
              <TouchableOpacity
                onPress={handleChangeCheckinHour}
                style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#3A3A4E' }}
              >
                <View>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>Hora del recordatorio</Text>
                  <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Hora a la que recibes la alerta</Text>
                </View>
                <View style={{ backgroundColor: '#22C55E20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>{settings.checkinHour}:00</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Watering alert toggle */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#3A3A4E' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>Alerta de riego</Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Te recuerda cuando regar tus plantas</Text>
              </View>
              <Switch
                value={settings.wateringAlert}
                onValueChange={(v) => updateSetting('wateringAlert', v)}
                trackColor={{ false: '#3A3A4E', true: '#3B82F660' }}
                thumbColor={settings.wateringAlert ? '#3B82F6' : '#A0A0A0'}
              />
            </View>

            {/* Watering interval */}
            {settings.wateringAlert && (
              <TouchableOpacity
                onPress={handleChangeWateringInterval}
                style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>Frecuencia de riego</Text>
                  <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Cada cuantos dias riegas</Text>
                </View>
                <View style={{ backgroundColor: '#3B82F620', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 14 }}>Cada {settings.wateringIntervalDays}d</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#C47A2C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Preferencias
          </Text>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A4E', overflow: 'hidden' }}>
            {/* Measurement unit */}
            <TouchableOpacity
              onPress={handleChangeUnit}
              style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>Unidad de medida</Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Para altura de plantas</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={{
                  backgroundColor: settings.measurementUnit === 'cm' ? '#C47A2C30' : '#1A1A2E',
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: settings.measurementUnit === 'cm' ? '#C47A2C' : '#3A3A4E',
                }}>
                  <Text style={{ color: settings.measurementUnit === 'cm' ? '#C47A2C' : '#A0A0A0', fontWeight: '600', fontSize: 13 }}>cm</Text>
                </View>
                <View style={{
                  backgroundColor: settings.measurementUnit === 'in' ? '#C47A2C30' : '#1A1A2E',
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: settings.measurementUnit === 'in' ? '#C47A2C' : '#3A3A4E',
                }}>
                  <Text style={{ color: settings.measurementUnit === 'in' ? '#C47A2C' : '#A0A0A0', fontWeight: '600', fontSize: 13 }}>in</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Privacidad
          </Text>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A4E', overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 4 }}>Tus datos</Text>
              <Text style={{ color: '#A0A0A0', fontSize: 12, lineHeight: 18 }}>
                Tus fotos y datos se almacenan de forma segura en Supabase. Las imagenes se analizan con IA pero no se comparten con terceros. Puedes eliminar tu cuenta y todos tus datos en cualquier momento.
              </Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#3A3A4E' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Version</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>1.0.0</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Motor IA</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Claude Vision</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Backend</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Supabase</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
