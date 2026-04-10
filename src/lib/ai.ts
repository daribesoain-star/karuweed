import { AIAnalysis } from './types';
import { supabase } from './supabase';

const SUPABASE_URL = 'https://ymvnflwcxwgsyhramhex.supabase.co';

export async function analyzePlantImage(
  base64Images: string | string[],
  strain?: string,
  stage?: string,
  dayOfCycle?: number,
): Promise<AIAnalysis> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const images = Array.isArray(base64Images) ? base64Images : [base64Images];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-plant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        images,
        strain: strain || 'desconocida',
        stage: stage || 'desconocida',
        day_of_cycle: dayOfCycle || 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', response.status, errorText);
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();

    if (
      typeof data.diagnosis !== 'string' ||
      typeof data.health_score !== 'number' ||
      !Array.isArray(data.recommendations) ||
      !Array.isArray(data.identified_issues)
    ) {
      throw new Error('Respuesta inválida del análisis IA');
    }

    return data as AIAnalysis;
  } catch (error) {
    console.error('Error analyzing plant image:', error);
    throw error;
  }
}
