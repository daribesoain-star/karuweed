import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { CheckInCard } from '@/components/CheckInCard';
import { StageIndicator } from '@/components/StageIndicator';
import { CheckIn } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPlantById, updatePlant, deletePlant } = usePlantStore();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const plant = getPlantById(id as string);

  useEffect(() => {
    if (plant) {
      fetchCheckIns();
    }
  }, [plant?.id]);

  const fetchCheckIns = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('plant_id', id)
        .order('date', { ascending: false });

      if (error) throw error;
      setCheckIns((data || []) as CheckIn[]);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!plant) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#A0A0A0' }}>Planta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const daysOld = differenceInDays(new Date(), parseISO(plant.start_date));
  const progressPercent = (daysOld / 100) * 100; // Assuming 100 days total growth

  const stageLabels: Record<string, string> = {
    germination: 'Germinación',
    seedling: 'Plántula',
    vegetative: 'Vegetativa',
    flowering: 'Floración',
    harvest: 'Cosecha',
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar planta',
      '¿Estás seguro de que deseas eliminar esta planta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await deletePlant(plant.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la planta');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleToggleActive = async () => {
    try {
      await updatePlant(plant.id, { is_active: !plant.is_active });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>
              ← Atrás
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plant Info Card */}
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
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
              {plant.name}
            </Text>
            <Text style={{ color: '#A0A0A0', fontSize: 16, marginBottom: 16 }}>
              {plant.strain}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#3A3A4E',
              }}
            >
              <View>
                <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                  Tipo
                </Text>
                <Text style={{ color: '#22C55E', fontWeight: '600' }}>
                  {plant.strain_type}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                  Fase
                </Text>
                <Text style={{ color: '#86EFAC', fontWeight: '600' }}>
                  {stageLabels[plant.stage]}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                  Edad
                </Text>
                <Text style={{ color: '#FFD700', fontWeight: '600' }}>
                  {daysOld} días
                </Text>
              </View>
            </View>

            {plant.notes && (
              <View>
                <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 8 }}>
                  Notas
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20 }}>
                  {plant.notes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stage Indicator */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
            Progreso
          </Text>
          <StageIndicator stage={plant.stage} progress={progressPercent} />
        </View>

        {/* Check-in Button */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Button
            title="Nuevo check-in"
            onPress={() => router.push(`/checkin/${plant.id}`)}
            size="large"
          />
        </View>

        {/* Check-ins Section */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
              Historial ({checkIns.length})
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : checkIns.length > 0 ? (
            checkIns.map((checkIn) => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                onPress={() => {
                  // Could navigate to check-in detail if needed
                }}
              />
            ))
          ) : (
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
                Sin check-ins registrados
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
