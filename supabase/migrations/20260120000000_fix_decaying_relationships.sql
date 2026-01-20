-- Fix get_decaying_relationships function to properly detect neglected contacts
-- This function now considers each contact's target_frequency_days instead of a fixed threshold

CREATE OR REPLACE FUNCTION get_decaying_relationships(p_user_id UUID, days_threshold INTEGER)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = p_user_id
    AND (archived IS FALSE OR archived IS NULL)
    AND (deleted_at IS NULL)
    AND (
      -- Case 1: Has interactions - check if overdue based on target frequency
      (last_interaction_date IS NOT NULL 
       AND last_interaction_date < (NOW() - (COALESCE(target_frequency_days, 30) || ' days')::INTERVAL))
      OR
      -- Case 2: No interactions - check if created more than target frequency ago
      (last_interaction_date IS NULL 
       AND created_at < (NOW() - (COALESCE(target_frequency_days, 30) || ' days')::INTERVAL))
    )
  ORDER BY 
    -- Prioritize by how overdue they are (days since last contact / target frequency)
    CASE 
      WHEN last_interaction_date IS NOT NULL THEN
        EXTRACT(EPOCH FROM (NOW() - last_interaction_date)) / (COALESCE(target_frequency_days, 30) * 86400)
      ELSE
        EXTRACT(EPOCH FROM (NOW() - created_at)) / (COALESCE(target_frequency_days, 30) * 86400)
    END DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
