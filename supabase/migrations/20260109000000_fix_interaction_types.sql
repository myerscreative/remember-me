-- Fix interaction type constraint to match code types
-- Remove old constraint and add new one with correct types

ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_type_check;

ALTER TABLE interactions ADD CONSTRAINT interactions_type_check
  CHECK (type IN ('call', 'email', 'text', 'in-person', 'social', 'other'));
