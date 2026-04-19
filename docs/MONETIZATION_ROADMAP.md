# Roadmap de Monetización — KaruWeed

Plan en **6 fases, ~22 semanas**, validando revenue en cada fase antes de pasar a la siguiente.

## Principios

1. **Validar antes de escalar**: cada fase entrega revenue medible antes de invertir en la siguiente.
2. **Reversible**: cada feature monetaria puede apagarse vía feature flag sin romper la app.
3. **Orden por riesgo y ROI**: lo más simple y de menor riesgo primero (freemium), lo más complejo al final (delivery).
4. **Tech debt cero en fundaciones**: rate-limit IA y multi-tier están desde el día 1.

## Fase 1 — Freemium base + protección de margen (semanas 1-4)

**Objetivo**: evitar sangrar dinero con el uso actual y sacar los primeros ingresos por ads.

### Entregables

1. **Tabla `ai_usage_log`** + migración Supabase (cuenta análisis por user × mes).
2. **Rate-limit server-side en Edge Function `analyze-plant`**: consulta cuota antes de llamar a Anthropic.
3. **Migración de modelo a Claude Haiku 4.5** para tiers no-Pro + Sonnet solo para Pro+.
4. **Prompt caching** activado en llamadas a Anthropic.
5. **Enum de tiers en `profiles.subscription_tier`** actualizado: `free | casual | grower | pro | pro_annual | business | cooperative`.
6. **Cap de plantas activas por tier** en `src/store/plantStore.ts` (validación cliente) + trigger DB (validación server).
7. **Componente `<PaywallModal>`** con comparativa de tiers.
8. **Hook `usePlantLimit()`** y `useIaQuota()`.
9. **Integración AdMob** (`react-native-google-mobile-ads`): banner en home/plants + intersticial post-checkin.
10. **Rewarded ad** para desbloquear análisis IA extra (1 video = 1 análisis Haiku).
11. **Tracking básico**: eventos `plant_limit_hit`, `paywall_view`, `ad_impression`, `ai_quota_exceeded`.

### Criterios de éxito

- Costo IA mensual total no supera proyección ($0,036/usuario free promedio).
- 0% de usuarios con más del cap de plantas.
- Ads generan >=$0,15/usuario/mes.

### Riesgos específicos

- AdMob puede rechazar la app por categoría cannabis → tener Unity Ads / AppLovin como fallback.
- Rewarded ads pueden tener fill rate bajo en LATAM → offline fallback a paywall.

## Fase 2 — Afiliados a growshops (semanas 5-7)

**Objetivo**: primer revenue de comercio sin inventario ni logística.

### Entregables

1. **Tabla `products`** (catálogo curado estático, 30-50 productos iniciales).
2. **Tabla `affiliate_clicks`** para tracking.
3. **Pantalla Shop** en tab nueva o integrada al mapa existente (`app/(tabs)/map.tsx`).
4. **Deep-links con UTM tracking** a growshops partner.
5. **Panel admin simple** para cargar/editar productos (puede ser SQL directo al principio).
6. **Deals con 5-10 growshops** de Chile/Argentina/Uruguay como afiliados (comisión 5-15%).

### Criterios de éxito

- >=3% de usuarios activos hace click en productos/mes.
- >=$0,15/usuario/mes de revenue por afiliación.

## Fase 3 — Contextual commerce (semanas 8-10)

**Objetivo**: convertir cada análisis IA en oportunidad de venta. La palanca que cambia la economía.

### Entregables

1. **Tabla `issue_product_map`**: mapea keywords de `identified_issues` → `product_tags`.
2. **Modificación del Edge Function**: tras devolver análisis, enriquecer la respuesta con `recommended_products` (top 3).
3. **UI post-checkin**: card "Productos recomendados para este problema" con CTA de compra/click.
4. **Panel admin para tagging manual** de productos nuevos (luego automatizar con IA).
5. **Tracking de conversión**: `ia_recommendation_shown`, `ia_recommendation_clicked`, `ia_recommendation_purchased`.
6. **Programa de referral entre usuarios** (invita amigo → ambos 1 mes de Casual gratis).

### Criterios de éxito

- Attach rate IA → compra >=8%.
- Revenue por affiliate sube >=2x vs fase 2.
- Viral coefficient k >=0,2 del referral.

## Fase 4a — Marketplace v1 con envío del vendedor (semanas 11-13)

**Objetivo**: growshops venden directo en la app, con logística propia. 70% del valor del marketplace con 30% del trabajo.

### Entregables

1. **Onboarding de growshops** (self-service o manual asistido): verificación de negocio, KYC básico, conexión Stripe Connect.
2. **Panel de growshop**: gestión de catálogo propio, estado de órdenes, reportes.
3. **Tablas `orders`, `order_items`, `order_messages`, `order_proofs`** (ver `MARKETPLACE_DESIGN.md`).
4. **Checkout flow** con Stripe, split automático (growshop - 10% comisión, plataforma 10%).
5. **Chat de orden** (Supabase Realtime) entre comprador y growshop, solo scoped a orden activa.
6. **Sistema de proof**: obligatoriedad de subir tracking code + foto de despacho.
7. **State machine de orden**: `created → paid → preparing → shipped → delivered → closed` con timeouts.
8. **Dispute resolution básico**: reembolso automático si growshop no despacha en SLA.
9. **Retención de pagos**: Stripe liberado 7 días post-entrega confirmada.

### Criterios de éxito

- >=20 growshops con catálogo activo.
- <5% tasa de disputas.
- Tiempo promedio preparación < 48h.

## Fase 4b — Pickup en tienda (semanas 14-15)

**Objetivo**: modo de fulfillment más barato para growshops cercanos.

### Entregables

1. **Flag `allows_pickup`** en producto y configuración de dirección en growshop.
2. **QR de retiro único** por orden (generado al pago, validado al retirar).
3. **Notificación al cliente** cuando el pedido está listo para retirar.
4. **Confirmación de retiro** con foto + QR scan por parte del growshop.

### Criterios de éxito

- >=15% de órdenes usan pickup.
- Tiempo "pagado a listo" < 6h promedio.

## Fase 5 — Delivery integrado con PYMES (semanas 16-19)

**Objetivo**: cubrir el "último kilómetro" con partners locales, ingreso extra por fee de envío.

### Entregables

1. **Tablas `delivery_partners`, `delivery_zones`, `deliveries`**.
2. **Onboarding de 5-10 PYMES piloto** (Santiago, BA, Montevideo): contrato simple, SLA, seguro.
3. **Matchmaking geográfico**: asignar partner más cercano automáticamente o dejar que growshop elija.
4. **Split de pago tripartito**: growshop + PYME + plataforma en la misma transacción Stripe.
5. **Tracking básico**: estados `assigned → picked_up → in_transit → delivered`.
6. **Rating bidireccional** growshop ↔ PYME ↔ cliente.
7. **Fallback a courier nacional** (Chilexpress/OCA/Starken) cuando no hay cobertura PYME.
8. **UI de selección de entrega** en checkout: pickup / envío propio growshop / delivery integrado.

### Criterios de éxito

- >=5 PYMES activas con >=20 entregas/mes cada una.
- Fee de envío genera >=$0,20/usuario activo/mes.
- NPS delivery >=40.

## Fase 6 — Planes pagos para growshops (semanas 20-22)

**Objetivo**: ingreso recurrente fijo por suscripciones B2B a la plataforma.

### Entregables

1. **Sistema de suscripciones para growshops** (aprovechar tabla `store_subscriptions`).
2. **Tiers Silver ($29), Gold ($79), Platinum ($199)** con features diferenciadas:
   - Catálogo: 10 / 50 / ilimitado
   - Destacado en búsquedas: No / Sí / Sí
   - Banner home: No / No / Sí
   - Notificaciones push a usuarios cercanos: No / No / Sí
   - Priority en `issue_product_map`: No / No / Sí (pagan por aparecer en recomendaciones IA)
   - Analytics: Básico / Avanzado / Full + API
3. **Dashboard de métricas** por growshop: impresiones, clicks, conversiones, rating.
4. **Publicidad nativa**: banners de growshops Gold/Platinum reemplazan progresivamente AdMob.

### Criterios de éxito

- >=30% de growshops activos en plan pago.
- Revenue suscripciones growshop >=$2.000/mes.
- CTR de publicidad nativa >2x vs AdMob.

## Fase 7 (opcional, futura) — Tienda propia dropshipping

**Objetivo**: control total del margen en productos de mayor demanda.

Solo después de validar atencion del mercado en fases 2-5. **No planificar antes de tener datos de fase 5**.

### Pre-requisitos antes de arrancar

- Atención en afiliados: ticket promedio medido
- Top 20 productos más clickeados/comprados identificados
- Acuerdo con 1-2 importadores/distribuidores
- Estructura legal (SpA Chile, SRL AR, SAS CO, etc.)

## Resumen de timeline

```
Mes 1: Fase 1 (freemium)         → Revenue: ads $15-25/mes por 100 usuarios
Mes 2: Fase 2 (afiliados)         → Revenue: +$15/mes por 100 usuarios
Mes 3: Fase 3 (contextual)        → Revenue: +$30/mes por 100 usuarios
Mes 4-5: Fase 4a + 4b (marketplace básico) → Revenue: +$60/mes por 100 usuarios
Mes 5-6: Fase 5 (delivery)        → Revenue: +$25/mes por 100 usuarios
Mes 6: Fase 6 (planes growshop)   → Revenue recurrente B2B: +$50/mes por 100 usuarios activos
```

Target al cierre de fase 6: **~$200-240/mes revenue por cada 100 usuarios activos** (ARPU $2-2,40).

## KPIs permanentes a monitorear

| Métrica | Target | Frecuencia |
|---|---|---|
| DAU / MAU | >25% | Semanal |
| D7 retention | >25% | Semanal |
| D30 retention | >10% | Mensual |
| Conversión free → pago | >8% | Mensual |
| Churn Pro mensual | <8% | Mensual |
| Costo IA por usuario | <$0,05 free, <$1,30 Pro | Semanal |
| ARPU blended | Crecimiento MoM | Mensual |
| NPS | >40 | Trimestral |

## Qué NO hacer

- **No empezar el marketplace antes de tener revenue por freemium**. Un marketplace vacío mata al producto.
- **No agregar custodia física de plantas, coaching pagado, o chat usuario-a-usuario abierto** (riesgos de robo, estafa, responsabilidad legal imposibles de gestionar para un equipo chico).
- **No lanzar Business/Cooperative fuera de países permitidos** — geo-locking obligatorio.
- **No vender semillas o material vegetal entre usuarios**. El marketplace es solo ecosistema (luces, fertilizantes, sustratos, accesorios, merchandising).
- **No escalar a >20 plantas en Pro individual**. Eso es negocio comercial, no hobby, y requiere otro producto.
