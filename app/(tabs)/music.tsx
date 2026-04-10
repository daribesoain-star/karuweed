import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { PlantStage } from '@/lib/types';

// Frequency presets per growth stage
const STAGE_PRESETS: Record<PlantStage, { hz: number; duration: number; label: string; emoji: string; color: string; description: string }> = {
  germination: { hz: 100, duration: 60, label: 'Germinación', emoji: '🌰', color: '#8B6914', description: 'Estimula activación de raíces' },
  seedling: { hz: 150, duration: 60, label: 'Plántula', emoji: '🌱', color: '#86EFAC', description: 'Fortalece tallo y primeras hojas' },
  vegetative: { hz: 250, duration: 90, label: 'Vegetativo', emoji: '🌿', color: '#22C55E', description: 'Acelera crecimiento de hojas' },
  flowering: { hz: 432, duration: 120, label: 'Floración', emoji: '🌸', color: '#C47A2C', description: 'Potencia terpenos y resina' },
  harvest: { hz: 528, duration: 60, label: 'Maduración', emoji: '✨', color: '#FFD700', description: 'Reparación celular, frecuencia del amor' },
};

const MAX_DAILY_MINUTES = 180;
const SAMPLE_RATE = 44100;
const TONE_DURATION_SECONDS = 30; // Generate 30-second tone clips, loop them

// Generate a WAV file buffer for a sine wave at given frequency
function generateSineWavBuffer(frequency: number, durationSec: number, sampleRate: number): string {
  const numSamples = sampleRate * durationSec;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  // Create buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // format chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate sine wave samples with fade in/out (3 sec)
  const fadeInSamples = Math.min(sampleRate * 3, numSamples / 2);
  const fadeOutSamples = Math.min(sampleRate * 3, numSamples / 2);
  const fadeOutStart = numSamples - fadeOutSamples;

  for (let i = 0; i < numSamples; i++) {
    let amplitude = 0.3; // 30% volume to not be too loud
    // Fade in
    if (i < fadeInSamples) {
      amplitude *= i / fadeInSamples;
    }
    // Fade out
    if (i > fadeOutStart) {
      amplitude *= (numSamples - i) / fadeOutSamples;
    }

    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude;
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function MusicScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PlantStage>('vegetative');
  const [customHz, setCustomHz] = useState<number | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const activePreset = STAGE_PRESETS[selectedStage];
  const activeHz = customHz || activePreset.hz;
  const remainingDaily = MAX_DAILY_MINUTES - dailyMinutes;

  // Configure audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(console.error);

    return () => {
      // Cleanup on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      // Rotate animation
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
      ).start();
      // Timer - every minute
      timerRef.current = setInterval(() => {
        setSessionMinutes((prev) => prev + 1);
        setDailyMinutes((prev) => {
          if (prev + 1 >= MAX_DAILY_MINUTES) {
            handleStop();
            Alert.alert('Límite diario alcanzado', 'Has alcanzado las 3 horas máximas de música diaria. Más tiempo puede deshidratar tus plantas.');
            return MAX_DAILY_MINUTES;
          }
          return prev + 1;
        });
      }, 60000);
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handlePlay = useCallback(async () => {
    if (remainingDaily <= 0) {
      Alert.alert('Límite alcanzado', 'Ya usaste las 3 horas de música hoy. Vuelve mañana.');
      return;
    }

    setIsLoading(true);
    try {
      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Generate WAV tone
      const base64Wav = generateSineWavBuffer(activeHz, TONE_DURATION_SECONDS, SAMPLE_RATE);
      const uri = `data:audio/wav;base64,${base64Wav}`;

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { isLooping: true, volume: 0.7, shouldPlay: true },
      );
      soundRef.current = sound;

      setSessionMinutes(0);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing tone:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio. Verifica los permisos de audio.');
    } finally {
      setIsLoading(false);
    }
  }, [activeHz, remainingDaily]);

  const handleStop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
    setIsPlaying(false);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>Música para Plantas</Text>
          <Text style={{ fontSize: 13, color: '#A0A0A0', marginTop: 4 }}>
            Frecuencias que estimulan el crecimiento
          </Text>
        </View>

        {/* Visualizer */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Animated.View style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: activePreset.color + '15',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: isPlaying ? activePreset.color + '60' : '#3A3A4E',
            transform: [{ scale: pulseAnim }, { rotate: rotateInterpolate }],
          }}>
            <Animated.View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: activePreset.color + '25',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: activePreset.color + '40',
            }}>
              <Text style={{ fontSize: 48 }}>{activePreset.emoji}</Text>
            </Animated.View>
          </Animated.View>

          {/* Frequency Display */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 42, fontWeight: '800', color: activePreset.color }}>
              {activeHz} Hz
            </Text>
            <Text style={{ fontSize: 14, color: '#A0A0A0', marginTop: 4 }}>
              {activePreset.description}
            </Text>
          </View>

          {/* Session Timer */}
          {isPlaying && (
            <View style={{ marginTop: 16, backgroundColor: '#1A1A2E', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
                Sesión: {formatTime(sessionMinutes)} / {formatTime(activePreset.duration)}
              </Text>
            </View>
          )}
        </View>

        {/* Play / Stop Button */}
        <View style={{ paddingHorizontal: 32, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={isPlaying ? handleStop : handlePlay}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#666' : isPlaying ? '#CC0000' : '#22C55E',
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>
              {isLoading ? '⏳' : isPlaying ? '⏹' : '▶️'}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
              {isLoading ? 'Cargando...' : isPlaying ? 'Detener' : 'Reproducir'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stage Selector */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
            Selecciona la etapa
          </Text>
          <View style={{ gap: 8 }}>
            {(Object.keys(STAGE_PRESETS) as PlantStage[]).map((stage) => {
              const preset = STAGE_PRESETS[stage];
              const isActive = selectedStage === stage;
              return (
                <TouchableOpacity
                  key={stage}
                  onPress={() => {
                    if (!isPlaying) {
                      setSelectedStage(stage);
                      setCustomHz(null);
                    }
                  }}
                  style={{
                    backgroundColor: isActive ? preset.color + '20' : '#1A1A2E',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isActive ? preset.color + '60' : '#3A3A4E',
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: isPlaying && !isActive ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 14 }}>{preset.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15, marginBottom: 2 }}>
                      {preset.label}
                    </Text>
                    <Text style={{ color: '#A0A0A0', fontSize: 12 }}>
                      {preset.hz} Hz · {preset.duration} min recomendados
                    </Text>
                  </View>
                  {isActive && (
                    <View style={{
                      backgroundColor: preset.color,
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Activo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Daily Limit Indicator */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#3A3A4E',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Uso diario</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                {formatTime(dailyMinutes)} / 3h
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: '#3A3A4E', borderRadius: 3 }}>
              <View style={{
                height: 6,
                backgroundColor: remainingDaily > 60 ? '#22C55E' : remainingDaily > 30 ? '#C47A2C' : '#CC0000',
                borderRadius: 3,
                width: `${Math.min((dailyMinutes / MAX_DAILY_MINUTES) * 100, 100)}%`,
              }} />
            </View>
            <Text style={{ color: '#666', fontSize: 11, marginTop: 8 }}>
              Máx 3h/día para evitar deshidratación por estomas abiertos
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{
            backgroundColor: '#0B3D2E',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#22C55E' + '30',
          }}>
            <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14, marginBottom: 8 }}>
              ¿Cómo funciona?
            </Text>
            <Text style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 20 }}>
              Las plantas responden a frecuencias sonoras específicas. Estudios muestran que ondas entre 100-528 Hz estimulan la apertura de estomas, mejoran la absorción de nutrientes y aceleran el crecimiento. Cada etapa tiene su frecuencia óptima.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
