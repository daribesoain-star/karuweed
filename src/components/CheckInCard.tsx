import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { CheckIn } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckInCardProps {
  checkIn: CheckIn;
  onPress: () => void;
}

export const CheckInCard: React.FC<CheckInCardProps> = ({ checkIn, onPress }) => {
  const timeAgo = formatDistanceToNow(new Date(checkIn.date), {
    addSuffix: true,
    locale: es,
  });

  const healthScoreColor =
    checkIn.ai_analysis.health_score >= 75
      ? '#22C55E'
      : checkIn.ai_analysis.health_score >= 50
        ? '#C47A2C'
        : '#EF4444';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#1A1A2E',
        borderWidth: 1,
        borderColor: '#3A3A4E',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {checkIn.photo_url && (
        <Image
          source={{ uri: checkIn.photo_url }}
          style={{
            width: '100%',
            height: 200,
            backgroundColor: '#0A0A0A',
          }}
        />
      )}

      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#A0A0A0', fontSize: 12 }}>
            {timeAgo}
          </Text>
          <View
            style={{
              backgroundColor: healthScoreColor + '30',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: healthScoreColor, fontSize: 12, fontWeight: '600' }}>
              Salud: {checkIn.ai_analysis.health_score}%
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          style={{
            color: '#E0E0E0',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 12,
          }}
        >
          {checkIn.ai_analysis.diagnosis}
        </Text>

        {checkIn.ai_analysis.identified_issues.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#C47A2C', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              Problemas detectados:
            </Text>
            {checkIn.ai_analysis.identified_issues.slice(0, 2).map((issue, index) => (
              <Text
                key={index}
                style={{ color: '#FFA500', fontSize: 12, marginLeft: 8, marginBottom: 4 }}
              >
                • {issue}
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
