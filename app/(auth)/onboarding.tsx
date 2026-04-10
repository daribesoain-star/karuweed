import React, { useState, useRef } from 'react';
import { View, Text, Dimensions, FlatList, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🌱',
    title: 'Tu cultivo,\nguiado por inteligencia',
    subtitle: 'KaruWeed',
    description: 'La app que convierte a cualquier persona en un cultivador experto con IA, sensores IoT y una comunidad activa.',
    color: '#22C55E',
  },
  {
    id: '2',
    emoji: '🤖',
    title: 'Análisis IA\nde tus plantas',
    subtitle: 'Claude Vision',
    description: 'Saca una foto y recibe diagnóstico instantáneo: salud, problemas, recomendaciones. Como tener un experto 24/7.',
    color: '#86EFAC',
  },
  {
    id: '3',
    emoji: '📡',
    title: 'Sensores IoT\nde bajo costo',
    subtitle: 'Kit desde ~$50 USD',
    description: 'Monitorea temperatura, humedad, luz y suelo en tiempo real. Alertas automáticas si algo sale de rango.',
    color: '#C47A2C',
  },
  {
    id: '4',
    emoji: '🎵',
    title: 'Música para\ntus plantas',
    subtitle: 'Frecuencias científicas',
    description: 'Estimula el crecimiento con frecuencias específicas para cada etapa: germinación, vegetativo, floración.',
    color: '#22C55E',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' }}>
      {/* Glow Circle */}
      <View style={{
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: item.color + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: item.color + '30',
      }}>
        <Text style={{ fontSize: 72 }}>{item.emoji}</Text>
      </View>

      {/* Subtitle */}
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: item.color,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 12,
      }}>
        {item.subtitle}
      </Text>

      {/* Title */}
      <Text style={{
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 20,
      }}>
        {item.title}
      </Text>

      {/* Description */}
      <Text style={{
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 12,
      }}>
        {item.description}
      </Text>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar style="light" backgroundColor="#0A0A0A" />

      {/* Skip Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 }}>
        <TouchableOpacity onPress={handleSkip} style={{ padding: 8 }}>
          <Text style={{ color: '#A0A0A0', fontSize: 14, fontWeight: '500' }}>Saltar</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      {/* Bottom: Dots + Button */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 32, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#22C55E',
                  marginHorizontal: 4,
                  opacity: dotOpacity,
                }}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: '#22C55E',
            borderRadius: 14,
            paddingVertical: 18,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
            {currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
