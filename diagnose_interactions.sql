-- =================================================================
-- DIAGNOSTIC SCRIPT: INTERACTIONS TABLE (FIXED V3)
-- Run this in the Supabase SQL Editor.
-- Check the "Results" tab for the first 3 queries.
-- Check the "Messages" tab for the TEST INSERT output.
-- =================================================================

-- 1. INSPECT COLUMNS (Check if 'date' or 'interaction_date' exists)
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interactions';


-- 2. INSPECT RLS POLICIES (Check if INSERT is allowed)
-- Corrected column name to 'permissive'
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'interactions';


-- 3. INSPECT TRIGGERS (Check for broken triggers)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'interactions';


-- 4. TEST INSERTION
-- Output for this part will appear in the "Messages" tab (or Notifications)
DO $$
DECLARE
    v_user_id UUID;
    v_person_id UUID;
    v_new_id UUID;
BEGIN
    -- Dynamically grab a user and person
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    SELECT id INTO v_person_id FROM persons WHERE user_id = v_user_id LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ No users found. Cannot test insert.';
        RETURN;
    END IF;

    IF v_person_id IS NULL THEN
        RAISE NOTICE '⚠️ No contacts found for user %. check persons table.', v_user_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Testing insert for User % on Person %...', v_user_id, v_person_id;

    -- Attempt Insert using 'date' (Standard)
    BEGIN
        INSERT INTO interactions (
            user_id, person_id, type, date, notes
        ) VALUES (
            v_user_id, v_person_id, 'other', NOW(), 'DIAGNOSTIC_TEST_ENTRY'
        )
        RETURNING id INTO v_new_id;
        
        RAISE NOTICE '✅ INSERT SUCCESSFUL! New ID: %', v_new_id;
        RAISE EXCEPTION 'Test successful (Rolling back changes)';
        
    EXCEPTION 
        WHEN OTHERS THEN
            IF SQLERRM = 'Test successful (Rolling back changes)' THEN
                RAISE NOTICE '✅ Rollback confirmed. Database is healthy.';
            ELSE
                RAISE NOTICE '❌ INSERT FAILED (Standard): %', SQLERRM;
                
                -- Fallback Test: Try 'interaction_date'
                RAISE NOTICE '... Attempting fallback with interaction_date ...';
                BEGIN
                    INSERT INTO interactions (
                        user_id, person_id, type, interaction_date, notes
                    ) VALUES (
                        v_user_id, v_person_id, 'other', NOW(), 'DIAGNOSTIC_FALLBACK'
                    );
                     RAISE NOTICE '✅ FALLBACK INSERT SUCCESSFUL with interaction_date';
                     RAISE EXCEPTION 'Test successful (Rolling back changes)';
                EXCEPTION
                    WHEN OTHERS THEN
                        IF SQLERRM = 'Test successful (Rolling back changes)' THEN
                            RAISE NOTICE '✅ Rollback confirmed.';
                        ELSE
                            RAISE NOTICE '❌ FALLBACK FAILED too: %', SQLERRM;
                        END IF;
                END;
            END IF;
    END;
END $$;
