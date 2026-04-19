# KaruWeed — Guía para Claude

App React Native (Expo) + Supabase para el seguimiento de cultivo personal de cannabis. Compañera de cultivo con análisis IA por foto, bitácora de check-ins, log de riego/nutrientes y base de datos de strains.

## Stack

- **Frontend**: Expo Router, React Native, TypeScript, Zustand, Tailwind (nativewind)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **IA**: Anthropic Claude (Sonnet para Pro, Haiku para tiers inferiores) vía Edge Function `supabase/functions/analyze-plant`
- **Idioma UI**: Español (mercado LATAM)
- **Pagos**: Stripe Connect (fase marketplace) + IAP Apple/Google (fase freemium)

## Archivos clave

- `src/store/plantStore.ts` — CRUD de plantas (incluirá `addPlant` con validación de cap por tier)
- `src/store/authStore.ts` — Sesión y `subscription_tier`
- `src/lib/types.ts` — Tipos, incluido `subscription_tier: 'free' | 'pro' | ...`
- `supabase/functions/analyze-plant/index.ts` — Llamada a Anthropic (necesita rate-limit server-side)
- `app/(tabs)/` — Pantallas principales (home, plants, music, map, profile)
- `app/plant/new.tsx` — Creación de planta (gate de paywall)
- `app/plant/[id].tsx` — Detalle + historial
- `supabase/migrations/` — Schema (incluirá tablas de monetización/marketplace)

## Estrategia de monetización (leer antes de tocar pricing/IA)

El plan completo está documentado en `docs/`. **Leer siempre antes de proponer cambios de pricing, límites, IA o marketplace.**

- `docs/BUSINESS_MODEL.md` — Tiers, precios, márgenes, distribución de ingresos
- `docs/MONETIZATION_ROADMAP.md` — 6 fases en ~22 semanas
- `docs/MARKETPLACE_DESIGN.md` — Growshops, fulfillment mix, delivery PYMES
- `docs/LEGAL_FRAMEWORK.md` — Marco legal por país, geo-locking, caps

## Reglas duras — no violar sin discusión previa

1. **Nunca "ilimitado"** en ningún tier. Todos los planes tienen cap numérico.
2. **Rate-limit IA server-side obligatorio** en `analyze-plant` (contador en `ai_usage_log` por usuario/mes). Jamás confiar solo en el cliente.
3. **Geo-locking** para tiers Business y Cooperative (solo países con marco legal claro).
4. **No custodia física** de plantas entre usuarios. Nada de "plant-sitting" ni coaches pagados. La app es de autocultivo.
5. **No venta de plantas ni material vegetal** entre usuarios. El marketplace vende solo el ecosistema (luces, nutrientes, sustratos, accesorios).
6. **No chat usuario-a-usuario abierto**. Solo chat scoped a órdenes del marketplace.
7. **Prompt caching obligatorio** en Anthropic para reducir costo (prompt sistema es fijo).
8. **Modelo por defecto**: Haiku 4.5 para tiers gratis/intermedios. Sonnet solo para Pro+.
9. **No vender datos identificables** de usuarios. Los insights agregados (strain × producto × resultado) sí se pueden monetizar anónimos.

## Tiers activos (fuente de verdad en BUSINESS_MODEL.md)

| Tier | Precio | Plantas | IA/mes | Geo |
|---|---|---|---|---|
| Free | $0 | 1 | 3 Haiku | Todos |
| Casual | $1,99/mes | 2 | 10 Haiku | Todos |
| Grower | $3,49/mes | 5 | 20 Haiku | Todos |
| Pro | $4,99/mes | 20 | 50 Sonnet | Todos |
| Pro anual | $39,99/año | 20 | 50 Sonnet | Todos |
| Business | $19,99/mes | 50 | 150 Sonnet | UY/AR/CO/MX/CL |
| Cooperative | $39,99/mes | 99 | 300 Sonnet | UY/AR |

## Convenciones de código

- Textos UI en español
- No agregar features fuera del scope sin discusión
- Fase 1 = freemium básico; NO tocar marketplace/delivery hasta fase 4+
- Antes de llamar a Anthropic desde cualquier lugar: verificar cuota y loggear en `ai_usage_log`
- Migraciones Supabase van en `supabase/migrations/` con timestamp

## Branch de trabajo actual

`claude/monetization-mvp-strategy-Kvi7w` — todo el desarrollo de monetización va acá hasta que se apruebe merge.
