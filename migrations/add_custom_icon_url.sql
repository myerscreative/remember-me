-- Add custom_icon_url column to loop_groups table
ALTER TABLE loop_groups
ADD COLUMN IF NOT EXISTS custom_icon_url TEXT;

-- Add comment explaining the usage
COMMENT ON COLUMN loop_groups.custom_icon_url IS 'URL to custom uploaded icon. When set, this takes precedence over icon_name';

-- Recreate the view to include the new column
CREATE OR REPLACE VIEW loop_groups_with_counts AS
SELECT
  lg.*,
  COUNT(plg.person_id) as person_count
FROM loop_groups lg
LEFT JOIN person_loop_groups plg ON lg.id = plg.loop_group_id
GROUP BY lg.id;
