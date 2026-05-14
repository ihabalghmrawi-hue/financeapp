-- Add missing columns to rental_orders for new booking system
ALTER TABLE rental_orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS rental_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
