-- Product Service seed data
INSERT INTO categories (id, name, description) VALUES 
('cat-001', 'Növények', 'Kerti és szobanövények'),
('cat-002', 'Vetőmagok', 'Zöldség és virág vetőmagok'),
('cat-003', 'Virágföld', 'Különféle talajkeverékek'),
('cat-004', 'Szerszámok', 'Kertészeti szerszámok');

INSERT INTO products (id, name, category_id, price, description, unit) VALUES
('prod-001', 'Paradicsom palánta', 'cat-001', 2500.00, 'Érett paradicsom palánta', 'db'),
('prod-002', 'Bazsalikom vetőmag', 'cat-002', 1200.00, 'Bio bazsalikom vetőmag', 'csomag'),
('prod-003', 'Premium virágföld', 'cat-003', 3500.00, 'Tápanyagdús virágföld 40L', 'zsák'),
('prod-004', 'Kapa', 'cat-004', 4500.00, 'Acél kapanyél', 'db');
