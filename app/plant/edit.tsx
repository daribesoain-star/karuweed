import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlantStore } from '@/store/plantStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StrainType } from '@/lib/types';

const strainTypes: { value: StrainType; label: string }[] = [
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'hybrid', label: 'Híbrida' },
  { value: 'auto', label: 'Autofloreciente' },
];

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPlantById, updatePlant } = usePlantStore();

  const plant = getPlantById(id as string);

  const [name, setName] = useState(plant?.name || '');
  const [strain, setStrain] = useState(plant?.strain || '');
  const [strainType, setStrainType] = useState<StrainType>(plant?.strain_type || 'hybrid');
  const [notes, setNotes] = useState(plant?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!plant) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#A0A0A0' }}>Planta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!strain.trim()) {
      Alert.alert('Error', 'La variedad es obligatoria');
      return;
    }

    setIsSaving(true);
    try {
      await updatePlant(plant.id, {
        name: name.trim(),
        strain: strain.trim(),
        strain_type: strainType,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Editar planta</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <Input
            label="Nombre de la planta"
            placeholder="Ej: Mi primera planta"
            value={name}
            onChangeText={setName}
            editable={!isSaving}
          />

          <Input
            label="Variedad / Cepa"
            placeholder="Ej: Northern Lights"
            value={strain}
            onChangeText={setStrain}
            editable={!isSaving}
          />

          {/* Strain Type Selector */}
          <View>
            <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
              Tipo de cepa
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {strainTypes.map((st) => (
                <TouchableOpacity
                  key={st.value}
                  onPress={() => !isSaving && setStrainType(st.value)}
                  style={{
                    flex: 1,
                    backgroundColor: strainType === st.value ? '#22C55E20' : '#1A1A2E',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: strainType === st.value ? '#22C55E60' : '#3A3A4E',
                  }}
                >
                  <Text style={{
                    color: strainType === st.value ? '#22C55E' : '#A0A0A0',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Notas (opcional)"
            placeholder="Notas sobre tu planta..."
            value={notes}
            onChangeText={setNotes}
            editable={!isSaving}
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <Button
            title={isSaving ? 'Guardando...' : 'Guardar cambios'}
            onPress={handleSave}
            disabled={isSaving}
            loading={isSaving}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
