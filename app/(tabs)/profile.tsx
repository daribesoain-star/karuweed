import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { differenceInDays } from 'date-fns';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { plants } = usePlantStore();
  const [totalCheckIns, setTotalCheckIns] = useState(0);

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
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              {user?.full_name}
            </Text>
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
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: '#3A3A4E',
              }}
            >
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 4 }}>
                  Notificaciones
                </Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>
                  Gestiona alertas
                </Text>
              </View>
              <Text style={{ color: '#A0A0A0' }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
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
                  Privacidad
                </Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>
                  Datos personales
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
