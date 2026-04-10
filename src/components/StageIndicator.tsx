import React from 'react';
import { View, Text } from 'react-native';
import { PlantStage } from '@/lib/types';

interface StageIndicatorProps {
  stage: PlantStage;
  progress: number;
}

export const StageIndicator: React.FC<StageIndicatorProps> = ({ stage, progress }) => {
  const stages: { key: PlantStage; label: string; color: string }[] = [
    { key: 'germination', label: 'Germinación', color: '#8B4513' },
    { key: 'seedling', label: 'Plántula', color: '#FFD700' },
    { key: 'vegetative', label: 'Vegetativa', color: '#22C55E' },
    { key: 'flowering', label: 'Floración', color: '#FF69B4' },
    { key: 'harvest', label: 'Cosecha', color: '#FF8C00' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {stages.map((s, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;

          return (
            <View key={s.key} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isActive || isCompleted ? s.color : '#3A3A4E',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: isActive || isCompleted ? '#0A0A0A' : '#A0A0A0',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  color: isActive ? s.color : '#A0A0A0',
                  fontSize: 11,
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'center',
                }}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        style={{
          height: 6,
          backgroundColor: '#3A3A4E',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#22C55E',
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
};
