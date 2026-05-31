-- Backfill inventory_items from existing products so the inventory domain
-- engine (used by transfers, stock movements, etc.) can reference them.
-- Uses matching UUIDs (inventory_items.id = products.id) so client code
-- can send products.id as item_id and the FK constraint is satisfied.

-- 1. Backfill: insert products into inventory_items using the same UUID
INSERT INTO inventory_items (id, company_id, code, name, name_ar, type, unit, cost_method, standard_cost, is_active, barcode, sku, category_id, min_stock, image_url, created_at, updated_at)
SELECT
  p.id,
  p.company_id,
  COALESCE(p.sku, p.name, 'PROD-' || substr(p.id::text, 1, 8)) AS code,
  p.name,
  p.name_ar,
  COALESCE(p.type, 'product') AS type,
  COALESCE(u.name, 'piece') AS unit,
  'weighted_average' AS cost_method,
  COALESCE(p.cost_price, 0) AS standard_cost,
  COALESCE(p.is_active, true) AS is_active,
  p.barcode,
  p.sku,
  p.category_id,
  COALESCE(p.min_stock_level, p.min_qty, 0) AS min_stock,
  p.image_url,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN units u ON u.id = p.unit_id
WHERE NOT EXISTS (SELECT 1 FROM inventory_items ii WHERE ii.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill stock_movements from inventory (initial stock as adjustment_in)
INSERT INTO stock_movements (company_id, item_id, warehouse_id, movement_type, direction, qty, unit_cost, total_cost, reference_type, source, description, created_at)
SELECT
  i.company_id,
  i.product_id,
  i.warehouse_id,
  'initial_balance' AS movement_type,
  'in' AS direction,
  i.quantity,
  0,
  0,
  'system_migration' AS reference_type,
  'system_migration' AS source,
  'رصيد افتتاحي من ترحيل المخزون' AS description,
  COALESCE(i.updated_at, NOW())
FROM inventory i
WHERE i.quantity > 0
  AND NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.source = 'system_migration' AND sm.item_id = i.product_id AND sm.warehouse_id = i.warehouse_id);

-- 3. Trigger: auto-sync products → inventory_items on INSERT / UPDATE
CREATE OR REPLACE FUNCTION sync_product_to_inventory_item()
RETURNS trigger AS $$
DECLARE
  v_unit TEXT;
BEGIN
  SELECT COALESCE(u.name, 'piece') INTO v_unit FROM units u WHERE u.id = NEW.unit_id;
  INSERT INTO inventory_items (id, company_id, code, name, name_ar, type, unit, cost_method, standard_cost, is_active, barcode, sku, category_id, min_stock, image_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.company_id,
    COALESCE(NEW.sku, NEW.name, 'PROD-' || substr(NEW.id::text, 1, 8)),
    NEW.name,
    NEW.name_ar,
    COALESCE(NEW.type, 'product'),
    v_unit,
    'weighted_average',
    COALESCE(NEW.cost_price, 0),
    COALESCE(NEW.is_active, true),
    NEW.barcode,
    NEW.sku,
    NEW.category_id,
    COALESCE(NEW.min_stock_level, NEW.min_qty, 0),
    NEW.image_url,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    type = EXCLUDED.type,
    unit = EXCLUDED.unit,
    standard_cost = EXCLUDED.standard_cost,
    is_active = EXCLUDED.is_active,
    barcode = EXCLUDED.barcode,
    sku = EXCLUDED.sku,
    category_id = EXCLUDED.category_id,
    min_stock = EXCLUDED.min_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_product_to_inventory_item ON products;
CREATE TRIGGER trg_sync_product_to_inventory_item
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_inventory_item();

-- 4. Trigger: sync products is_active change to inventory_items
CREATE OR REPLACE FUNCTION sync_product_deactivation()
RETURNS trigger AS $$
BEGIN
  UPDATE inventory_items SET is_active = NEW.is_active, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_product_deactivation ON products;
CREATE TRIGGER trg_sync_product_deactivation
  AFTER UPDATE OF is_active ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_deactivation();

NOTIFY pgrst, 'reload schema';
