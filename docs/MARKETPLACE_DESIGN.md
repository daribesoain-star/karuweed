# Diseño del Marketplace — KaruWeed

Marketplace de productos del **ecosistema growshop** (iluminación, ventilación, sustratos, nutrientes, medidores, accesorios, merchandising). **No vende plantas ni material vegetal.**

## Principios de diseño

1. **Zero inventario propio** en fases 1-6. KaruWeed es plataforma, no vendedor.
2. **Fulfillment mix flexible**: 3 modos coexistiendo (pickup, envío propio del vendedor, delivery integrado con PYMES).
3. **Chat de orden como respaldo legal**: toda evidencia de despacho/entrega queda registrada.
4. **State machine estricta**: transiciones de estado validadas, timeouts automáticos, reembolsos automáticos por fallo de SLA.
5. **Responsabilidad clara**: plataforma es intermediaria; vendedor responde por producto; PYME responde por transporte.
6. **Recomendaciones IA integradas**: el motor de análisis de plantas sugiere productos específicos para los `identified_issues` detectados.

## Actores

| Actor | Qué hace | Revenue |
|---|---|---|
| **Comprador** (usuario final) | Compra productos | Paga |
| **Growshop** | Lista catálogo, recibe orden, prepara, despacha/entrega | Cobra producto (-10% comisión) |
| **PYME delivery** (opcional, modo integrado) | Retira del growshop, entrega al comprador | Cobra envío (-12% fee plataforma) |
| **KaruWeed** (plataforma) | Intermediario, chat, pagos, disputes, IA recomendadora | 10% comisión producto + 12% fee envío integrado + $0,50 fee fijo envío propio + suscripciones growshop |

## Modos de fulfillment

### Modo A — Pickup en tienda

Flujo:
1. Comprador paga en app
2. Growshop recibe notificación, prepara pedido
3. Growshop marca "listo para retirar" + genera QR
4. Comprador va al local, muestra QR
5. Growshop valida QR, entrega, captura foto

**Pagos**:
- Sin costo de envío (o fee simbólico $0,50 para cubrir QR/infra)
- Split: 90% growshop / 10% plataforma

**Responsabilidad**: growshop hasta la entrega física.

### Modo B — Envío propio del vendedor

Flujo:
1. Comprador paga (producto + envío cotizado)
2. Growshop prepara
3. Growshop envía por su medio (Chilexpress, Starken, OCA, Mercadotransporte, courier propio, etc.)
4. **Growshop OBLIGATORIAMENTE sube al chat de orden**:
   - Foto del paquete despachado
   - Código de seguimiento
   - Nombre del carrier
5. Comprador recibe push con tracking
6. Comprador confirma recepción (o hay timeout de 7 días post-entrega estimada)

**Pagos**:
- Comprador paga producto + envío (costo definido por growshop)
- Split: producto (90% growshop / 10% plataforma), envío ($0,50 fee fijo plataforma / resto growshop)

**Responsabilidad**: growshop 100% por transporte.

**Variantes de pago de envío**:
- `shipping_buyer_pays` — default
- `shipping_included` — precio del producto incluye envío
- `shipping_quote_on_request` — productos pesados (tiendas 3x3, kits grandes), se cotiza por chat antes de pagar

### Modo C — Delivery integrado con PYMES (fase 5+)

Flujo:
1. Comprador paga (producto + envío calculado automáticamente según zona/peso)
2. Plataforma asigna PYME de la zona con mejor rating
3. Growshop recibe notificación + tiempo estimado de pickup
4. PYME retira del growshop (marca `picked_up`)
5. PYME entrega al comprador, foto de proof + opcional firma
6. Comprador confirma o abre disputa

**Pagos**: split tripartito vía Stripe Connect:
- Producto: 90% growshop / 10% plataforma
- Envío: 88% PYME / 12% plataforma

**Responsabilidad**: PYME por transporte; growshop por producto (contenido/estado en origen).

## Schema de datos

```sql
-- Tabla existente: stores (growshops), con tier basic/silver/gold/platinum ya disponible
-- Se extiende con store_subscriptions para planes pagos B2B

-- PRODUCTOS Y CATÁLOGO

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES product_categories(id),
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD', -- USD/CLP/ARS/MXN/UYU/COP/BRL
  stock integer, -- null = unlimited / on-demand
  image_urls text[],
  weight_g integer,
  allows_pickup boolean DEFAULT true,
  allows_seller_shipping boolean DEFAULT true,
  allows_integrated_delivery boolean DEFAULT false,
  seller_shipping_default_cost_cents integer,
  shipping_payment_mode text CHECK (shipping_payment_mode IN ('buyer_pays','included','quote_on_request')),
  affiliate_url text, -- fase 2, para modo afiliado
  commission_pct numeric DEFAULT 10,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES product_categories(id),
  icon_name text,
  sort_order integer DEFAULT 0
);

CREATE TABLE product_tags (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY (product_id, tag)
);

-- MAPEO IA → PRODUCTO (el núcleo del contextual commerce)

CREATE TABLE issue_product_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_keyword text NOT NULL, -- ej: "deficiencia_nitrogeno", "hongo_oidio", "araña_roja"
  product_tag text NOT NULL,
  priority integer DEFAULT 50, -- 0-100, growshops Platinum pueden pagar por priority alto
  stage_filter text[], -- opcional: ['vegetative','flowering']
  created_at timestamptz DEFAULT now()
);

-- AFILIADOS (FASE 2)

CREATE TABLE affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  product_id uuid REFERENCES products(id),
  store_id uuid REFERENCES stores(id),
  source text, -- 'ia_recommendation' | 'browse' | 'search' | 'map'
  clicked_at timestamptz DEFAULT now(),
  converted boolean DEFAULT false,
  converted_at timestamptz,
  commission_earned_cents integer
);

-- ÓRDENES (FASE 4+)

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id),
  store_id uuid REFERENCES stores(id),
  fulfillment_mode text NOT NULL CHECK (fulfillment_mode IN ('pickup','seller_shipping','integrated_delivery')),
  status text NOT NULL CHECK (status IN ('created','paid','preparing','shipped','out_for_delivery','delivered','completed','disputed','refunded','cancelled')),
  total_product_cents integer NOT NULL,
  total_shipping_cents integer DEFAULT 0,
  currency text NOT NULL,
  platform_fee_cents integer NOT NULL,
  shipping_payment_mode text,
  shipping_address jsonb, -- para shipping/delivery
  pickup_address jsonb,   -- para pickup
  pickup_qr_code text,    -- generado en modo pickup
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  -- Timeouts
  preparation_deadline timestamptz, -- 48h post-paid
  dispatch_deadline timestamptz,     -- 5 días hábiles post-paid
  delivery_deadline timestamptz,     -- según modo
  dispute_deadline timestamptz,      -- 7 días post-delivered
  -- Timestamps de transiciones
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  preparing_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  qty integer NOT NULL,
  unit_price_cents integer NOT NULL,
  line_total_cents integer NOT NULL
);

-- CHAT SCOPED A ORDEN

CREATE TABLE order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  sender_type text CHECK (sender_type IN ('buyer','seller','delivery','system')),
  sender_id uuid,
  message_type text CHECK (message_type IN ('text','tracking_code','photo_proof','pickup_confirm','system_event')),
  content text,
  media_url text,
  tracking_code text,
  carrier text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- PROOFS (evidencia formal para resolución de disputas)

CREATE TABLE order_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  proof_type text CHECK (proof_type IN ('dispatch_photo','tracking_receipt','pickup_confirmation','delivery_photo','delivery_signature')),
  media_url text,
  tracking_code text,
  carrier text,
  uploaded_by_type text, -- 'seller' | 'delivery'
  uploaded_by_id uuid,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- DELIVERY PYMES (FASE 5)

CREATE TABLE delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_code text NOT NULL,
  contact_phone text,
  contact_email text,
  rating_avg numeric DEFAULT 5.0,
  rating_count integer DEFAULT 0,
  commission_pct numeric DEFAULT 12,
  insurance_provider text,
  insurance_valid_until date,
  verified_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id uuid REFERENCES delivery_partners(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  city text NOT NULL,
  commune text,
  base_fee_cents integer,
  per_km_fee_cents integer,
  estimated_hours integer
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  delivery_partner_id uuid REFERENCES delivery_partners(id),
  pickup_address jsonb,
  dropoff_address jsonb,
  status text CHECK (status IN ('assigned','accepted','picked_up','in_transit','delivered','failed')),
  assigned_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  fee_charged_cents integer,
  fee_to_partner_cents integer,
  fee_to_platform_cents integer,
  tracking_code text,
  proof_of_delivery_url text
);

CREATE TABLE delivery_ratings (
  delivery_id uuid REFERENCES deliveries(id),
  rater_type text CHECK (rater_type IN ('buyer','seller')),
  rater_id uuid,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (delivery_id, rater_type, rater_id)
);

-- SUSCRIPCIONES DE GROWSHOPS (FASE 6)

CREATE TABLE store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  plan text CHECK (plan IN ('basic','silver','gold','platinum')),
  price_cents integer,
  currency text,
  stripe_subscription_id text,
  started_at timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  active boolean DEFAULT true
);
```

## State machine de orden

```
created
  ↓ (payment succeeded)
paid
  ↓ (seller confirms preparation OR 48h timeout → refund)
preparing
  ↓ (seller uploads dispatch proof + tracking)
shipped
  ↓ (carrier updates OR delivery partner marks in_transit)
out_for_delivery   (solo en modo integrated_delivery)
  ↓ (delivery confirmed with proof)
delivered
  ↓ (buyer confirms OR 7 days timeout)
completed  (pagos liberados al growshop/PYME)

Ramas de error:
paid → no preparation in 48h → cancelled (refund auto)
preparing → no dispatch in 5 business days → cancelled (refund auto)
any state → buyer opens dispute → disputed (payout freeze)
disputed → admin resolves → refunded | completed
```

## Prompt caching en Anthropic (reducción de costo)

El prompt sistema del Edge Function `analyze-plant` es fijo (~400 tokens). Con prompt caching:
- Primera llamada por usuario: precio normal
- Siguientes llamadas (5 min): 90% descuento en tokens cacheados

Implementación: agregar `cache_control: { type: "ephemeral" }` al bloque de prompt del sistema. Ahorro estimado: **40-50% del costo IA total** en usuarios activos.

## Recomendaciones IA → Producto

Lógica:

```typescript
// Después de recibir el análisis de Anthropic
const issues = analysis.identified_issues; // ej: ["deficiencia de nitrógeno", "hojas amarillentas"]

// 1. Normalizar a keywords (tabla lookup o embedding)
const keywords = normalizeIssues(issues); // ej: ["deficiencia_nitrogeno"]

// 2. Buscar productos mapeados
const candidates = await supabase
  .from('issue_product_map')
  .select('product_tag, priority')
  .in('issue_keyword', keywords)
  .eq('stage_filter', stage)  // solo productos apropiados a la etapa
  .order('priority', { ascending: false });

// 3. Productos con priorización por plan del growshop
const products = await supabase
  .from('products')
  .select('*, store:stores(tier, country_code)')
  .in('tags', candidates.product_tags)
  .eq('country_code', userCountry)  // solo productos del país del usuario
  .limit(3);

// 4. Boost a Platinum (pagan por aparecer primero)
products.sort((a, b) => tierWeight(b.store.tier) - tierWeight(a.store.tier));

return products;
```

## Reglas duras del marketplace

1. **No hay chat usuario-a-usuario fuera de órdenes**. Solo se habilita chat cuando existe una orden `paid`.
2. **Moderación automática de chat**: filtros contra palabras de venta de material vegetal, direcciones fuera de orden, etc.
3. **Growshops deben aceptar TOS específicos**: no venden semillas/clones a países donde es ilegal, no envían derivados de cannabis, manejan residuos/impuestos locales.
4. **Productos marcados con categoría sensible** (si existieran en el futuro) requieren verificación de edad + país.
5. **Retención de pagos mínimo 7 días** post-entrega antes de liberar al growshop (ventana de disputa).
6. **Reembolso automático** si vendedor no sube proof en SLA. No hay discusión subjetiva en fase 1 del marketplace.
7. **Rating obligatorio**: comprador califica post-entrega; si no lo hace en 14 días, se asume 5 estrellas.

## Consideraciones de UX

- **Checkout en 2-3 pantallas máximo**: carrito → dirección/modo fulfillment → pago.
- **Chat accesible desde notificación push** cada vez que hay un evento de la orden.
- **Timeline visual** del estado de la orden en el detalle (similar a Mercado Libre / Rappi).
- **Contacto directo con growshop solo vía chat de orden** (no teléfono/whatsapp personal compartido).
- **Recomendación IA integrada de forma no invasiva**: card plegable post-checkin, no full-screen.

## Integraciones externas (prioridades)

1. **Stripe Connect** (obligatorio fase 4): split de pagos multi-destino.
2. **Supabase Realtime** (obligatorio fase 4): chat en vivo.
3. **Expo Push Notifications** (obligatorio fase 4): avisos de cambio de estado.
4. **Tracking carriers** (opcional fase 5): APIs de Chilexpress, Correo Argentino, Starken para enriquecer chat de orden. No crítico para MVP.
5. **Treggo / 99 Minutos** (opcional fase 5): agregadores de delivery PYMES. Usar solo si el bus dev de reclutar PYMES directas es muy lento.
