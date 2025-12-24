-- Add company and job_title columns to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS job_title text;
