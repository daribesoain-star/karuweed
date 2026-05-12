# HANDOFF — Continuación de sesión KaruWeed

Documento de traspaso para retomar el trabajo en Mac (o cualquier otro entorno) sin perder contexto.

## 1. Setup inmediato en Mac

```bash
# Clonar (o si ya tenés el repo, fetch)
git clone <repo-url>  # daribesoain-star/karuweed
cd karuweed

# Asegurate de estar en el branch correcto
git checkout claude/monetization-mvp-strategy-Kvi7w
git pull origin claude/monetization-mvp-strategy-Kvi7w

# Instalar dependencias
npm install

# Variables de entorno
# IMPORTANTE: actualmente .env está commiteado (ver sección 6 — auditoría de seguridad)
# Si ya hiciste pull, el .env vendrá en el repo. Verificar con:
cat .env

# Si no aparece, copiar de .env.example (cuando exista) y completar con valores del
# dashboard de Supabase: https://supabase.com/dashboard/project/ymvnflwcxwgsyhramhex

# Iniciar Expo
npx expo start
```

### Herramientas recomendadas en Mac

- **Supabase CLI** (`brew install supabase/tap/supabase`) — para editar Edge Functions y aplicar migraciones
- **Expo Go** en iPhone / Android — para probar la app
- **Xcode** + simulator iOS (si vas a hacer build nativo eventualmente)
- **Android Studio** + emulator (idem)

## 2. Estado actual del proyecto

| Item | Valor |
|---|---|
| **Branch activo** | `claude/monetization-mvp-strategy-Kvi7w` |
| **Último commit** | `672825c docs: monetization strategy, pricing tiers and marketplace design` |
| **Pushed a origin** | Sí |
| **Tests** | No definidos (no hay suite todavía) |
| **CI** | No configurado |
| **Branch protection** | No definida |

## 3. Documentación — leer en este orden

Toda la estrategia está documentada. **Antes de tocar código, leer en orden**:

1. **`CLAUDE.md`** (raíz) — contexto general + reglas duras. Claude Code lo carga automático.
2. **`docs/BUSINESS_MODEL.md`** — tiers, precios, márgenes, LTV/CAC.
3. **`docs/MONETIZATION_ROADMAP.md`** — 6 fases en 22 semanas con entregables.
4. **`docs/MARKETPLACE_DESIGN.md`** — schema SQL, state machine, fulfillment mix.
5. **`docs/LEGAL_FRAMEWORK.md`** — matriz país por país, geo-locking, qué NO hacer.

## 4. Decisiones cerradas (no re-discutir en próxima sesión)

Estas decisiones están **lockeadas**. No re-abrir sin razón concreta nueva.

### Estructura de monetización

- **Free = 1 planta activa** + 3 análisis Haiku/mes + ads
- **Pro = 20 plantas** (no "ilimitado") + 50 análisis Sonnet
- **Business** (50 plantas, $19,99) y **Cooperative** (99 plantas, $39,99) son **geo-locked** a UY/AR/CO/MX/CL (Business) y UY/AR (Cooperative)
- **7 tiers totales** con caps numéricos en TODOS

### Modelo de negocio

- App **NO vende plantas ni material vegetal**
- App **NO ofrece custodia física** (descartado: plant-sitting)
- App **NO contrata servicios humanos** (descartado: coaches/mentores — riesgo de estafa/disputas)
- App **NO tiene chat usuario-a-usuario abierto** (solo chat scoped a órdenes del marketplace)
- App **SÍ vende ecosistema growshop** (iluminación, ventilación, sustratos, nutrientes, accesorios)
- Marketplace usa **3 modos de fulfillment**: pickup, envío propio del vendedor, delivery integrado con PYMES
- Delivery con **PYMES locales** (no fleet propio) — fee 12% sobre envío

### Stack técnico

- Frontend: Expo Router + RN + Zustand
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions)
- IA: Anthropic Claude (Haiku 4.5 default, Sonnet 4 para Pro+)
- Pagos: Stripe Connect (marketplace) + IAP Apple/Google (suscripciones)
- Ads: AdMob inicialmente, publicidad nativa de growshops en fase 4+

## 5. Roadmap inmediato — qué viene en código

**Fase 1 (semanas 1-4)**: Freemium base + protección de margen

Entregables concretos:

1. Migración `ai_usage_log` (tabla para contador de IA por usuario × mes)
2. Migración `subscription_tier` enum extendido
3. Migración trigger validación `plant_count` server-side
4. Edge Function `analyze-plant` actualizado:
   - Rate-limit server-side (consulta `ai_usage_log` antes de llamar a Anthropic)
   - Modelo dinámico: Haiku para free/casual/grower, Sonnet para pro+
   - Prompt caching de Anthropic activado
   - Logging de costos por llamada
5. Hook `usePlantLimit()` en `src/hooks/`
6. Hook `useIaQuota()` en `src/hooks/`
7. Componente `<PaywallModal>` en `src/components/`
8. Integración AdMob (`react-native-google-mobile-ads`)
9. Banner ads en `app/(tabs)/index.tsx` y `app/(tabs)/plants.tsx`
10. Intersticial post-checkin en `app/checkin/[plantId].tsx`
11. Rewarded ad para análisis IA extra
12. Tracking de eventos (decisión pendiente: Mixpanel / Amplitude / PostHog / Supabase analytics propia)

Detalle completo en `docs/MONETIZATION_ROADMAP.md` sección "Fase 1".

## 6. Auditoría de seguridad — PENDIENTE DE EJECUTAR

Hicimos la auditoría pero no aplicamos cambios todavía. Resumen:

### Problemas detectados

1. **`.env` commiteado en git** (en el historial, contiene `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
   - Riesgo técnico: bajo (anon key es designada pública, RLS protege)
   - Riesgo de proceso: medio (cuando agreguemos Stripe/AdMob el patrón laxo va a leakear secretos reales)

2. **Fallbacks hardcoded** en `src/lib/supabase.ts:6-7` y `src/lib/ai.ts:4-5`
   - URL + anon key duplicados en código fuente
   - Impide rotación sin tocar código

3. **`app.json`** tiene placeholder `"GOOGLE_MAPS_API_KEY_HERE"` (no es leak, pero recordar reemplazarlo vía build-time env, no hardcoded)

### Plan de remediación propuesto (6 pasos)

1. `git rm --cached .env` (untrackear, archivo local se mantiene)
2. Crear `.env.example` con placeholders vacíos y comentarios
3. Quitar fallbacks en `src/lib/supabase.ts` y `src/lib/ai.ts` (fail fast si falta env)
4. Reforzar `.gitignore` con patrones extra (`*.pem`, service account JSONs, `.env.production`)
5. Crear `docs/SECURITY.md` con política completa
6. Actualizar `CLAUDE.md` con regla: "nunca claves en código"

### Acción manual requerida del owner

**Rotar el anon key de Supabase** en el dashboard:
`Supabase → Project Settings → API → Reset anon key`

Toma 30 segundos. Cierra el capítulo del key expuesto en historial.

### Cómo retomar en Mac

Decir a Claude en la próxima sesión:

> "Ejecutá la remediación de seguridad del HANDOFF.md sección 6"

## 7. Reglas duras del proyecto (NO violar sin discusión)

Copiadas de `CLAUDE.md` para que las tengas a mano:

1. Nunca "ilimitado" en ningún tier. Todos los planes tienen cap numérico.
2. Rate-limit IA server-side obligatorio en `analyze-plant`.
3. Geo-locking para tiers Business y Cooperative.
4. No custodia física de plantas entre usuarios.
5. No venta de plantas ni material vegetal entre usuarios.
6. No chat usuario-a-usuario abierto.
7. Prompt caching obligatorio en Anthropic.
8. Modelo default: Haiku para tiers gratis/intermedios. Sonnet solo Pro+.
9. No vender datos identificables. Insights agregados anónimos OK.

## 8. Decisiones pendientes (no cerradas, requieren tu input)

- **Provider de tracking/analytics**: Mixpanel / Amplitude / PostHog / Supabase analytics propia. Recomendación: **PostHog self-hosted** (gratis, eventos ilimitados, no leakea datos a terceros).
- **Ad network fallback**: si AdMob rechaza la app por categoría cannabis → Unity Ads / AppLovin como plan B.
- **RevenueCat vs IAP nativo**: para suscripciones, RevenueCat simplifica mucho pero cobra 1%. Decidir antes de fase 1.
- **Simplificar tiers**: actualmente 7 tiers. Posible simplificación a 5 (eliminar Casual/Grower + add-on per-plant). Discutir antes de implementar.
- **Hook pre-commit de scan de secretos**: `gitleaks` o `trufflehog`. Recomendado pero opcional.

## 9. Prompts útiles para próxima sesión en Mac

Copiá y pegá según necesites:

### Continuar donde quedamos
```
Continuamos KaruWeed. Leé CLAUDE.md y HANDOFF.md para contexto completo,
después contame en 5 líneas dónde estamos y cuál es el próximo paso.
```

### Ejecutar remediación de seguridad
```
Ejecutá los 6 pasos de remediación de seguridad del HANDOFF.md sección 6.
Después de aplicar los cambios, commit + push. Yo me encargo de rotar el
anon key en Supabase dashboard manualmente.
```

### Arrancar Fase 1
```
Implementá la Fase 1 del MONETIZATION_ROADMAP.md. Empezá por la migración
de ai_usage_log y el rate-limit server-side en el Edge Function analyze-plant.
Antes de cada paso confirmame el plan.
```

### Revisar/ajustar pricing
```
Revisá docs/BUSINESS_MODEL.md y proponé ajustes si encontrás algún cálculo
inconsistente o supuesto que valga revisitar. No cambies nada todavía, solo
listame los puntos.
```

## 10. Estructura actual del repo (referencia)

```
karuweed/
├── CLAUDE.md                       ← contexto + reglas duras
├── HANDOFF.md                      ← este archivo
├── app.json                         ← Expo config (revisar Google Maps key)
├── package.json
├── tsconfig.json
├── eas.json                         ← Expo Application Services
├── .env                             ← ⚠️ trackeado, ver sección 6
├── .gitignore
├── app/                             ← Expo Router (file-based routing)
│   ├── (auth)/                     ← login/register/forgot-password
│   ├── (tabs)/                     ← home, plants, music, map, profile
│   ├── plant/                      ← new, [id], watering
│   ├── checkin/[plantId].tsx
│   └── settings.tsx
├── src/
│   ├── components/                  ← Button, Input, PlantCard, etc.
│   ├── store/                       ← Zustand: authStore, plantStore
│   ├── lib/                         ← supabase.ts, ai.ts, types.ts
│   └── hooks/                       ← (vacío — fase 1 agregará usePlantLimit, useIaQuota)
├── supabase/
│   ├── functions/
│   │   ├── analyze-plant/          ← Edge Function de IA (agregar rate-limit)
│   │   └── update-strains/         ← seed de strains
│   └── migrations/                 ← schema (agregar ai_usage_log en fase 1)
├── assets/                          ← iconos, splash, imágenes
└── docs/                            ← estrategia
    ├── BUSINESS_MODEL.md
    ├── MONETIZATION_ROADMAP.md
    ├── MARKETPLACE_DESIGN.md
    └── LEGAL_FRAMEWORK.md
```

## 11. Información de contacto y proyectos vinculados

- **Repo GitHub**: `daribesoain-star/karuweed`
- **Supabase project**: `ymvnflwcxwgsyhramhex` (URL completa en `.env`)
- **Anthropic API**: configurado como secret en Edge Function (no exposed)
- **Stripe / AdMob / Google Maps**: aún no configurados

## 12. Última conversación — temas tratados (síntesis)

Para que recuerdes/repases el hilo:

1. ✓ Mapa inicial del proyecto + estructura freemium
2. ✓ Cálculo de costos IA realistas (Sonnet vs Haiku, prompt caching)
3. ✓ % de margen por usuario y blended ARPU
4. ✓ LTV/CAC + estrategia de escala (ASO, TikTok, referrals, sin paid ads)
5. ✓ Descarte de plant-sitting (riesgo legal de custodia física)
6. ✓ Pivote a marketplace de ecosistema growshop (legal en toda LATAM)
7. ✓ Comparativa con Mercado Libre (comisiones 11-22%)
8. ✓ Delivery con PYMES locales (zero capex, fee sobre envío)
9. ✓ Modelo mix de fulfillment (pickup / envío propio / delivery integrado)
10. ✓ Chat scoped a orden como respaldo legal
11. ✓ Pricing per-plant ($1,99/planta) como middle tier
12. ✓ Descarte de "ilimitado" — Pro caps a 20 plantas
13. ✓ Caps Business/Cooperative alineados a marcos legales (UY IRCCA 99)
14. ✓ Descarte de coaches/mentores humanos (riesgo de estafa/robo)
15. ✓ Confirmación: solo productos, sin servicios humanos
16. ✓ Documentación consolidada en `docs/`
17. ⚠ Auditoría de seguridad hecha, remediación NO aplicada todavía
18. ▶ Siguiente: ejecutar remediación de seguridad O arrancar fase 1

---

**Generado en sesión Claude Code Web. Continuar desde aquí en Mac.**
