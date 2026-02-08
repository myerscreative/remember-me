-- Add health_boost column to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS health_boost INTEGER DEFAULT 0;
