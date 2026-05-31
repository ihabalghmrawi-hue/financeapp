-- Fix get_warehouse_balances RPC: warehouses table has no `code` column
CREATE OR REPLACE FUNCTION get_warehouse_balances(
  p_company_id UUID,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(
  item_id UUID,
  item_code TEXT,
  item_name TEXT,
  item_name_ar TEXT,
  warehouse_id UUID,
  warehouse_code TEXT,
  warehouse_name TEXT,
  current_qty NUMERIC,
  unit_cost NUMERIC,
  total_value NUMERIC
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH stock AS (
    SELECT
      sm.item_id,
      sm.warehouse_id,
      COALESCE(SUM(CASE WHEN sm.direction = 'in' THEN sm.qty ELSE 0 END), 0) AS in_qty,
      COALESCE(SUM(CASE WHEN sm.direction = 'out' THEN sm.qty ELSE 0 END), 0) AS out_qty,
      COALESCE(AVG(sm.unit_cost) FILTER (WHERE sm.direction = 'in' AND sm.unit_cost > 0), 0) AS avg_cost
    FROM stock_movements sm
    WHERE sm.company_id = p_company_id
      AND sm.is_reversed = false
      AND (p_warehouse_id IS NULL OR sm.warehouse_id = p_warehouse_id)
    GROUP BY sm.item_id, sm.warehouse_id
  )
  SELECT
    s.item_id,
    ii.code AS item_code,
    ii.name AS item_name,
    ii.name_ar AS item_name_ar,
    s.warehouse_id,
    COALESCE(w.name, '') AS warehouse_code,
    COALESCE(w.name_ar, w.name, '') AS warehouse_name,
    (s.in_qty - s.out_qty) AS current_qty,
    s.avg_cost AS unit_cost,
    (s.in_qty - s.out_qty) * s.avg_cost AS total_value
  FROM stock s
  JOIN inventory_items ii ON ii.id = s.item_id
  JOIN warehouses w ON w.id = s.warehouse_id
  WHERE (s.in_qty - s.out_qty) != 0
  ORDER BY ii.code;
END;
$$;
