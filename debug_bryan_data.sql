-- One-time script to reprocess existing brain dumps for Bryan Clay
-- This will extract structured data from existing shared_memories

-- First, let's see what we have
SELECT 
    p.id as person_id,
    p.name,
    p.company,
    p.job_title,
    p.most_important_to_them,
    p.current_challenges,
    p.goals_aspirations,
    COUNT(sm.id) as memory_count
FROM persons p
LEFT JOIN shared_memories sm ON sm.person_id = p.id
WHERE p.name ILIKE '%bryan%clay%'
GROUP BY p.id, p.name, p.company, p.job_title, p.most_important_to_them, p.current_challenges, p.goals_aspirations;

-- Show the actual memories
SELECT 
    sm.id,
    sm.content,
    sm.created_at
FROM shared_memories sm
JOIN persons p ON p.id = sm.person_id
WHERE p.name ILIKE '%bryan%clay%'
ORDER BY sm.created_at DESC;
