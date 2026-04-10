import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plant } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress }) => {
  const daysOld = differenceInDays(new Date(), parseISO(plant.start_date));

  const stageColors: Record<string, string> = {
    germination: '#8B4513',
    seedling: '#FFD700',
    vegetative: '#22C55E',
    flowering: '#FF69B4',
    harvest: '#FF8C00',
  };

  const stageLabels: Record<string, string> = {
    germination: 'Germinación',
    seedling: 'Plántula',
    vegetative: 'Vegetativa',
    flowering: 'Floración',
    harvest: 'Cosecha',
  };

  const stageColor = stageColors[plant.stage];
  const stageLabel = stageLabels[plant.stage];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#1A1A2E',
        borderWidth: 1,
        borderColor: '#3A3A4E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
            {plant.name}
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
            {plant.strain}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: stageColor + '30',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: stageColor, fontSize: 12, fontWeight: '600' }}>
            {stageLabel}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#3A3A4E',
        }}
      >
        <View>
          <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
            Días desde inicio
          </Text>
          <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>
            {daysOld} días
          </Text>
        </View>
        <View>
          <Text style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 4 }}>
            Tipo
          </Text>
          <Text style={{ color: '#86EFAC', fontSize: 16, fontWeight: '600' }}>
            {plant.strain_type}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
