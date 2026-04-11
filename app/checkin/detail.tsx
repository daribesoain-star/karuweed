import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CheckInDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    date: string;
    photo_url: string;
    height_cm: string;
    notes: string;
    ai_analysis: string;
    issues: string;
  }>();

  let analysis = null;
  let issues: string[] = [];
  try {
    if (params.ai_analysis) analysis = JSON.parse(params.ai_analysis);
  } catch { /* invalid JSON */ }
  try {
    if (params.issues) issues = JSON.parse(params.issues);
  } catch { /* invalid JSON */ }
  const heightCm = params.height_cm && params.height_cm !== 'null' ? Number(params.height_cm) : null;

  let dateStr = '';
  try {
    if (params.date) dateStr = format(new Date(params.date), "d 'de' MMMM, yyyy · HH:mm", { locale: es });
  } catch { /* invalid date */ }

  const healthScore = analysis?.health_score ?? 0;
  const healthColor = healthScore >= 75 ? '#22C55E' : healthScore >= 50 ? '#C47A2C' : '#EF4444';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '600' }}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={{ color: '#A0A0A0', fontSize: 13 }}>{dateStr}</Text>
        </View>

        {/* Photo */}
        {params.photo_url && (
          <Image
            source={{ uri: params.photo_url }}
            style={{ width: '100%', height: 300, backgroundColor: '#1A1A2E' }}
            resizeMode="cover"
          />
        )}

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
          {analysis && (
            <View style={{
              flex: 1,
              backgroundColor: healthColor + '15',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: healthColor + '40',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Salud</Text>
              <Text style={{ color: healthColor, fontSize: 28, fontWeight: '800' }}>{healthScore}%</Text>
            </View>
          )}
          {heightCm != null && (
            <View style={{
              flex: 1,
              backgroundColor: '#3B82F615',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#3B82F640',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Altura</Text>
              <Text style={{ color: '#60A5FA', fontSize: 28, fontWeight: '800' }}>{heightCm}</Text>
              <Text style={{ color: '#60A5FA', fontSize: 12 }}>cm</Text>
            </View>
          )}
          {issues.length > 0 && (
            <View style={{
              flex: 1,
              backgroundColor: '#EF444415',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#EF444440',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11 }}>Problemas</Text>
              <Text style={{ color: '#EF4444', fontSize: 28, fontWeight: '800' }}>{issues.length}</Text>
            </View>
          )}
        </View>

        {/* AI Diagnosis */}
        {analysis && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Diagnóstico IA
            </Text>
            <View style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#3A3A4E',
            }}>
              <Text style={{ color: '#E0E0E0', fontSize: 14, lineHeight: 22 }}>
                {analysis.diagnosis}
              </Text>
            </View>
          </View>
        )}

        {/* Identified Issues */}
        {analysis && analysis.identified_issues?.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Problemas detectados
            </Text>
            <View style={{
              backgroundColor: '#2D1A1A',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#EF444430',
            }}>
              {analysis.identified_issues.map((issue: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: i < analysis.identified_issues.length - 1 ? 10 : 0 }}>
                  <Text style={{ color: '#EF4444', fontSize: 14, marginRight: 8 }}>●</Text>
                  <Text style={{ color: '#FCA5A5', fontSize: 14, lineHeight: 20, flex: 1 }}>{issue}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendations?.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Recomendaciones
            </Text>
            <View style={{
              backgroundColor: '#0B3D2E',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#22C55E30',
            }}>
              {analysis.recommendations.map((rec: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: i < analysis.recommendations.length - 1 ? 10 : 0 }}>
                  <Text style={{ color: '#22C55E', fontSize: 14, marginRight: 8 }}>✓</Text>
                  <Text style={{ color: '#D1FAE5', fontSize: 14, lineHeight: 20, flex: 1 }}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {params.notes && params.notes !== 'undefined' && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Notas
            </Text>
            <View style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#3A3A4E',
            }}>
              <Text style={{ color: '#E0E0E0', fontSize: 14, lineHeight: 20 }}>
                {params.notes}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
