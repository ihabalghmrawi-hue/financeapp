-- ═══════════════════════════════════════════════════════════════
--  Fix: Correct business_type on categories that were incorrectly
--  backfilled by the previous migration.
--
--  The 20260525000000 migration assigned company_settings.business_type
--  to ALL categories for a company. For company e38e5b9c (pharmacy),
--  this mis-labeled clothing, retail, stationery, tools, and wholesale
--  categories as 'pharmacy'.
--
--  This patch maps each category name to the correct business_type
--  based on CATEGORY_SEEDS definitions in src/app/api/inventory/categories/route.ts
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Fix the pharmacy company's categories ─────────────────────────────────
-- Map English category names to their correct business_type
UPDATE product_categories
SET business_type = CASE name
  -- ── Clothing ──
  WHEN 'mens'             THEN 'clothing'
  WHEN 'womens'           THEN 'clothing'
  WHEN 'kids'             THEN 'clothing'
  WHEN 'sports'           THEN 'clothing'
  WHEN 'formal'           THEN 'clothing'
  WHEN 'casual'           THEN 'clothing'
  WHEN 'underwear'        THEN 'clothing'
  WHEN 'accessories'      THEN 'clothing'
  WHEN 'footwear'         THEN 'clothing'
  WHEN 'winter'           THEN 'clothing'
  WHEN 'abaya'            THEN 'clothing'
  WHEN 'swimwear'         THEN 'clothing'
  -- ── Retail ──
  WHEN 'food'             THEN 'retail'
  WHEN 'beverages'        THEN 'retail'
  WHEN 'dairy'            THEN 'retail'
  WHEN 'vegetables'       THEN 'retail'
  WHEN 'grains'           THEN 'retail'
  WHEN 'cleaning'         THEN 'retail'
  WHEN 'sweets'           THEN 'retail'
  WHEN 'canned'           THEN 'retail'
  WHEN 'frozen'           THEN 'retail'
  WHEN 'personal_care'    THEN 'retail'
  WHEN 'household'        THEN 'retail'
  -- ── Stationery ──
  WHEN 'pens_notebooks'   THEN 'stationery'
  WHEN 'paper_printing'   THEN 'stationery'
  WHEN 'art_supplies'     THEN 'stationery'
  WHEN 'office_supplies'  THEN 'stationery'
  WHEN 'school_bags'      THEN 'stationery'
  WHEN 'books'            THEN 'stationery'
  WHEN 'tech_accessories' THEN 'stationery'
  -- ── Tools ──
  WHEN 'power_tools'      THEN 'tools'
  WHEN 'hand_tools'       THEN 'tools'
  WHEN 'building_materials' THEN 'tools'
  WHEN 'plumbing'         THEN 'tools'
  WHEN 'electrical'       THEN 'tools'
  WHEN 'lighting'         THEN 'tools'
  WHEN 'paint'            THEN 'tools'
  WHEN 'safety'           THEN 'tools'
  -- ── Wholesale ──
  WHEN 'raw_materials'    THEN 'wholesale'
  WHEN 'finished_goods'   THEN 'wholesale'
  WHEN 'packaging'        THEN 'wholesale'
  WHEN 'spare_parts'      THEN 'wholesale'
  WHEN 'food_wholesale'   THEN 'wholesale'
  WHEN 'chemicals'        THEN 'wholesale'
  WHEN 'textiles'         THEN 'wholesale'
  -- Ambiguous: 'electronics' appears in both retail and wholesale seeds
  -- We keep the existing two rows as-is (one retail, one wholesale)
  WHEN 'electronics'      THEN business_type  -- no change
  ELSE business_type
END
WHERE company_id = 'e38e5b9c-dfbf-4d87-a62d-3d1a28f11419'
  AND business_type = 'pharmacy';

-- ── 2. Fix products that now belong to a different business_type via category ──
UPDATE products p
SET business_type = pc.business_type
FROM product_categories pc
WHERE p.category_id = pc.id
  AND p.company_id = 'e38e5b9c-dfbf-4d87-a62d-3d1a28f11419'
  AND pc.business_type != 'pharmacy';

-- ── 3. Fix inventory records whose product's business_type changed ────────────
UPDATE inventory i
SET business_type = p.business_type
FROM products p
WHERE i.product_id = p.id
  AND i.company_id = 'e38e5b9c-dfbf-4d87-a62d-3d1a28f11419'
  AND p.business_type != 'pharmacy';

-- ── 4. Seed pharmacy categories for this company ─────────────────────────────
INSERT INTO product_categories (company_id, business_type, name, name_ar, color, icon, is_active, sort_order)
SELECT
  'e38e5b9c-dfbf-4d87-a62d-3d1a28f11419',
  'pharmacy',
  name,
  name_ar,
  color,
  icon,
  true,
  0
FROM (VALUES
  ('prescription',    N'أدوية موصوفة',       '#ef4444', 'heart'),
  ('otc',             N'أدوية بدون وصفة',    '#f97316', 'heart'),
  ('medical_supplies',N'مستلزمات طبية',      '#3b82f6', 'package'),
  ('cosmetics',       N'مستحضرات تجميل',     '#ec4899', 'star'),
  ('vitamins',        N'فيتامينات ومكملات',  '#10b981', 'zap'),
  ('medical_devices', N'أجهزة طبية',         '#6366f1', 'tool'),
  ('herbal',          N'أعشاب وطبيعي',       '#84cc16', 'package'),
  ('baby_care',       N'عناية بالطفل',       '#f59e0b', 'heart'),
  ('orthopedic',      N'أدوات تقويم العظام', '#94a3b8', 'package'),
  ('dental',          N'صحة الأسنان',        '#06b6d4', 'heart')
) AS t(name, name_ar, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM product_categories pc
  WHERE pc.company_id = 'e38e5b9c-dfbf-4d87-a62d-3d1a28f11419'
    AND pc.name = t.name
    AND pc.business_type = 'pharmacy'
);

-- ── 5. Also fix any other companies that may have the same issue ──────────────
-- For ALL companies, re-assign categories based on their seed name mapping
-- This avoids a blanket company-level backfill and uses the name-based mapping
UPDATE product_categories
SET business_type = CASE name
  -- Clothing
  WHEN 'mens' THEN 'clothing' WHEN 'womens' THEN 'clothing'
  WHEN 'kids' THEN 'clothing' WHEN 'sports' THEN 'clothing'
  WHEN 'formal' THEN 'clothing' WHEN 'casual' THEN 'clothing'
  WHEN 'underwear' THEN 'clothing' WHEN 'accessories' THEN 'clothing'
  WHEN 'footwear' THEN 'clothing' WHEN 'winter' THEN 'clothing'
  WHEN 'abaya' THEN 'clothing' WHEN 'swimwear' THEN 'clothing'
  -- Retail
  WHEN 'food' THEN 'retail' WHEN 'beverages' THEN 'retail'
  WHEN 'dairy' THEN 'retail' WHEN 'vegetables' THEN 'retail'
  WHEN 'grains' THEN 'retail' WHEN 'cleaning' THEN 'retail'
  WHEN 'sweets' THEN 'retail' WHEN 'canned' THEN 'retail'
  WHEN 'frozen' THEN 'retail' WHEN 'personal_care' THEN 'retail'
  WHEN 'household' THEN 'retail'
  -- Stationery
  WHEN 'pens_notebooks' THEN 'stationery' WHEN 'paper_printing' THEN 'stationery'
  WHEN 'art_supplies' THEN 'stationery' WHEN 'office_supplies' THEN 'stationery'
  WHEN 'school_bags' THEN 'stationery' WHEN 'books' THEN 'stationery'
  WHEN 'tech_accessories' THEN 'stationery'
  -- Tools
  WHEN 'power_tools' THEN 'tools' WHEN 'hand_tools' THEN 'tools'
  WHEN 'building_materials' THEN 'tools' WHEN 'plumbing' THEN 'tools'
  WHEN 'electrical' THEN 'tools' WHEN 'lighting' THEN 'tools'
  WHEN 'paint' THEN 'tools' WHEN 'safety' THEN 'tools'
  -- Wholesale
  WHEN 'raw_materials' THEN 'wholesale' WHEN 'finished_goods' THEN 'wholesale'
  WHEN 'packaging' THEN 'wholesale' WHEN 'spare_parts' THEN 'wholesale'
  WHEN 'food_wholesale' THEN 'wholesale' WHEN 'chemicals' THEN 'wholesale'
  WHEN 'textiles' THEN 'wholesale'
  -- Atelier (dress boutique)
  WHEN 'evening_dresses' THEN 'atelier' WHEN 'jewelry' THEN 'atelier'
  WHEN 'fabric' THEN 'atelier' WHEN 'tailoring' THEN 'atelier'
  WHEN 'handicrafts' THEN 'atelier' WHEN 'perfumes' THEN 'atelier'
  -- Suits (men's tailoring)
  WHEN 'suits' THEN 'suits' WHEN 'shirts' THEN 'suits'
  WHEN 'ties_accessories' THEN 'suits' WHEN 'trousers' THEN 'suits'
  WHEN 'jackets' THEN 'suits' WHEN 'traditional' THEN 'suits'
  -- Don't change ambiguous or already-correct values
  ELSE business_type
END
WHERE business_type IS DISTINCT FROM CASE name
  WHEN 'mens' THEN 'clothing' WHEN 'womens' THEN 'clothing'
  WHEN 'kids' THEN 'clothing' WHEN 'sports' THEN 'clothing'
  WHEN 'formal' THEN 'clothing' WHEN 'casual' THEN 'clothing'
  WHEN 'underwear' THEN 'clothing' WHEN 'accessories' THEN 'clothing'
  WHEN 'footwear' THEN 'clothing' WHEN 'winter' THEN 'clothing'
  WHEN 'abaya' THEN 'clothing' WHEN 'swimwear' THEN 'clothing'
  WHEN 'food' THEN 'retail' WHEN 'beverages' THEN 'retail'
  WHEN 'dairy' THEN 'retail' WHEN 'vegetables' THEN 'retail'
  WHEN 'grains' THEN 'retail' WHEN 'cleaning' THEN 'retail'
  WHEN 'sweets' THEN 'retail' WHEN 'canned' THEN 'retail'
  WHEN 'frozen' THEN 'retail' WHEN 'personal_care' THEN 'retail'
  WHEN 'household' THEN 'retail'
  WHEN 'pens_notebooks' THEN 'stationery' WHEN 'paper_printing' THEN 'stationery'
  WHEN 'art_supplies' THEN 'stationery' WHEN 'office_supplies' THEN 'stationery'
  WHEN 'school_bags' THEN 'stationery' WHEN 'books' THEN 'stationery'
  WHEN 'tech_accessories' THEN 'stationery'
  WHEN 'power_tools' THEN 'tools' WHEN 'hand_tools' THEN 'tools'
  WHEN 'building_materials' THEN 'tools' WHEN 'plumbing' THEN 'tools'
  WHEN 'electrical' THEN 'tools' WHEN 'lighting' THEN 'tools'
  WHEN 'paint' THEN 'tools' WHEN 'safety' THEN 'tools'
  WHEN 'raw_materials' THEN 'wholesale' WHEN 'finished_goods' THEN 'wholesale'
  WHEN 'packaging' THEN 'wholesale' WHEN 'spare_parts' THEN 'wholesale'
  WHEN 'food_wholesale' THEN 'wholesale' WHEN 'chemicals' THEN 'wholesale'
  WHEN 'textiles' THEN 'wholesale'
  WHEN 'evening_dresses' THEN 'atelier' WHEN 'jewelry' THEN 'atelier'
  WHEN 'fabric' THEN 'atelier' WHEN 'tailoring' THEN 'atelier'
  WHEN 'handicrafts' THEN 'atelier' WHEN 'perfumes' THEN 'atelier'
  WHEN 'suits' THEN 'suits' WHEN 'shirts' THEN 'suits'
  WHEN 'ties_accessories' THEN 'suits' WHEN 'trousers' THEN 'suits'
  WHEN 'jackets' THEN 'suits' WHEN 'traditional' THEN 'suits'
  ELSE business_type
END;

-- ── 6. Sync products to match their category's business_type ─────────────────
UPDATE products p
SET business_type = pc.business_type
FROM product_categories pc
WHERE p.category_id = pc.id
  AND p.business_type IS DISTINCT FROM pc.business_type;

-- ── 7. Sync inventory to match their product's business_type ─────────────────
UPDATE inventory i
SET business_type = p.business_type
FROM products p
WHERE i.product_id = p.id
  AND i.business_type IS DISTINCT FROM p.business_type;
