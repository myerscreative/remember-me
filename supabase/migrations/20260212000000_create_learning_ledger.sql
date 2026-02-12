-- Migration: Create Learning Ledger and update interactions for direction tracking

-- 1. Update interactions table to support direction
ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS is_inbound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS outreach_id UUID REFERENCES interactions(id) ON DELETE SET NULL;

COMMENT ON COLUMN interactions.is_inbound IS 'True if the interaction was initiated by the contact (reply), False if initiated by the user (outreach)';
COMMENT ON COLUMN interactions.outreach_id IS 'For replies, references the outreach message this is responding to';

-- 2. Create learning_ledger table
CREATE TABLE IF NOT EXISTS learning_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outreach_id UUID REFERENCES interactions(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    predicted_resonance INTEGER CHECK (predicted_resonance >= 0 AND predicted_resonance <= 100),
    actual_outcome BOOLEAN DEFAULT FALSE,
    response_time_ms BIGINT,
    sentiment_delta FLOAT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on learning_ledger
ALTER TABLE learning_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning ledger" ON learning_ledger
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning ledger" ON learning_ledger
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning ledger" ON learning_ledger
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Create background listener function (Postgres Trigger)
-- This function triggers when a new interaction is added.
-- If it's an inbound message (is_inbound = true), it finds the last outreach in the ledger and updates it.
CREATE OR REPLACE FUNCTION update_learning_ledger_on_reply()
RETURNS TRIGGER AS $$
DECLARE
    last_ledger_id UUID;
    outreach_time TIMESTAMPTZ;
BEGIN
    -- Only process inbound messages
    IF NEW.is_inbound = TRUE THEN
        -- Find the last outreach for this contact that hasn't been fulfilled
        SELECT id, created_at INTO last_ledger_id, outreach_time
        FROM learning_ledger
        WHERE contact_id = NEW.person_id
          AND actual_outcome = FALSE
        ORDER BY created_at DESC
        LIMIT 1;

        IF last_ledger_id IS NOT NULL THEN
            UPDATE learning_ledger
            SET 
                actual_outcome = TRUE,
                response_time_ms = EXTRACT(EPOCH FROM (NEW.date - outreach_time)) * 1000,
                updated_at = NOW()
            WHERE id = last_ledger_id;
            
            -- Also link the interaction back to the outreach
            UPDATE interactions
            SET outreach_id = (SELECT learning_ledger.outreach_id FROM learning_ledger WHERE id = last_ledger_id)
            WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS tr_update_learning_ledger_on_reply ON interactions;
CREATE TRIGGER tr_update_learning_ledger_on_reply
AFTER INSERT ON interactions
FOR EACH ROW
EXECUTE FUNCTION update_learning_ledger_on_reply();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_learning_ledger_contact_id ON learning_ledger(contact_id);
CREATE INDEX IF NOT EXISTS idx_learning_ledger_user_id ON learning_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_ledger_actual_outcome ON learning_ledger(actual_outcome);
