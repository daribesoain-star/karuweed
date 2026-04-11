-- Seed grow shops for map
INSERT INTO public.stores (name, country_code, city, address, latitude, longitude, tier, is_verified, hours, contact) VALUES
-- Chile
('Grow Chile', 'CL', 'Santiago', 'Av. Providencia 2124, Providencia', -33.4265, -70.6105, 'silver', true,
 '{"monday":"10:00-19:00","tuesday":"10:00-19:00","wednesday":"10:00-19:00","thursday":"10:00-19:00","friday":"10:00-19:00","saturday":"10:00-14:00"}',
 '{"phone":"+56912345678","instagram":"@growchile"}'),

('IndoorGrow Santiago', 'CL', 'Santiago', 'Av. Irarrázaval 3450, Ñuñoa', -33.4530, -70.6000, 'silver', true,
 '{"monday":"10:00-20:00","tuesday":"10:00-20:00","wednesday":"10:00-20:00","thursday":"10:00-20:00","friday":"10:00-20:00","saturday":"10:00-15:00"}',
 '{"phone":"+56987654321","instagram":"@indoorgrowstgo"}'),

('Green Planet Grow', 'CL', 'Valparaíso', 'Av. Pedro Montt 2550, Valparaíso', -33.0472, -71.6127, 'basic', true,
 '{"monday":"10:00-19:00","tuesday":"10:00-19:00","wednesday":"10:00-19:00","thursday":"10:00-19:00","friday":"10:00-19:00","saturday":"10:00-14:00"}',
 '{"instagram":"@greenplanetgrow"}'),

('Cultivo Sur', 'CL', 'Concepción', 'Calle Barros Arana 890, Concepción', -36.8270, -73.0503, 'basic', false,
 '{"monday":"10:00-18:00","tuesday":"10:00-18:00","wednesday":"10:00-18:00","thursday":"10:00-18:00","friday":"10:00-18:00"}',
 '{"instagram":"@cultivosur"}'),

('La Semilla Grow Shop', 'CL', 'Santiago', 'Av. Matta 520, Santiago Centro', -33.4560, -70.6500, 'gold', true,
 '{"monday":"09:00-20:00","tuesday":"09:00-20:00","wednesday":"09:00-20:00","thursday":"09:00-20:00","friday":"09:00-20:00","saturday":"10:00-16:00"}',
 '{"phone":"+56911112222","website":"https://lasemilla.cl","instagram":"@lasemillagrow"}'),

-- Argentina
('Cultiva Buenos Aires', 'AR', 'Buenos Aires', 'Av. Corrientes 3200, CABA', -34.6040, -58.4110, 'silver', true,
 '{"monday":"10:00-20:00","tuesday":"10:00-20:00","wednesday":"10:00-20:00","thursday":"10:00-20:00","friday":"10:00-20:00","saturday":"10:00-15:00"}',
 '{"phone":"+5491123456789","instagram":"@cultivaba"}'),

('Madre Tierra Grow', 'AR', 'Buenos Aires', 'Av. Santa Fe 4500, Palermo', -34.5880, -58.4255, 'silver', true,
 '{"monday":"10:00-19:00","tuesday":"10:00-19:00","wednesday":"10:00-19:00","thursday":"10:00-19:00","friday":"10:00-19:00","saturday":"10:00-14:00"}',
 '{"instagram":"@madretierragrow"}'),

('Green House Córdoba', 'AR', 'Córdoba', 'Bv. San Juan 1200, Córdoba', -31.4210, -64.1888, 'basic', true,
 '{"monday":"09:00-19:00","tuesday":"09:00-19:00","wednesday":"09:00-19:00","thursday":"09:00-19:00","friday":"09:00-19:00","saturday":"10:00-14:00"}',
 '{"instagram":"@greenhousecba"}'),

('Pacha Mama Indoor', 'AR', 'Mendoza', 'Calle San Martín 850, Mendoza', -32.8908, -68.8272, 'basic', false,
 '{"monday":"10:00-18:00","tuesday":"10:00-18:00","wednesday":"10:00-18:00","thursday":"10:00-18:00","friday":"10:00-18:00"}',
 '{"instagram":"@pachamamamza"}'),

-- Uruguay
('Growlandia', 'UY', 'Montevideo', 'Av. 18 de Julio 2350, Montevideo', -34.9058, -56.1738, 'gold', true,
 '{"monday":"10:00-20:00","tuesday":"10:00-20:00","wednesday":"10:00-20:00","thursday":"10:00-20:00","friday":"10:00-20:00","saturday":"10:00-16:00"}',
 '{"phone":"+59899123456","website":"https://growlandia.uy","instagram":"@growlandia"}'),

('Club Cannabico MVD', 'UY', 'Montevideo', 'Calle Ejido 1450, Centro', -34.9020, -56.1800, 'silver', true,
 '{"monday":"11:00-19:00","tuesday":"11:00-19:00","wednesday":"11:00-19:00","thursday":"11:00-19:00","friday":"11:00-19:00","saturday":"11:00-15:00"}',
 '{"instagram":"@clubcannabicomvd"}'),

-- Colombia
('Semillas Colombia', 'CO', 'Bogotá', 'Cra 7 #45-12, Chapinero', 4.6380, -74.0636, 'basic', true,
 '{"monday":"09:00-18:00","tuesday":"09:00-18:00","wednesday":"09:00-18:00","thursday":"09:00-18:00","friday":"09:00-18:00"}',
 '{"instagram":"@semillascolombia"}'),

-- Mexico
('Grow MX Shop', 'MX', 'Ciudad de México', 'Av. Insurgentes Sur 1500, Roma', 19.4050, -99.1695, 'silver', true,
 '{"monday":"10:00-19:00","tuesday":"10:00-19:00","wednesday":"10:00-19:00","thursday":"10:00-19:00","friday":"10:00-19:00","saturday":"10:00-15:00"}',
 '{"instagram":"@growmxshop"}'),

-- España
('La María Grow Shop', 'ES', 'Barcelona', 'Carrer de Balmes 200, Eixample', 41.3955, 2.1530, 'gold', true,
 '{"monday":"10:00-20:00","tuesday":"10:00-20:00","wednesday":"10:00-20:00","thursday":"10:00-20:00","friday":"10:00-20:00","saturday":"10:00-14:00"}',
 '{"website":"https://lamaria.es","instagram":"@lamariagrow"}'),

('THC Barcelona', 'ES', 'Barcelona', 'Carrer de Còrsega 350', 41.3980, 2.1615, 'silver', true,
 '{"monday":"10:00-19:00","tuesday":"10:00-19:00","wednesday":"10:00-19:00","thursday":"10:00-19:00","friday":"10:00-19:00"}',
 '{"instagram":"@thcbcn"}')

ON CONFLICT DO NOTHING;
