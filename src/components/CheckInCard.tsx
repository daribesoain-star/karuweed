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

  const analysis = checkIn.ai_analysis;
  const hasAnalysis = analysis != null;
  const healthScore = analysis ? analysis.health_score : 0;
  const healthScoreColor =
    healthScore >= 75
      ? '#22C55E'
      : healthScore >= 50
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
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {checkIn.height_cm != null && (
              <View style={{
                backgroundColor: '#3B82F630',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
                <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '600' }}>
                  {checkIn.height_cm} cm
                </Text>
              </View>
            )}
            {hasAnalysis && (
              <View
                style={{
                  backgroundColor: healthScoreColor + '30',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: healthScoreColor, fontSize: 11, fontWeight: '600' }}>
                  Salud: {healthScore}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {hasAnalysis ? (
          <>
            <Text
              numberOfLines={2}
              style={{
                color: '#E0E0E0',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {analysis!.diagnosis}
            </Text>

            {analysis!.identified_issues.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: '#C47A2C', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  Problemas detectados:
                </Text>
                {analysis!.identified_issues.slice(0, 2).map((issue, index) => (
                  <Text
                    key={index}
                    style={{ color: '#FFA500', fontSize: 12, marginLeft: 8, marginBottom: 4 }}
                  >
                    • {issue}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={{ color: '#A0A0A0', fontSize: 13, fontStyle: 'italic' }}>
            Sin análisis de IA
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
