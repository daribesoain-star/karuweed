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

interface StrainInfo {
  thc_range: string;
  cbd_range: string;
  flowering_days_min: number;
  flowering_days_max: number;
  difficulty: string;
  yield_indoor: string;
  description: string;
}

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPlantById, updatePlant, deletePlant } = usePlantStore();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [strainInfo, setStrainInfo] = useState<StrainInfo | null>(null);

  const plant = getPlantById(id as string);

  useEffect(() => {
    if (plant) {
      fetchCheckIns();
      fetchStrainInfo();
    }
  }, [plant?.id]);

  const fetchStrainInfo = async () => {
    if (!plant) return;
    try {
      const { data } = await supabase
        .from('strains')
        .select('thc_range, cbd_range, flowering_days_min, flowering_days_max, difficulty, yield_indoor, description')
        .ilike('name', plant.strain)
        .limit(1)
        .single();
      if (data) setStrainInfo(data as StrainInfo);
    } catch {
      // Strain not found in DB, that's OK
    }
  };

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

        {/* Strain Info Card */}
        {strainInfo && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Sobre la variedad
            </Text>
            <View style={{
              backgroundColor: '#0B3D2E',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#22C55E40',
            }}>
              <Text style={{ color: '#D1FAE5', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
                {strainInfo.description}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 10 }}>THC</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{strainInfo.thc_range}</Text>
                </View>
                <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 10 }}>CBD</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{strainInfo.cbd_range}</Text>
                </View>
                <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Floración</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{strainInfo.flowering_days_min}-{strainInfo.flowering_days_max}d</Text>
                </View>
                <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Rendimiento</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{strainInfo.yield_indoor}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Height Progress Chart */}
        {checkIns.length > 1 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Crecimiento
            </Text>
            <View style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#3A3A4E',
            }}>
              {(() => {
                const heights = checkIns
                  .filter(c => c.height_cm != null)
                  .reverse()
                  .slice(-7);
                if (heights.length < 2) return (
                  <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Se necesitan al menos 2 check-ins con altura</Text>
                );
                const maxH = Math.max(...heights.map(c => c.height_cm!));
                const chartHeight = 100;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: chartHeight + 20 }}>
                    {heights.map((c, i) => {
                      const barH = maxH > 0 ? (c.height_cm! / maxH) * chartHeight : 0;
                      const date = new Date(c.date);
                      return (
                        <View key={c.id} style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '600', marginBottom: 4 }}>
                            {c.height_cm}
                          </Text>
                          <View style={{
                            width: 20,
                            height: Math.max(barH, 4),
                            backgroundColor: '#22C55E',
                            borderRadius: 4,
                          }} />
                          <Text style={{ color: '#A0A0A0', fontSize: 9, marginTop: 4 }}>
                            {date.getDate()}/{date.getMonth() + 1}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </View>
          </View>
        )}

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
