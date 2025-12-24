-- Calibrate contact dates for testing 12-month spectrum
-- Total contacts roughly 15-20 based on previous seeds.
-- We'll use a CASE statement to distribute based on row number.

WITH numbered_persons AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn, COUNT(*) OVER () as total_count
  FROM public.persons
  WHERE user_id = '4a36aca6-dd2d-4102-81ee-e5e4b0b7f98d'
)
UPDATE public.persons p
SET 
  last_interaction_date = CASE 
    WHEN np.rn <= (np.total_count * 0.25) THEN NOW() - INTERVAL '7 days'  -- Recent (Blooming)
    WHEN np.rn <= (np.total_count * 0.50) THEN NOW() - INTERVAL '30 days' -- Moderate (Nourished)
    WHEN np.rn <= (np.total_count * 0.75) THEN NOW() - INTERVAL '100 days' -- Overdue (Thirsty)
    ELSE NOW() - INTERVAL '250 days'                                     -- Long Overdue (Fading)
  END,
  last_contact = (CASE 
    WHEN np.rn <= (np.total_count * 0.25) THEN NOW() - INTERVAL '7 days'
    WHEN np.rn <= (np.total_count * 0.50) THEN NOW() - INTERVAL '30 days'
    WHEN np.rn <= (np.total_count * 0.75) THEN NOW() - INTERVAL '100 days'
    ELSE NOW() - INTERVAL '250 days'
  END)::date
FROM numbered_persons np
WHERE p.id = np.id;
