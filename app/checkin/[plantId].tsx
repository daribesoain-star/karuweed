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
import { AIAnalysis, PhotoRequest } from '@/lib/types';

interface PhotoEntry {
  uri: string;
  base64: string;
  label?: string;
}

export default function CheckInScreen() {
  const { plantId } = useLocalSearchParams();
  const router = useRouter();
  const { getPlantById } = usePlantStore();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [heightCm, setHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
  const [analysisStep, setAnalysisStep] = useState<'initial' | 'requesting' | 'complete'>('initial');

  const plant = getPlantById(plantId as string);

  const takeOrPickPhoto = async (source: 'camera' | 'gallery', label?: string) => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
          return;
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets[0].base64) {
        const newPhoto: PhotoEntry = {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          label,
        };
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        return newPhoto;
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la foto');
    }
    return null;
  };

  const handleFirstPhoto = async (source: 'camera' | 'gallery') => {
    const photo = await takeOrPickPhoto(source, 'Foto principal');
    if (photo) {
      await runAnalysis([photo]);
    }
  };

  const handleAdditionalPhoto = async (request: PhotoRequest) => {
    const photo = await takeOrPickPhoto('camera', request.description);
    if (photo) {
      // Remove this request from pending
      const remaining = photoRequests.filter(r => r.type !== request.type);
      setPhotoRequests(remaining);

      const allPhotos = [...photos];
      // If no more requests or user has added enough, run full analysis
      if (remaining.length === 0) {
        await runAnalysis(allPhotos);
      }
    }
  };

  const runAnalysis = async (photoEntries: PhotoEntry[]) => {
    setIsAnalyzing(true);
    setAnalysisStep(photoEntries.length === 1 ? 'initial' : 'complete');
    try {
      const base64Images = photoEntries.map(p => p.base64);
      const result = await analyzePlantImage(
        base64Images,
        plant?.strain,
        plant?.stage,
      );
      setAnalysis(result);

      if (result.needs_more_photos && result.photo_requests && result.photo_requests.length > 0 && photoEntries.length === 1) {
        setPhotoRequests(result.photo_requests);
        setAnalysisStep('requesting');
      } else {
        setPhotoRequests([]);
        setAnalysisStep('complete');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert(
        'Análisis IA no disponible',
        `${msg}\n\nPuedes guardar el check-in sin análisis.`,
      );
      setAnalysisStep('complete');
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipAdditionalPhotos = async () => {
    setPhotoRequests([]);
    setAnalysisStep('complete');
    // Re-run with all photos we have for a final analysis
    if (photos.length > 1) {
      await runAnalysis(photos);
    }
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return;
    }

    if (!heightCm) {
      Alert.alert('Error', 'Por favor indica la altura de la planta');
      return;
    }

    setIsLoading(true);

    try {
      // Upload first photo to Supabase storage
      const timestamp = Date.now();
      const filename = `${plantId}_${timestamp}.jpg`;

      const response = await fetch(photos[0].uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(filename, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('plant-photos').getPublicUrl(filename);

      // Use issues from AI analysis
      const issues = analysis?.identified_issues || [];

      const { error: insertError } = await supabase.from('checkins').insert({
        plant_id: plantId,
        date: new Date().toISOString(),
        photo_url: publicUrl,
        ai_analysis: analysis || null,
        height_cm: parseFloat(heightCm),
        notes: notes || null,
        issues,
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
              {photos.length === 0 ? 'Foto de la planta' : `Fotos (${photos.length})`}
            </Text>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {photos.map((photo, index) => (
                  <View key={index} style={{ marginRight: 8 }}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={{
                        width: photos.length === 1 ? 300 : 150,
                        height: photos.length === 1 ? 225 : 112,
                        borderRadius: 12,
                        backgroundColor: '#1A1A2E',
                      }}
                    />
                    {photo.label && (
                      <Text style={{ color: '#A0A0A0', fontSize: 11, marginTop: 4, maxWidth: 150 }} numberOfLines={1}>
                        {photo.label}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Initial photo buttons */}
            {photos.length === 0 && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Tomar foto" onPress={() => handleFirstPhoto('camera')} size="medium" />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Galería" onPress={() => handleFirstPhoto('gallery')} variant="secondary" size="medium" />
                </View>
              </View>
            )}

            {/* Analyzing indicator */}
            {isAnalyzing && (
              <View
                style={{
                  backgroundColor: '#0B3D2E',
                  borderRadius: 12,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#22C55E40',
                }}
              >
                <ActivityIndicator size="small" color="#22C55E" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#22C55E', fontWeight: '600', marginBottom: 4 }}>
                  {photos.length === 1 ? 'Analizando planta...' : 'Analizando todas las fotos...'}
                </Text>
                <Text style={{ color: '#A0A0A0', fontSize: 12, textAlign: 'center' }}>
                  La IA está revisando {photos.length === 1 ? 'la imagen' : `las ${photos.length} imágenes`}
                </Text>
              </View>
            )}
          </View>

          {/* AI Photo Requests - The magic part */}
          {analysisStep === 'requesting' && photoRequests.length > 0 && !isAnalyzing && (
            <View style={{ marginBottom: 24 }}>
              <View style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#C47A2C60',
                marginBottom: 12,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🔍</Text>
                  <Text style={{ color: '#C47A2C', fontWeight: '700', fontSize: 16 }}>
                    La IA necesita más fotos
                  </Text>
                </View>
                <Text style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                  Para darte un diagnóstico más preciso, necesito ver otros ángulos de tu planta:
                </Text>

                {photoRequests.map((request, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleAdditionalPhoto(request)}
                    style={{
                      backgroundColor: '#0A0A0A',
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#3A3A4E',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#22C55E15',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 22 }}>📸</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                        {request.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Text>
                      <Text style={{ color: '#A0A0A0', fontSize: 12, lineHeight: 18 }}>
                        {request.description}
                      </Text>
                    </View>
                    <Text style={{ color: '#22C55E', fontSize: 22, marginLeft: 8 }}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSkipAdditionalPhotos}
                style={{ alignItems: 'center', padding: 8 }}
              >
                <Text style={{ color: '#A0A0A0', fontSize: 13 }}>
                  Omitir y usar análisis actual →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Analysis Results */}
          {analysis && !isAnalyzing && analysisStep !== 'initial' && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                {analysisStep === 'complete' ? 'Diagnóstico IA' : 'Análisis preliminar'}
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
                      backgroundColor: analysis.health_score >= 75 ? '#22C55E' : analysis.health_score >= 50 ? '#C47A2C' : '#EF4444',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: '#0A0A0A', fontWeight: '600', fontSize: 12 }}>
                      {analysis.health_score}/100
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: '#E0E0E0',
                    fontSize: 14,
                    lineHeight: 22,
                    marginBottom: 12,
                  }}
                >
                  {analysis.diagnosis}
                </Text>

                {analysis.identified_issues.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#C47A2C', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                      Problemas detectados:
                    </Text>
                    {analysis.identified_issues.map((issue: string, index: number) => (
                      <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                        <Text style={{ color: '#EF4444', fontSize: 12, marginRight: 6, marginTop: 1 }}>⚠</Text>
                        <Text style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>{issue}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {analysis.recommendations.length > 0 && (
                  <View>
                    <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                      Recomendaciones:
                    </Text>
                    {analysis.recommendations.map((rec: string, index: number) => (
                      <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                        <Text style={{ color: '#22C55E', fontSize: 12, marginRight: 6, marginTop: 1 }}>•</Text>
                        <Text style={{ color: '#A0A0A0', fontSize: 13, flex: 1, lineHeight: 20 }}>{rec}</Text>
                      </View>
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
            disabled={photos.length === 0 || !heightCm || isLoading || isAnalyzing}
            loading={isLoading}
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
