// KaruWeed - Analyze Plant Edge Function
// Multi-photo AI analysis with guided photo requests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in Edge Function secrets');
    }

    const { images, strain, stage, day_of_cycle, image } = await req.json();

    // Support both single image (legacy) and multiple images
    const imageList: string[] = images || (image ? [image] : []);

    if (imageList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere al menos una imagen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const isFirstAnalysis = imageList.length === 1;

    const prompt = isFirstAnalysis
      ? `Eres un experto cultivador de cannabis con 20 años de experiencia. Analiza esta imagen de planta.

Datos de la planta:
- Variedad: ${strain || 'desconocida'}
- Etapa: ${stage || 'desconocida'}
- Día del ciclo: ${day_of_cycle || 'no especificado'}

Analiza la imagen y responde SOLO con un JSON válido (sin markdown, sin \`\`\`) con estas claves exactas:
{
  "diagnosis": "descripción detallada del estado actual en español",
  "health_score": número de 0 a 100,
  "recommendations": ["recomendación 1", "recomendación 2", ...],
  "identified_issues": ["problema 1", ...] o [],
  "needs_more_photos": true o false,
  "photo_requests": [
    {
      "type": "tipo de foto (ej: hojas_reverso, sustrato, tallo, raices, planta_completa)",
      "description": "instrucción clara para el usuario de qué foto necesitas y por qué"
    }
  ]
}

IMPORTANTE sobre photo_requests:
- Si detectas posibles problemas que necesitan más detalle visual, pon needs_more_photos: true
- Pide fotos específicas que te ayudarían a confirmar o descartar problemas
- Ejemplos: "Foto del reverso de las hojas para detectar ácaros", "Foto del sustrato para evaluar humedad", "Foto cercana de las manchas en las hojas"
- Si la imagen es suficientemente clara y no necesitas más, pon needs_more_photos: false y photo_requests: []
- Máximo 3 fotos adicionales

Sé específico. Responde en español.`
      : `Eres un experto cultivador de cannabis con 20 años de experiencia. Te envío ${imageList.length} fotos de la misma planta para un análisis completo.

Datos de la planta:
- Variedad: ${strain || 'desconocida'}
- Etapa: ${stage || 'desconocida'}
- Día del ciclo: ${day_of_cycle || 'no especificado'}

Analiza TODAS las imágenes en conjunto y da un diagnóstico completo. Responde SOLO con un JSON válido (sin markdown, sin \`\`\`):
{
  "diagnosis": "diagnóstico completo basado en todas las fotos, en español",
  "health_score": número de 0 a 100,
  "recommendations": ["recomendación 1", "recomendación 2", ...],
  "identified_issues": ["problema confirmado 1", ...] o [],
  "needs_more_photos": false,
  "photo_requests": []
}

Con múltiples ángulos puedes ser más preciso. Confirma o descarta problemas que sospechabas en la primera foto. Sé específico y responde en español.`;

    // Build message content with all images
    const messageContent: any[] = imageList.map((img: string) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: img,
      },
    }));
    messageContent.push({ type: 'text', text: prompt });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: messageContent,
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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse Claude response:', content);
      return new Response(
        JSON.stringify({ error: 'No se pudo interpretar la respuesta de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate required fields
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

    // Ensure optional fields have defaults
    analysis.needs_more_photos = analysis.needs_more_photos ?? false;
    analysis.photo_requests = analysis.photo_requests ?? [];

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
