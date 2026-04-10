import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usePlantStore } from '@/store/plantStore';
import { supabase } from '@/lib/supabase';
import { analyzePlantImage } from '@/lib/ai';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function CheckInScreen() {
  const { plantId } = useLocalSearchParams();
  const router = useRouter();
  const { getPlantById } = usePlantStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const plant = getPlantById(plantId as string);

  const commonIssues = [
    'Deficiencia de Nitrógeno',
    'Deficiencia de Potasio',
    'Plagas',
    'Mildiu',
    'Quemadura de luz',
    'Estrés hídrico',
    'Pudrición de raíces',
  ];

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPhoto(result.assets[0].uri);
        // Analyze immediately
        await analyzePhoto(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPhoto(result.assets[0].uri);
        // Analyze immediately
        await analyzePhoto(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const analyzePhoto = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePlantImage(
        base64,
        plant?.strain,
        plant?.stage,
      );
      setAnalysis(result);
      // Auto-select identified issues
      if (result.identified_issues && result.identified_issues.length > 0) {
        setSelectedIssues(result.identified_issues);
      }
    } catch (error) {
      // IA analysis is optional — don't block the user
      Alert.alert(
        'Análisis IA no disponible',
        'No se pudo conectar con la IA. Puedes guardar el check-in sin análisis.',
      );
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return;
    }

    if (!heightCm) {
      Alert.alert('Error', 'Por favor indica la altura de la planta');
      return;
    }
    // AI analysis is optional — user can save without it

    setIsLoading(true);

    try {
      // Upload image to Supabase storage
      const timestamp = Date.now();
      const filename = `${plantId}_${timestamp}.jpg`;

      // Convert URI to ArrayBuffer (required for Supabase Storage on Android)
      const response = await fetch(photo);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('checkin-photos')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('checkin-photos').getPublicUrl(filename);

      // Create check-in record (ai_analysis may be null if IA failed)
      const { error: insertError } = await supabase.from('checkins').insert({
        plant_id: plantId,
        date: new Date().toISOString(),
        photo_url: publicUrl,
        ai_analysis: analysis || null,
        height_cm: parseFloat(heightCm),
        notes: notes || null,
        issues: selectedIssues,
      });

      if (insertError) throw insertError;

      Alert.alert('Éxito', 'Check-in registrado correctamente');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo guardar el check-in: ${message}`);
      console.error(error);
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
            Check-in: {plant.name}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Photo Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Foto de la planta
            </Text>

            {photo ? (
              <View style={{ marginBottom: 12 }}>
                <Image
                  source={{ uri: photo }}
                  style={{
                    width: '100%',
                    height: 250,
                    borderRadius: 12,
                    marginBottom: 12,
                    backgroundColor: '#1A1A2E',
                  }}
                />
                <Button
                  title="Cambiar foto"
                  onPress={handleTakePhoto}
                  variant="secondary"
                  size="medium"
                />
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Button
                    title="Tomar foto"
                    onPress={handleTakePhoto}
                    size="medium"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Galería"
                    onPress={handlePickPhoto}
                    variant="secondary"
                    size="medium"
                  />
                </View>
              </View>
            )}

            {isAnalyzing && (
              <View
                style={{
                  backgroundColor: '#0B3D2E',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="small" color="#22C55E" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#22C55E' }}>Analizando planta...</Text>
              </View>
            )}
          </View>

          {/* AI Analysis Results */}
          {analysis && !isAnalyzing && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                Análisis de IA
              </Text>

              <View
                style={{
                  backgroundColor: '#1A1A2E',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#3A3A4E',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: '#A0A0A0', fontSize: 12 }}>Salud de la planta</Text>
                  <View
                    style={{
                      backgroundColor: analysis.health_score >= 75 ? '#22C55E' : '#C47A2C',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#0A0A0A',
                        fontWeight: '600',
                        fontSize: 12,
                      }}
                    >
                      {analysis.health_score}%
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: '#E0E0E0',
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 12,
                  }}
                >
                  {analysis.diagnosis}
                </Text>

                {analysis.recommendations.length > 0 && (
                  <View>
                    <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                      Recomendaciones:
                    </Text>
                    {analysis.recommendations.map((rec: string, index: number) => (
                      <Text
                        key={index}
                        style={{
                          color: '#A0A0A0',
                          fontSize: 12,
                          marginLeft: 8,
                          marginBottom: 6,
                        }}
                      >
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Height Input */}
          <View style={{ marginBottom: 24 }}>
            <Input
              label="Altura de la planta (cm)"
              placeholder="Ej. 45"
              value={heightCm}
              onChangeText={setHeightCm}
              editable={!isLoading}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Issues */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Problemas detectados
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {commonIssues.map((issue) => (
                <TouchableOpacity
                  key={issue}
                  onPress={() => {
                    setSelectedIssues((prev) =>
                      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
                    );
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedIssues.includes(issue) ? '#C47A2C' : '#1A1A2E',
                    borderWidth: 1,
                    borderColor: selectedIssues.includes(issue) ? '#C47A2C' : '#3A3A4E',
                  }}
                >
                  <Text
                    style={{
                      color: selectedIssues.includes(issue) ? '#0A0A0A' : '#A0A0A0',
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {issue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Input
              label="Notas adicionales"
              placeholder="Cualquier observación importante..."
              value={notes}
              onChangeText={setNotes}
              editable={!isLoading}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          {/* Submit Button */}
          <Button
            title={isLoading ? 'Guardando...' : 'Guardar check-in'}
            onPress={handleSubmit}
            disabled={!photo || !heightCm || isLoading || isAnalyzing}
            loading={isLoading}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
