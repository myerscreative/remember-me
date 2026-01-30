-- Security fixes for RLS and view security settings
-- This migration addresses:
-- 1. shared_memories table has RLS policies but RLS is not enabled
-- 2. person_health_status, nurture_dashboard, person_interaction_counts views use SECURITY DEFINER

-- ============================================
-- FIX 1: Enable RLS on shared_memories table
-- ============================================
-- The table may already have RLS enabled, but this ensures it's enabled
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX 2: Recreate views with SECURITY INVOKER
-- ============================================

-- 2a. person_health_status view
DROP VIEW IF EXISTS public.person_health_status;

CREATE VIEW public.person_health_status
WITH (security_invoker = true)
AS
WITH last_interactions AS (
    SELECT person_id, MAX(date) as last_contact
    FROM interactions
    GROUP BY person_id
)
SELECT
    p.id,
    p.name,
    p.target_frequency_days,
    li.last_contact,
    CASE
        WHEN li.last_contact IS NULL THEN 'neglected'
        WHEN (CURRENT_DATE - li.last_contact::date) <= COALESCE(p.target_frequency_days, 30) THEN 'nurtured'
        WHEN (CURRENT_DATE - li.last_contact::date) <= (COALESCE(p.target_frequency_days, 30) * 1.2) THEN 'drifting'
        ELSE 'neglected'
    END as current_health
FROM persons p
LEFT JOIN last_interactions li ON p.id = li.person_id;

-- 2b. nurture_dashboard view
DROP VIEW IF EXISTS public.nurture_dashboard;

CREATE VIEW public.nurture_dashboard
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.name,
  p.photo_url,
  p.email,
  p.phone,
  p.next_contact_date,
  p.next_contact_reason,
  p.last_contacted_date,
  p.last_contact,
  (p.next_contact_date - CURRENT_DATE)::INTEGER as days_until_contact,
  CASE
    WHEN p.next_contact_date < CURRENT_DATE THEN 'overdue'
    WHEN p.next_contact_date = CURRENT_DATE THEN 'today'
    WHEN p.next_contact_date <= CURRENT_DATE + 3 THEN 'urgent'
    WHEN p.next_contact_date <= CURRENT_DATE + 7 THEN 'soon'
    ELSE 'upcoming'
  END as urgency,
  CASE
    WHEN p.last_contacted_date IS NULL THEN 'never'
    WHEN CURRENT_DATE - p.last_contacted_date < 30 THEN 'recent'
    WHEN CURRENT_DATE - p.last_contacted_date < 90 THEN 'moderate'
    ELSE 'long_ago'
  END as recency
FROM persons p
WHERE p.archived = FALSE
  AND p.next_contact_date IS NOT NULL
ORDER BY p.next_contact_date ASC;

COMMENT ON VIEW public.nurture_dashboard IS 'Dashboard view for managing relationship nurturing';

-- 2c. person_interaction_counts view
DROP VIEW IF EXISTS public.person_interaction_counts;

CREATE VIEW public.person_interaction_counts
WITH (security_invoker = true)
AS
SELECT
  person_id,
  COUNT(*) as total_interactions,
  MAX(date) as last_interaction_date,
  COUNT(*) FILTER (WHERE type = 'meeting') as meeting_count,
  COUNT(*) FILTER (WHERE type = 'call') as call_count,
  COUNT(*) FILTER (WHERE type = 'email') as email_count
FROM interactions
GROUP BY person_id;
