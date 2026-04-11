import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { differenceInDays } from 'date-fns';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { plants } = usePlantStore();
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || '');

  useEffect(() => {
    if (user && plants.length > 0) {
      const plantIds = plants.map(p => p.id);
      supabase
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .in('plant_id', plantIds)
        .then(({ count }) => {
          if (count != null) setTotalCheckIns(count);
        });
    }
  }, [user, plants]);

  const activePlants = plants.filter(p => p.is_active);
  const completedPlants = plants.filter(p => !p.is_active);
  const memberSince = user?.created_at
    ? differenceInDays(new Date(), new Date(user.created_at))
    : 0;

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacio');
      return;
    }
    try {
      await supabase.from('profiles').update({ full_name: nameValue.trim() }).eq('id', user!.id);
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, full_name: nameValue.trim() } : null,
      }));
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation handled by _layout.tsx auth guard
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const subscriptionTiers: Record<string, string> = {
    free: 'Gratuito',
    pro: 'Pro',
    premium: 'Premium',
  };

  const subscriptionColors: Record<string, string> = {
    free: '#A0A0A0',
    pro: '#22C55E',
    premium: '#C47A2C',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>
            Perfil
          </Text>
        </View>

        {/* User Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: '#3A3A4E',
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#0B3D2E',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 40 }}>👤</Text>
            </View>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                <TextInput
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
                  style={{
                    flex: 1,
                    backgroundColor: '#0A0A0A',
                    borderWidth: 1,
                    borderColor: '#22C55E',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                  }}
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName} style={{ backgroundColor: '#22C55E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNameValue(user?.full_name || ''); }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 13 }}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                  {user?.full_name || 'Sin nombre'}
                </Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>editar</Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: '#A0A0A0', fontSize: 14, marginBottom: 16 }}>
              {user?.email}
            </Text>
            <View
              style={{
                backgroundColor: subscriptionColors[user?.subscription_tier || 'free'] + '20',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  color: subscriptionColors[user?.subscription_tier || 'free'],
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {subscriptionTiers[user?.subscription_tier || 'free']}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Estadísticas
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#0B3D2E', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#22C55E40' }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Activas</Text>
              <Text style={{ color: '#22C55E', fontSize: 22, fontWeight: '700' }}>{activePlants.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#3A3A4E' }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Completadas</Text>
              <Text style={{ color: '#86EFAC', fontSize: 22, fontWeight: '700' }}>{completedPlants.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#3A3A4E' }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Check-ins</Text>
              <Text style={{ color: '#C47A2C', fontSize: 22, fontWeight: '700' }}>{totalCheckIns}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#3A3A4E' }}>
            <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Miembro desde hace</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{memberSince} días</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Configuración
          </Text>

          <View
            style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#3A3A4E',
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 4 }}>
                  Notificaciones y preferencias
                </Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>
                  Alertas, riego, unidades
                </Text>
              </View>
              <Text style={{ color: '#A0A0A0' }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Acerca de
          </Text>

          <View
            style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#3A3A4E',
              padding: 16,
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                Versión de app
              </Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                1.0.0
              </Text>
            </View>

            <View>
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                Pais
              </Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {user?.country_code}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 16 }}>
          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="secondary"
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
