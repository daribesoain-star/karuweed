import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { CheckInCard } from '@/components/CheckInCard';
import { CheckIn, PlantStage } from '@/lib/types';
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
  const [refreshing, setRefreshing] = useState(false);
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
  const stageLabels: Record<string, string> = {
    germination: 'Germinación',
    seedling: 'Plántula',
    vegetative: 'Vegetativa',
    flowering: 'Floración',
    harvest: 'Cosecha',
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCheckIns();
    await fetchStrainInfo();
    setRefreshing(false);
  }, [plant?.id]);

  const handleShareJournal = async () => {
    const stageLabel = stageLabels[plant.stage] || plant.stage;
    let journal = `🌿 *${plant.name}* - Diario de cultivo KaruWeed\n`;
    journal += `━━━━━━━━━━━━━━━━━━━━━\n`;
    journal += `Variedad: ${plant.strain} (${plant.strain_type})\n`;
    journal += `Fase: ${stageLabel}\n`;
    journal += `Edad: ${daysOld} dias\n`;
    if (plant.notes) journal += `Notas: ${plant.notes}\n`;
    journal += `\n📊 *Resumen de ${checkIns.length} check-ins:*\n`;

    const healthScores = checkIns.filter(c => c.ai_analysis?.health_score).map(c => c.ai_analysis!.health_score);
    if (healthScores.length > 0) {
      const avg = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);
      journal += `Salud promedio: ${avg}%\n`;
    }

    const heights = checkIns.filter(c => c.height_cm != null).map(c => c.height_cm!);
    if (heights.length > 0) {
      journal += `Altura: ${Math.min(...heights)}cm → ${Math.max(...heights)}cm\n`;
    }

    // Last 3 check-ins summary
    const recent = checkIns.slice(0, 3);
    if (recent.length > 0) {
      journal += `\n📝 *Ultimos check-ins:*\n`;
      recent.forEach(c => {
        const d = new Date(c.date);
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
        const score = c.ai_analysis?.health_score ? ` (${c.ai_analysis.health_score}%)` : '';
        const height = c.height_cm != null ? ` ${c.height_cm}cm` : '';
        journal += `• ${dateStr}${score}${height}`;
        if (c.ai_analysis?.diagnosis) journal += ` - ${c.ai_analysis.diagnosis.substring(0, 60)}...`;
        journal += '\n';
      });
    }

    journal += `\n🌱 Generado con KaruWeed`;

    try {
      await Share.share({ message: journal, title: `${plant.name} - KaruWeed` });
    } catch { /* user cancelled */ }
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
    const action = plant.is_active ? 'desactivar' : 'reactivar';
    Alert.alert(
      `¿${plant.is_active ? 'Desactivar' : 'Reactivar'} planta?`,
      plant.is_active
        ? 'La planta pasará a completadas y no aparecerá en check-ins.'
        : 'La planta volverá a aparecer como activa.',
      [
        { text: 'Cancelar' },
        {
          text: plant.is_active ? 'Desactivar' : 'Reactivar',
          onPress: async () => {
            try {
              await updatePlant(plant.id, { is_active: !plant.is_active });
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          },
        },
      ]
    );
  };

  const handleChangeStage = () => {
    const stages: PlantStage[] = ['germination', 'seedling', 'vegetative', 'flowering', 'harvest'];
    const buttons = stages.map(stg => ({
      text: `${stageLabels[stg]}${stg === plant.stage ? ' (actual)' : ''}`,
      onPress: () => {
        if (stg === plant.stage) return;
        updatePlant(plant.id, { stage: stg }).catch(() => {
          Alert.alert('Error', 'No se pudo cambiar la fase');
        });
      },
    }));
    buttons.push({ text: 'Cancelar', onPress: () => {} });
    Alert.alert('Cambiar fase', 'Selecciona la nueva fase de tu planta', buttons);
  };

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
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <TouchableOpacity onPress={handleShareJournal}>
              <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '600' }}>
                Compartir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/plant/edit', params: { id: plant.id } })}>
              <Text style={{ color: '#C47A2C', fontSize: 16, fontWeight: '600' }}>
                Editar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
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

        {/* Health Trend Chart */}
        {(() => {
          const healthCheckins = checkIns
            .filter(c => c.ai_analysis && c.ai_analysis.health_score > 0)
            .reverse()
            .slice(-7);
          if (healthCheckins.length < 2) return null;
          const chartHeight = 80;
          return (
            <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                Tendencia de salud
              </Text>
              <View style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#3A3A4E',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: chartHeight + 20 }}>
                  {healthCheckins.map((c) => {
                    const score = c.ai_analysis!.health_score;
                    const barH = (score / 100) * chartHeight;
                    const color = score >= 75 ? '#22C55E' : score >= 50 ? '#C47A2C' : '#EF4444';
                    const date = new Date(c.date);
                    return (
                      <View key={c.id} style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ color, fontSize: 10, fontWeight: '600', marginBottom: 4 }}>
                          {score}%
                        </Text>
                        <View style={{
                          width: 20,
                          height: Math.max(barH, 4),
                          backgroundColor: color,
                          borderRadius: 4,
                        }} />
                        <Text style={{ color: '#A0A0A0', fontSize: 9, marginTop: 4 }}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })()}

        {/* Stage Timeline */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
            Timeline
          </Text>
          <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#3A3A4E' }}>
            {(() => {
              const stages: PlantStage[] = ['germination', 'seedling', 'vegetative', 'flowering', 'harvest'];
              const stageEmojis: Record<string, string> = {
                germination: '🌰',
                seedling: '🌱',
                vegetative: '🌿',
                flowering: '🌸',
                harvest: '✨',
              };
              const currentIdx = stages.indexOf(plant.stage);
              return stages.map((stg, i) => {
                const isCompleted = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isFuture = i > currentIdx;
                return (
                  <View key={stg} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < stages.length - 1 ? 0 : 0 }}>
                    {/* Timeline line + dot */}
                    <View style={{ alignItems: 'center', width: 32 }}>
                      <View style={{
                        width: isCurrent ? 28 : 20,
                        height: isCurrent ? 28 : 20,
                        borderRadius: 14,
                        backgroundColor: isCompleted ? '#22C55E' : isCurrent ? '#22C55E20' : '#3A3A4E',
                        borderWidth: isCurrent ? 2 : 0,
                        borderColor: '#22C55E',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: isCurrent ? 14 : 10 }}>
                          {isCompleted ? '✓' : stageEmojis[stg]}
                        </Text>
                      </View>
                      {i < stages.length - 1 && (
                        <View style={{
                          width: 2,
                          height: 24,
                          backgroundColor: isCompleted ? '#22C55E' : '#3A3A4E',
                        }} />
                      )}
                    </View>
                    {/* Label */}
                    <View style={{ marginLeft: 12, paddingBottom: i < stages.length - 1 ? 8 : 0, flex: 1 }}>
                      <Text style={{
                        color: isFuture ? '#666' : '#FFFFFF',
                        fontWeight: isCurrent ? '700' : '500',
                        fontSize: isCurrent ? 15 : 13,
                      }}>
                        {stageLabels[stg]}
                        {isCurrent ? ' (actual)' : ''}
                      </Text>
                      {isCurrent && (
                        <Text style={{ color: '#22C55E', fontSize: 11, marginTop: 2 }}>
                          Dia {daysOld} de cultivo
                        </Text>
                      )}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Button
            title="Nuevo check-in"
            onPress={() => router.push(`/checkin/${plant.id}`)}
            size="large"
          />
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/plant/watering', params: { plantId: plant.id } })}
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>💧</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Riego y nutrientes</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cambiar fase"
                onPress={handleChangeStage}
                variant="secondary"
                size="medium"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={plant.is_active ? 'Desactivar' : 'Reactivar'}
                onPress={handleToggleActive}
                variant="secondary"
                size="medium"
              />
            </View>
          </View>
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
                  router.push({
                    pathname: '/checkin/detail',
                    params: {
                      id: checkIn.id,
                      date: checkIn.date,
                      photo_url: checkIn.photo_url || '',
                      height_cm: String(checkIn.height_cm ?? 'null'),
                      notes: checkIn.notes || '',
                      ai_analysis: checkIn.ai_analysis ? JSON.stringify(checkIn.ai_analysis) : '',
                      issues: JSON.stringify(checkIn.issues || []),
                    },
                  });
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
