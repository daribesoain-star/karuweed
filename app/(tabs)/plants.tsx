import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { Button } from '@/components/Button';
import { PlantCard } from '@/components/PlantCard';

export default function PlantsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plants, fetchPlants, isLoading } = usePlantStore();

  useEffect(() => {
    if (user) {
      fetchPlants(user.id);
    }
  }, [user]);

  const activePlants = plants.filter((p) => p.is_active);
  const inactivePlants = plants.filter((p) => !p.is_active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>
              Mis plantas
            </Text>
            <Text style={{ color: '#A0A0A0', fontSize: 14, marginTop: 4 }}>
              {plants.length} planta{plants.length !== 1 ? 's' : ''} registrada{plants.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Button
            title="Agregar"
            onPress={() => router.push('/plant/new')}
            size="small"
          />
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#A0A0A0' }}>Cargando plantas...</Text>
          </View>
        ) : plants.length === 0 ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 40,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🌿</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              No hay plantas aún
            </Text>
            <Text
              style={{
                color: '#A0A0A0',
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              Crea tu primera planta para comenzar a monitorear su crecimiento
            </Text>
            <Button
              title="Crear primera planta"
              onPress={() => router.push('/plant/new')}
              size="medium"
            />
          </View>
        ) : (
          <>
            {/* Active Plants Section */}
            {activePlants.length > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                  Activas ({activePlants.length})
                </Text>
                {activePlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onPress={() => router.push(`/plant/${plant.id}`)}
                  />
                ))}
              </View>
            )}

            {/* Inactive Plants Section */}
            {inactivePlants.length > 0 && (
              <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                  Completadas ({inactivePlants.length})
                </Text>
                {inactivePlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onPress={() => router.push(`/plant/${plant.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
