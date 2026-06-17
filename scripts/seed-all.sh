#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="garden"

echo "[1/5] Checking namespace and pods..."
PRODUCT_POD=$(sudo kubectl -n "$NAMESPACE" get pod -l app=product-service -o jsonpath='{.items[0].metadata.name}')
INVENTORY_POD=$(sudo kubectl -n "$NAMESPACE" get pod -l app=inventory-service -o jsonpath='{.items[0].metadata.name}')

echo "Product pod: $PRODUCT_POD"
echo "Inventory pod: $INVENTORY_POD"

echo "[2/5] Seeding product database..."
sudo kubectl -n "$NAMESPACE" exec -i "$PRODUCT_POD" -- node - <<'NODE'
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/products_db.sqlite');

const sql = `
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('cat-001', 'Novenyek', 'Kerti es szobanovenyek'),
('cat-002', 'Vetomagok', 'Zoldseg es virag vetomagok'),
('cat-003', 'Viragfold', 'Kulonfele talajkeverekek'),
('cat-004', 'Szerszamok', 'Kerteszeti szerszamok');

INSERT OR IGNORE INTO products (id, name, category_id, price, description, unit) VALUES
('prod-001', 'Paradicsom palanta', 'cat-001', 2500.00, 'Erett paradicsom palanta', 'db'),
('prod-002', 'Bazsalikom vetomag', 'cat-002', 1200.00, 'Bio bazsalikom vetomag', 'csomag'),
('prod-003', 'Premium viragfold', 'cat-003', 3500.00, 'Tapanyagdus viragfold 40L', 'zsak'),
('prod-004', 'Kapa', 'cat-004', 4500.00, 'Acel kapanyel', 'db');
`;

db.exec(sql, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Product seed OK');
  db.close();
});
NODE

echo "[3/5] Seeding inventory database..."
sudo kubectl -n "$NAMESPACE" exec -i "$INVENTORY_POD" -- node - <<'NODE'
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/inventory_db.sqlite');

const sql = `
INSERT OR IGNORE INTO inventory (id, product_id, warehouse_id, quantity) VALUES
('inv-001', 'prod-001', 'wh-001', 120),
('inv-002', 'prod-002', 'wh-001', 300),
('inv-003', 'prod-003', 'wh-001', 80),
('inv-004', 'prod-004', 'wh-001', 60);
`;

db.exec(sql, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Inventory seed OK');
  db.close();
});
NODE

echo "[4/5] Verifying seeded row counts..."
sudo kubectl -n "$NAMESPACE" exec -i "$PRODUCT_POD" -- node - <<'NODE'
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/products_db.sqlite');
db.get('SELECT COUNT(*) c FROM products', (_, row) => {
  console.log('products:', row.c);
  db.close();
});
NODE

sudo kubectl -n "$NAMESPACE" exec -i "$INVENTORY_POD" -- node - <<'NODE'
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/inventory_db.sqlite');
db.get('SELECT COUNT(*) c FROM inventory', (_, row) => {
  console.log('inventory rows:', row.c);
  db.close();
});
NODE

echo "[5/5] Done. Seed completed successfully."
