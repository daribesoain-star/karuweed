import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing strain names to avoid duplicates
    const { data: existing } = await supabase
      .from("strains")
      .select("name");

    const existingNames = (existing || []).map((s: { name: string }) => s.name.toLowerCase());
    const count = existingNames.length;

    // Ask Claude for new strains not in our database
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Eres un experto en genética de cannabis. Nuestra base de datos tiene ${count} variedades.

Genera exactamente 5 variedades de cannabis que sean reales, populares o emergentes, y que probablemente NO estén en nuestra base de datos.

Incluye variedades nuevas del mercado, ganadoras de copas recientes, o variedades regionales poco conocidas.

Responde SOLO con un JSON array, sin explicación. Cada objeto debe tener:
- name: string (nombre real de la variedad)
- type: "indica" | "sativa" | "hybrid" | "auto"
- thc_range: string (ej: "18-24%")
- cbd_range: string (ej: "0.1-0.3%")
- flowering_days_min: number
- flowering_days_max: number
- difficulty: "easy" | "medium" | "hard"
- yield_indoor: string (ej: "400-500 g/m²")
- description: string (1-2 oraciones en español describiendo la variedad)

NO incluyas estas variedades que ya tenemos (muestra parcial): ${existingNames.slice(0, 30).join(", ")}

Responde SOLO el JSON array.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
    }

    const aiData = await response.json();
    const content = aiData.content[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in AI response");
    }

    const newStrains = JSON.parse(jsonMatch[0]);
    let added = 0;

    for (const strain of newStrains) {
      // Skip if already exists
      if (existingNames.includes(strain.name.toLowerCase())) continue;

      // Validate fields
      if (!strain.name || !strain.type || !strain.description) continue;
      if (!["indica", "sativa", "hybrid", "auto"].includes(strain.type)) continue;

      const { error } = await supabase.from("strains").insert({
        name: strain.name,
        type: strain.type,
        thc_range: strain.thc_range || null,
        cbd_range: strain.cbd_range || null,
        flowering_days_min: strain.flowering_days_min || null,
        flowering_days_max: strain.flowering_days_max || null,
        difficulty: strain.difficulty || "medium",
        yield_indoor: strain.yield_indoor || null,
        description: strain.description,
      });

      if (!error) added++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Added ${added} new strains. Total: ${count + added}`,
        added,
        total: count + added,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
