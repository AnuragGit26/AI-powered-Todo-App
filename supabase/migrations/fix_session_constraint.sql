-- Migration: Fix session management constraint
-- This migration fixes the unique constraint on user_sessions to be scoped per user
-- instead of globally, allowing multiple users to use the same device

-- Step 1: Drop the old constraint
ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS unique_device_fingerprint;

-- Step 2: Add the new constraint scoped to user_id
ALTER TABLE public.user_sessions 
ADD CONSTRAINT unique_user_device_fingerprint UNIQUE (user_id, device_fingerprint);

-- Step 3: Clean up any duplicate sessions that may exist
-- Keep only the most recent session for each user-device combination
WITH ranked_sessions AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, device_fingerprint 
            ORDER BY last_seen_at DESC, created_at DESC
        ) as rn
    FROM public.user_sessions
    WHERE device_fingerprint IS NOT NULL
)
DELETE FROM public.user_sessions
WHERE id IN (
    SELECT id FROM ranked_sessions WHERE rn > 1
);

-- Step 4: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_device 
ON public.user_sessions(user_id, device_fingerprint);

-- Step 5: Create an index for last_seen_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_seen 
ON public.user_sessions(last_seen_at);
