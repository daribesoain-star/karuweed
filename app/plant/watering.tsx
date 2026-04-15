import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { WateringLog, WateringType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const typeConfig: Record<WateringType, { emoji: string; label: string; color: string }> = {
  water: { emoji: '💧', label: 'Agua', color: '#3B82F6' },
  feed: { emoji: '🧪', label: 'Nutrientes', color: '#22C55E' },
  foliar: { emoji: '🍃', label: 'Foliar', color: '#86EFAC' },
  flush: { emoji: '🚿', label: 'Flush', color: '#C47A2C' },
};

export default function WateringScreen() {
  const { plantId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getPlantById } = usePlantStore();
  const plant = getPlantById(plantId as string);

  const [logs, setLogs] = useState<WateringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [type, setType] = useState<WateringType>('water');
  const [amountMl, setAmountMl] = useState('');
  const [phLevel, setPhLevel] = useState('');
  const [ecLevel, setEcLevel] = useState('');
  const [notes, setNotes] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!plantId) return;
    try {
      const { data, error } = await supabase
        .from('watering_logs')
        .select('*')
        .eq('plant_id', plantId)
        .order('date', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs((data || []) as WateringLog[]);
    } catch (err) {
      console.error('Error fetching watering logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const resetForm = () => {
    setType('water');
    setAmountMl('');
    setPhLevel('');
    setEcLevel('');
    setNotes('');
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!user || !plantId) return;
    setSaving(true);
    try {
      const entry: Record<string, unknown> = {
        plant_id: plantId,
        user_id: user.id,
        type,
        date: new Date().toISOString(),
      };
      if (amountMl) entry.amount_ml = parseInt(amountMl, 10);
      if (phLevel) entry.ph_level = parseFloat(phLevel);
      if (ecLevel) entry.ec_level = parseFloat(ecLevel);
      if (notes.trim()) entry.notes = notes.trim();

      const { error } = await supabase.from('watering_logs').insert(entry);
      if (error) throw error;

      resetForm();
      await fetchLogs();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert('Eliminar registro', 'Seguro?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('watering_logs').delete().eq('id', logId);
          setLogs((prev) => prev.filter((l) => l.id !== logId));
        },
      },
    ]);
  };

  // Stats
  const lastWatering = logs.find((l) => l.type === 'water');
  const lastFeed = logs.find((l) => l.type === 'feed');
  const wateringsThisWeek = logs.filter((l) => {
    const d = new Date(l.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} progressBackgroundColor="#1A1A2E" />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
            Riego {plant ? `- ${plant.name}` : ''}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#1A2A4E', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3B82F640' }}>
            <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Ultimo riego</Text>
            <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '700', marginTop: 4 }}>
              {lastWatering ? formatDistanceToNow(new Date(lastWatering.date), { locale: es, addSuffix: false }) : 'N/A'}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#0B3D2E', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#22C55E40' }}>
            <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Ultimo feed</Text>
            <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '700', marginTop: 4 }}>
              {lastFeed ? formatDistanceToNow(new Date(lastFeed.date), { locale: es, addSuffix: false }) : 'N/A'}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3A3A4E' }}>
            <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Esta semana</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 4 }}>{wateringsThisWeek} riegos</Text>
          </View>
        </View>

        {/* Quick Add Button */}
        {!showForm && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>💧</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Registrar riego</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form */}
        {showForm && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#3B82F640' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>Nuevo registro</Text>

              {/* Type selector */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {(Object.keys(typeConfig) as WateringType[]).map((t) => {
                  const cfg = typeConfig[t];
                  const active = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      style={{
                        flex: 1,
                        backgroundColor: active ? cfg.color + '20' : '#0A0A0A',
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: active ? cfg.color + '60' : '#3A3A4E',
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                      <Text style={{ color: active ? cfg.color : '#A0A0A0', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount, pH, EC */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 11, marginBottom: 4 }}>Cantidad (ml)</Text>
                  <TextInput
                    value={amountMl}
                    onChangeText={setAmountMl}
                    keyboardType="numeric"
                    placeholder="500"
                    placeholderTextColor="#666"
                    style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#3A3A4E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFFFFF', fontSize: 15 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 11, marginBottom: 4 }}>pH</Text>
                  <TextInput
                    value={phLevel}
                    onChangeText={setPhLevel}
                    keyboardType="decimal-pad"
                    placeholder="6.2"
                    placeholderTextColor="#666"
                    style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#3A3A4E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFFFFF', fontSize: 15 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#A0A0A0', fontSize: 11, marginBottom: 4 }}>EC</Text>
                  <TextInput
                    value={ecLevel}
                    onChangeText={setEcLevel}
                    keyboardType="decimal-pad"
                    placeholder="1.2"
                    placeholderTextColor="#666"
                    style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#3A3A4E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFFFFF', fontSize: 15 }}
                  />
                </View>
              </View>

              {/* Notes */}
              <Text style={{ color: '#A0A0A0', fontSize: 11, marginBottom: 4 }}>Notas (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Agua con CalMag..."
                placeholderTextColor="#666"
                multiline
                style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#3A3A4E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFFFFF', fontSize: 14, minHeight: 60, textAlignVertical: 'top', marginBottom: 16 }}
              />

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={resetForm}
                  style={{ flex: 1, backgroundColor: '#3A3A4E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{ flex: 2, backgroundColor: saving ? '#666' : '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                    {saving ? 'Guardando...' : `Guardar ${typeConfig[type].label}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Log History */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Historial ({logs.length})
          </Text>

          {isLoading ? (
            <Text style={{ color: '#A0A0A0', textAlign: 'center', paddingVertical: 20 }}>Cargando...</Text>
          ) : logs.length === 0 ? (
            <View style={{ backgroundColor: '#1A1A2E', borderRadius: 12, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💧</Text>
              <Text style={{ color: '#A0A0A0', fontSize: 14, textAlign: 'center' }}>Sin registros de riego aun</Text>
            </View>
          ) : (
            logs.map((log) => {
              const cfg = typeConfig[log.type] || typeConfig.water;
              const timeAgo = formatDistanceToNow(new Date(log.date), { addSuffix: true, locale: es });
              return (
                <TouchableOpacity
                  key={log.id}
                  onLongPress={() => handleDeleteLog(log.id)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#1A1A2E',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#3A3A4E',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: cfg.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: cfg.color, fontWeight: '700', fontSize: 14 }}>{cfg.label}</Text>
                      <Text style={{ color: '#666', fontSize: 11 }}>{timeAgo}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                      {log.amount_ml != null && (
                        <Text style={{ color: '#A0A0A0', fontSize: 12 }}>{log.amount_ml}ml</Text>
                      )}
                      {log.ph_level != null && (
                        <Text style={{ color: '#A0A0A0', fontSize: 12 }}>pH {log.ph_level}</Text>
                      )}
                      {log.ec_level != null && (
                        <Text style={{ color: '#A0A0A0', fontSize: 12 }}>EC {log.ec_level}</Text>
                      )}
                    </View>
                    {log.notes && (
                      <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{log.notes}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
