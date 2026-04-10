// KaruWeed - Analyze Plant Edge Function
// Proxies Claude Vision API calls keeping the API key server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in Edge Function secrets');
    }

    const { image, strain, stage, day_of_cycle } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Se requiere una imagen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = `Eres un experto cultivador de cannabis con 20 años de experiencia. Analiza esta imagen de planta y proporciona tu diagnóstico.

Datos de la planta:
- Variedad: ${strain || 'desconocida'}
- Etapa: ${stage || 'desconocida'}
- Día del ciclo: ${day_of_cycle || 'no especificado'}

Analiza la imagen y responde SOLO con un JSON válido (sin markdown, sin \`\`\`) con estas claves exactas:
{
  "diagnosis": "descripción detallada del estado actual de la planta en español",
  "health_score": número de 0 a 100,
  "recommendations": ["recomendación 1 en español", "recomendación 2", ...],
  "identified_issues": ["problema 1 en español", "problema 2", ...] o []
}

Sé específico sobre deficiencias nutricionales, plagas, problemas de iluminación, indicadores de etapa de crecimiento y preocupaciones ambientales para el cultivo de cannabis. Responde siempre en español.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Error de Claude API: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse Claude response:', content);
      return new Response(
        JSON.stringify({ error: 'No se pudo interpretar la respuesta de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (
      typeof analysis.diagnosis !== 'string' ||
      typeof analysis.health_score !== 'number' ||
      !Array.isArray(analysis.recommendations) ||
      !Array.isArray(analysis.identified_issues)
    ) {
      return new Response(
        JSON.stringify({ error: 'Respuesta de IA con formato inválido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify(analysis),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
