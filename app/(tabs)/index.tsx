import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { PlantCard } from '@/components/PlantCard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plants, fetchPlants } = usePlantStore();
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchPlants(user.id);
    await fetchCheckInCount(user.id);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlants(user.id);
      // Fetch real check-in count from database
      fetchCheckInCount(user.id);
    }
  }, [user]);

  const fetchCheckInCount = async (userId: string) => {
    try {
      const plantIds = plants.map((p) => p.id);
      if (plantIds.length === 0) {
        // If plants haven't loaded yet, query all user's check-ins via plant relationship
        const { count, error } = await supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .in('plant_id',
            (await supabase.from('plants').select('id').eq('user_id', userId)).data?.map((p: any) => p.id) || []
          );
        if (!error && count !== null) setTotalCheckIns(count);
      } else {
        const { count, error } = await supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .in('plant_id', plantIds);
        if (!error && count !== null) setTotalCheckIns(count);
      }
    } catch (e) {
      console.error('Error fetching check-in count:', e);
    }
  };

  // Re-fetch check-in count when plants change
  useEffect(() => {
    if (user && plants.length > 0) {
      fetchCheckInCount(user.id);
    }
  }, [plants]);

  const activePlants = plants.filter((p) => p.is_active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22C55E"
            colors={['#22C55E']}
            progressBackgroundColor="#1A1A2E"
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
            Hola, {user?.full_name?.split(' ')[0] || 'Cultivador'}
          </Text>
          <Text style={{ fontSize: 14, color: '#A0A0A0' }}>
            Aquí está tu resumen de cultivo
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: '#0B3D2E',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#22C55E' + '40',
              }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 8 }}>
                Plantas activas
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#22C55E' }}>
                {activePlants.length}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#3A3A4E',
              }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 8 }}>
                Check-ins
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#86EFAC' }}>
                {totalCheckIns}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Nuevo Check-in"
              onPress={() => {
                if (activePlants.length === 0) {
                  Alert.alert(
                    'Sin plantas activas',
                    'Primero crea una planta para poder hacer un check-in.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Crear planta', onPress: () => router.push('/plant/new') },
                    ]
                  );
                } else if (activePlants.length === 1) {
                  router.push(`/checkin/${activePlants[0].id}`);
                } else {
                  // Multiple plants: let user choose
                  const buttons = activePlants.slice(0, 5).map(p => ({
                    text: p.name,
                    onPress: () => router.push(`/checkin/${p.id}`),
                  }));
                  buttons.push({ text: 'Cancelar', onPress: () => {} });
                  Alert.alert('¿Qué planta?', 'Selecciona la planta para el check-in', buttons);
                }
              }}
              size="medium"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Nueva Planta"
              onPress={() => router.push('/plant/new')}
              variant="secondary"
              size="medium"
            />
          </View>
        </View>

        {/* Active Plants Section */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
              Tus plantas
            </Text>
            <TouchableOpacity onPress={() => router.push('/plants')}>
              <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          {activePlants.length > 0 ? (
            <View>
              {activePlants.slice(0, 3).map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onPress={() => router.push(`/plant/${plant.id}`)}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🌱</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Sin plantas activas
              </Text>
              <Text
                style={{
                  color: '#A0A0A0',
                  fontSize: 14,
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Crea tu primera planta para comenzar a registrar su cultivo
              </Text>
              <Button
                title="Crear planta"
                onPress={() => router.push('/plant/new')}
                size="medium"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
