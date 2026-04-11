import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StrainType, PlantStage } from '@/lib/types';

interface StrainInfo {
  name: string;
  type: StrainType;
  thc_range: string;
  cbd_range: string;
  flowering_days_min: number;
  flowering_days_max: number;
  difficulty: string;
  yield_indoor: string;
  description: string;
}

export default function NewPlantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addPlant, isLoading } = usePlantStore();

  const [name, setName] = useState('');
  const [strain, setStrain] = useState('');
  const [strainType, setStrainType] = useState<StrainType>('hybrid');
  const [stage, setStage] = useState<PlantStage>('seedling');
  const [startDate, setStartDate] = useState(new Date());
  const [expectedHarvest, setExpectedHarvest] = useState(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  const [notes, setNotes] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);

  // Strain autocomplete
  const [strainSuggestions, setStrainSuggestions] = useState<StrainInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState<StrainInfo | null>(null);
  const [searchingStrains, setSearchingStrains] = useState(false);

  const searchStrains = useCallback(async (query: string) => {
    if (query.length < 2) {
      setStrainSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingStrains(true);
    try {
      const { data } = await supabase
        .from('strains')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(8);
      setStrainSuggestions((data as StrainInfo[]) || []);
      setShowSuggestions(true);
    } catch {
      setStrainSuggestions([]);
    } finally {
      setSearchingStrains(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (strain && !selectedStrain) {
        searchStrains(strain);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [strain, selectedStrain, searchStrains]);

  const handleSelectStrain = (s: StrainInfo) => {
    setStrain(s.name);
    setStrainType(s.type as StrainType);
    setSelectedStrain(s);
    setShowSuggestions(false);
    // Auto-set harvest date based on flowering days
    if (s.flowering_days_max) {
      const harvest = new Date(startDate);
      harvest.setDate(harvest.getDate() + s.flowering_days_max + 30); // + veg time estimate
      setExpectedHarvest(harvest);
    }
  };

  const handleStrainTextChange = (text: string) => {
    setStrain(text);
    if (selectedStrain && text !== selectedStrain.name) {
      setSelectedStrain(null);
    }
  };

  const strainTypes: StrainType[] = ['indica', 'sativa', 'hybrid', 'auto'];
  const stages: PlantStage[] = ['germination', 'seedling', 'vegetative', 'flowering', 'harvest'];

  const stageLabels: Record<PlantStage, string> = {
    germination: 'Germinación',
    seedling: 'Plántula',
    vegetative: 'Vegetativa',
    flowering: 'Floración',
    harvest: 'Cosecha',
  };

  const handleCreate = async () => {
    if (!name || !strain) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    try {
      await addPlant({
        user_id: user.id,
        name,
        strain,
        strain_type: strainType,
        stage,
        start_date: startDate.toISOString(),
        expected_harvest: expectedHarvest.toISOString(),
        notes: notes || undefined,
        is_active: true,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la planta');
      console.error(error);
    }
  };

  const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleHarvestDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowHarvestDatePicker(Platform.OS === 'ios');
    if (selectedDate) setExpectedHarvest(selectedDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
            Nueva planta
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Basic Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
              Información básica
            </Text>

            <Input
              label="Nombre de la planta"
              placeholder="Mi Planta #1"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              containerStyle={{ marginBottom: 16 }}
            />

            <Input
              label="Variedad/Strain"
              placeholder="Escribe para buscar..."
              value={strain}
              onChangeText={handleStrainTextChange}
              editable={!isLoading}
              containerStyle={{ marginBottom: 0 }}
            />
            {searchingStrains && (
              <ActivityIndicator size="small" color="#22C55E" style={{ position: 'absolute', right: 12, top: 108 }} />
            )}

            {/* Autocomplete dropdown */}
            {showSuggestions && strainSuggestions.length > 0 && (
              <View style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#22C55E60',
                marginTop: 4,
                maxHeight: 250,
                overflow: 'hidden',
              }}>
                {strainSuggestions.map((s, idx) => (
                  <TouchableOpacity
                    key={s.name}
                    onPress={() => handleSelectStrain(s)}
                    style={{
                      padding: 12,
                      borderBottomWidth: idx < strainSuggestions.length - 1 ? 1 : 0,
                      borderBottomColor: '#3A3A4E',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>{s.name}</Text>
                      <Text style={{ color: '#A0A0A0', fontSize: 11, marginTop: 2 }}>
                        {s.type.charAt(0).toUpperCase() + s.type.slice(1)} · THC {s.thc_range} · {s.difficulty === 'easy' ? 'Fácil' : s.difficulty === 'medium' ? 'Media' : 'Difícil'}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: s.type === 'indica' ? '#7C3AED30' : s.type === 'sativa' ? '#F59E0B30' : s.type === 'auto' ? '#3B82F630' : '#22C55E30',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                    }}>
                      <Text style={{
                        color: s.type === 'indica' ? '#A78BFA' : s.type === 'sativa' ? '#FBBF24' : s.type === 'auto' ? '#60A5FA' : '#22C55E',
                        fontSize: 10,
                        fontWeight: '600',
                      }}>
                        {s.type.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected strain info card */}
            {selectedStrain && (
              <View style={{
                backgroundColor: '#0B3D2E',
                borderRadius: 10,
                padding: 14,
                marginTop: 10,
                borderWidth: 1,
                borderColor: '#22C55E40',
              }}>
                <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 15, marginBottom: 6 }}>
                  {selectedStrain.name}
                </Text>
                <Text style={{ color: '#D1FAE5', fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                  {selectedStrain.description}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#A0A0A0', fontSize: 10 }}>THC</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{selectedStrain.thc_range}</Text>
                  </View>
                  <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#A0A0A0', fontSize: 10 }}>CBD</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{selectedStrain.cbd_range}</Text>
                  </View>
                  <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Floración</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{selectedStrain.flowering_days_min}-{selectedStrain.flowering_days_max} días</Text>
                  </View>
                  <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Rendimiento</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{selectedStrain.yield_indoor}</Text>
                  </View>
                  <View style={{ backgroundColor: '#0A0A0A80', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#A0A0A0', fontSize: 10 }}>Dificultad</Text>
                    <Text style={{ color: selectedStrain.difficulty === 'easy' ? '#22C55E' : selectedStrain.difficulty === 'medium' ? '#C47A2C' : '#EF4444', fontSize: 12, fontWeight: '600' }}>
                      {selectedStrain.difficulty === 'easy' ? 'Fácil' : selectedStrain.difficulty === 'medium' ? 'Media' : 'Difícil'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <View style={{ height: 12 }} />
          </View>

          {/* Strain Type */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Tipo de planta
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {strainTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setStrainType(type)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: strainType === type ? '#22C55E' : '#1A1A2E',
                    borderWidth: 1,
                    borderColor: strainType === type ? '#22C55E' : '#3A3A4E',
                  }}
                >
                  <Text
                    style={{
                      color: strainType === type ? '#0A0A0A' : '#FFFFFF',
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stage */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Fase inicial
            </Text>
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#3A3A4E',
                overflow: 'hidden',
              }}
            >
              {stages.map((stg, index) => (
                <TouchableOpacity
                  key={stg}
                  onPress={() => setStage(stg)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: stage === stg ? '#0B3D2E' : '#1A1A2E',
                    borderBottomWidth: index < stages.length - 1 ? 1 : 0,
                    borderBottomColor: '#3A3A4E',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: stage === stg ? '#22C55E' : '#FFFFFF',
                      fontWeight: stage === stg ? '600' : '400',
                    }}
                  >
                    {stageLabels[stg]}
                  </Text>
                  {stage === stg && <Text style={{ color: '#22C55E' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dates */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Fechas
            </Text>

            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#3A3A4E',
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                Fecha de inicio
              </Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {formatDate(startDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowHarvestDatePicker(true)}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#3A3A4E',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
                Cosecha esperada
              </Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {formatDate(expectedHarvest)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Input
              label="Notas (opcional)"
              placeholder="Cualquier información adicional..."
              value={notes}
              onChangeText={setNotes}
              editable={!isLoading}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          </View>

          {/* Create Button */}
          <Button
            title={isLoading ? 'Creando...' : 'Crear planta'}
            onPress={handleCreate}
            disabled={isLoading}
            loading={isLoading}
            size="large"
          />
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          maximumDate={new Date()}
        />
      )}
      {showHarvestDatePicker && (
        <DateTimePicker
          value={expectedHarvest}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleHarvestDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}
