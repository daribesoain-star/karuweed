# Modelo de Negocio — KaruWeed

Este documento consolida la estrategia de monetización acordada. Es la **fuente de verdad** para cualquier decisión de pricing, tiers, límites o comisiones.

## Resumen ejecutivo

KaruWeed opera un modelo **freemium multicapa** + **marketplace de ecosistema growshop** + **delivery marketplace con PYMES**. Sin custodia física de plantas, sin venta de material vegetal entre usuarios, sin servicios de coaching humano (descartados por riesgo).

## Supuestos de costo — base para toda la matemática

### Costos por análisis IA (Anthropic)

| Modelo | Input $/M | Output $/M | Costo típico (1-4 fotos, respuesta 700-1000 tok) |
|---|---|---|---|
| Claude Haiku 4.5 | $1 | $5 | ~$0,008 (1 foto) / ~$0,018 (4 fotos) |
| Claude Sonnet 4 | $3 | $15 | ~$0,016 (1 foto) / ~$0,034 (4 fotos) |

Con **prompt caching** (prompt sistema fijo, cachear ahorra ~50% en repetidas): costo promedio **~$0,012/análisis Haiku**, **~$0,025/análisis Sonnet**.

### Costos de infraestructura por usuario/mes

| Item | Costo |
|---|---|
| Supabase (storage, DB, bandwidth, edge) | ~$0,01 |
| Storage de fotos (~20 por usuario/mes) | ~$0,001 |
| Push notifications | ~$0,002 |
| Overhead fijo prorrateado | ~$0,005 |
| **Total infra por usuario** | **~$0,02** |

### Comisiones de stores (Apple / Google)

- **Año 1**: 30% (suscripción estándar)
- **Año 2+**: 15% (Small Business Program, elegible <$1M revenue)

### Ingreso de ads (AdMob, nicho LATAM)

- Banner eCPM: $0,30-1,00 → ~$0,05-0,10/usuario/mes
- Intersticial eCPM: $2-5 → ~$0,04-0,08/usuario/mes
- Rewarded eCPM: $5-12 → ~$0,10-0,25/usuario/mes (opción más rentable)
- **Blended realista**: **$0,15-0,40/usuario/mes**

## Estructura de tiers

### Free

| Atributo | Valor |
|---|---|
| Precio | $0 |
| Plantas activas | 1 |
| Análisis IA/mes | 3 (Haiku, 1 foto cada uno) |
| Fotos por análisis | 1 |
| Watering log avanzado (pH/EC/nutrientes) | No |
| Ads | Sí (banner + intersticial tras acciones + rewarded opcional) |
| Export / sharing | No |
| Música | No |

**Math por usuario/mes**:
- Ingreso ads blended: +$0,25
- Costo IA (3 × $0,012): -$0,036
- Costo infra: -$0,013
- Overhead: -$0,005
- **Margen neto: +$0,196 (~78%)**

### Casual — $1,99/mes

| Atributo | Valor |
|---|---|
| Plantas activas | 2 |
| Análisis IA/mes | 10 (Haiku, hasta 2 fotos) |
| Ads | Solo banner reducido |
| Watering log avanzado | No |

**Math**:
- Neto post-store (año 2+): $1,69
- Costo IA (10 × $0,018): -$0,18
- Infra: -$0,03
- **Margen: $1,48 (~88%)**

### Grower — $3,49/mes

| Atributo | Valor |
|---|---|
| Plantas activas | 5 |
| Análisis IA/mes | 20 (Haiku, hasta 2 fotos) |
| Ads | Sin banner (solo rewarded opcional) |
| Watering log avanzado | Sí |
| Export básico | Sí (PDF simple) |

**Math**:
- Neto post-store: $2,97
- Costo IA (20 × $0,018): -$0,36
- Infra: -$0,06
- **Margen: $2,55 (~86%)**

### Pro — $4,99/mes (tier estrella)

| Atributo | Valor |
|---|---|
| Plantas activas | **20 (cap duro)** |
| Análisis IA/mes | 50 (Sonnet, hasta 4 fotos) |
| Ads | No |
| Watering log avanzado | Sí completo |
| Export PDF/CSV | Sí |
| Música (si se implementa) | Sí |
| Notificaciones inteligentes | Sí |

**Math**:
- Neto post-store (año 2+): $4,24
- Costo IA (cap 50 × $0,025): -$1,25
- Infra escalada: -$0,15
- Overhead: -$0,10
- **Margen a cap de uso: $2,74 (~65%)**
- **Margen uso típico (5-8 plantas, 20 análisis): ~$3,20 (~76%)**

### Pro anual — $39,99/año

Equivale a ~$3,33/mes (33% descuento). Mismas features que Pro. Ventaja: cashflow adelantado, reduce churn mensual. Margen porcentual similar a Pro mensual pero **LTV mayor** por lock de 12 meses.

### Business — $19,99/mes (geo-locked)

| Atributo | Valor |
|---|---|
| Plantas activas | 50 |
| Análisis IA/mes | 150 Sonnet |
| Usuarios | 1 admin + 5 viewers |
| Reportes consolidados | Sí (PDF/CSV) |
| Export para compliance local | Sí |
| Países habilitados | UY, AR, CO, MX, CL |

**Math**:
- Neto: $17
- IA cap: -$3,75
- Plantas (50 × $0,03): -$1,50
- Multi-user overhead: -$0,50
- **Margen: $11,25 (~66%)**

Target: cooperativas chicas, agrupaciones medicinales, growshops escuela.

### Cooperative — $39,99/mes (geo-locked)

| Atributo | Valor |
|---|---|
| Plantas activas | 99 (cap legal UY) |
| Análisis IA/mes | 300 Sonnet |
| Usuarios | 1 admin + 30 viewers |
| Export IRCCA/REPROCANN | Sí |
| API de consulta | Sí |
| Panel web | Sí |
| Soporte WhatsApp dedicado | Sí |
| Países habilitados | UY, AR únicamente |

**Math**:
- Neto: $33,99
- IA cap: -$7,50
- Plantas (99 × $0,03): -$2,97
- Multi-user + soporte: -$2,30
- **Margen: $21,22 (~62%)**

Target: clubes cannábicos Uruguay (registrados IRCCA), asociaciones civiles Argentina con REPROCANN colectivo.

## Revenue streams adicionales (fase marketplace)

### 1. Comisión marketplace de productos

- **10% sobre cada venta** (vs 11-16% de ML, posicionamiento competitivo)
- Aplicable a todos los growshops listados
- Sin costo fijo por publicación

### 2. Planes de visibilidad para growshops (aprovecha tabla `stores` existente con `tier`)

| Plan growshop | Precio/mes | Beneficios |
|---|---|---|
| Basic | $0 | Perfil en mapa, catálogo básico (hasta 10 productos) |
| Silver | $29 | Catálogo hasta 50, destacado en búsquedas, analytics |
| Gold | $79 | Ilimitado productos, banner home, notificaciones push a usuarios cercanos |
| Platinum | $199 | Featured en recomendaciones IA (prioridad en `issue_product_map`), API |

### 3. Fee sobre envíos (fase delivery PYMES)

- **12% sobre el costo de envío** cuando se usa delivery integrado
- **Fee fijo $0,50-1** por orden cuando el vendedor usa envío propio (cubre infra de chat/proof)
- 0% cuando es pickup en tienda

### 4. Publicidad nativa de growshops

Reemplaza AdMob en fase 4+ con banners/cards de growshops locales (eCPM mucho mayor, $5-15 vs $0,30-1 de AdMob genérico).

## Distribución esperada de usuarios (modelo blended)

Asumiendo 100 usuarios activos post fase 4:

| Segmento | % | Revenue neto/mes |
|---|---|---|
| Free | 55 | $10,78 (ads) |
| Casual (1 planta extra) | 20 | $33,80 |
| Grower (5 plantas) | 12 | $35,64 |
| Pro | 10 | $28,90 |
| Business | 2 | $34,00 |
| Cooperative | 1 | $33,99 |
| **Suscripciones total** | 100 | **$177,11** |
| + Marketplace (attach 10%, ticket $40, 10% comisión) | | +$40,00 |
| + Fee envíos (8% órdenes × $0,80) | | +$6,40 |
| + Publicidad nativa growshop (reemplaza AdMob) | | +$15,00 (incremental sobre ads) |
| **Total revenue / 100 usuarios** | | **~$238,50/mes** |

**ARPU final objetivo: ~$2,38/usuario activo/mes** (vs $0,44 solo con freemium + ads).

## LTV / CAC

### LTV por tier (churn asumido)

| Tier | Churn mensual | Vida promedio | LTV |
|---|---|---|---|
| Free | 20% | 5 meses | $0,98 |
| Casual | 12% | 8 meses | $11,84 |
| Grower | 10% | 10 meses | $25,50 |
| Pro mensual | 7% | 14 meses | $44,80 |
| Pro anual | 3% efectivo | 24+ meses | $75+ |
| Business | 5% | 20 meses | $225 |
| Cooperative | 3% | 33 meses | $700 |

**Blended LTV** (con distribución de arriba): **~$28/usuario**

### CAC objetivo (ratio 3:1 sano)

**CAC máximo: $9,30/signup convertido a paga** — o **~$2,30/signup total** si contás free.

Canales viables:
- ASO (App Store SEO)
- TikTok/IG orgánico
- Reddit/foros nicho
- Referrals (programa incorporado en fase 3)
- Partnerships con growshops (co-marketing)

**Paid ads en Meta/Google no cierran** en este nicho (CPI $2-5, pero restricciones de categoría cannabis).

## Proyección de 3 años (conservadora)

| Mes | Usuarios activos | MRR neto |
|---|---|---|
| 6 | 1.000 | ~$380 |
| 12 | 5.000 | ~$2.500 |
| 18 | 15.000 | ~$8.500 |
| 24 | 35.000 | ~$22.000 |
| 36 | 80.000 | ~$55.000 |

Break-even operativo: **mes 6** aproximado. Negocio sostenible de 1 persona: **mes 24**.

## Riesgos del modelo

1. **eCPM de ads puede ser menor al estimado** → mitigación: rewarded ads + publicidad nativa growshop en fase 4+.
2. **Costo de IA subiendo** → mitigación: Haiku default, prompt caching, cap estricto, evaluar modelo open-source fine-tuned a largo plazo.
3. **Abuso del cap IA** sin rate-limit server-side → mitigación: tabla `ai_usage_log` consultada en Edge Function antes de llamar a Anthropic.
4. **Churn Pro alto** → mitigación: plan anual, notificaciones inteligentes, gamificación de rachas.
5. **Políticas de stores** (Apple rechaza cannabis) → mitigación: posicionar como "cultivo de plantas medicinales", evitar lenguaje explícito.

## Variables no resueltas (requieren decisión antes de fase 4)

- Precio exacto de `Pro+` tier intermedio si se crea (actualmente salto grande de $4,99 a $19,99).
- Si simplificar a 5 tiers (eliminar Casual/Grower a favor de add-ons per-plant).
- Comisión para growshops que traigan clientes nuevos vía código de referido (affiliate inverso).
