-- Add sizes and colors columns to products table for variant/attribute support
-- Used by clothing, atelier, suits business types

ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
