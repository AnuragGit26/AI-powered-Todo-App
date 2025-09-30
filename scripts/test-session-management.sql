-- Test Script for Session Management Fix
-- Run this in Supabase SQL Editor to verify the fix

-- 1. Check if the new constraint exists
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.user_sessions'::regclass
AND conname LIKE '%fingerprint%';

-- Expected: Should see 'unique_user_device_fingerprint' with UNIQUE (user_id, device_fingerprint)

-- 2. Check for duplicate sessions (should return 0 rows after cleanup)
SELECT 
    user_id,
    device_fingerprint,
    COUNT(*) as session_count
FROM public.user_sessions
WHERE device_fingerprint IS NOT NULL
GROUP BY user_id, device_fingerprint
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates)

-- 3. View all sessions with user info
SELECT 
    us.id,
    us.user_id,
    us.device_type,
    us.location,
    us.last_seen_at,
    us.created_at,
    LEFT(us.device_fingerprint, 20) || '...' as fingerprint_preview,
    EXTRACT(EPOCH FROM (NOW() - us.last_seen_at))/3600 as hours_since_last_seen
FROM public.user_sessions us
ORDER BY us.last_seen_at DESC
LIMIT 20;

-- Expected: See all active sessions with proper data

-- 4. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_sessions'
ORDER BY indexname;

-- Expected: Should see idx_user_sessions_user_device and idx_user_sessions_last_seen

-- 5. Test RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_sessions';

-- Expected: Should see 4 policies (select, insert, update, delete)

-- 6. Count sessions per user
SELECT 
    user_id,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT device_fingerprint) as unique_devices,
    MAX(last_seen_at) as most_recent_activity
FROM public.user_sessions
GROUP BY user_id
ORDER BY total_sessions DESC;

-- Expected: Each user should have reasonable session counts

-- 7. Find stale sessions (older than 90 days)
SELECT 
    COUNT(*) as stale_sessions_count
FROM public.user_sessions
WHERE last_seen_at < NOW() - INTERVAL '90 days';

-- Expected: Should be 0 or low after cleanup

-- 8. Verify constraint works (this should fail)
-- DO NOT RUN IN PRODUCTION - This is just to verify the constraint
/*
DO $$
DECLARE
    test_user_id uuid := (SELECT user_id FROM public.user_sessions LIMIT 1);
    test_fingerprint text := (SELECT device_fingerprint FROM public.user_sessions WHERE user_id = test_user_id LIMIT 1);
BEGIN
    IF test_user_id IS NOT NULL AND test_fingerprint IS NOT NULL THEN
        -- This should fail with constraint violation
        INSERT INTO public.user_sessions (user_id, device_fingerprint, created_at, last_seen_at)
        VALUES (test_user_id, test_fingerprint, NOW(), NOW());
        RAISE NOTICE 'ERROR: Constraint did not prevent duplicate!';
    ELSE
        RAISE NOTICE 'No test data available';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'SUCCESS: Constraint is working correctly';
END $$;
*/
