-- Migration: Enable Realtime for user_sessions table
-- This allows real-time notifications when sessions are deleted

-- Enable realtime replication for user_sessions table
-- This will broadcast DELETE events to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;

-- Verify the publication was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_sessions'
    ) THEN
        RAISE NOTICE 'Realtime successfully enabled for user_sessions table';
    ELSE
        RAISE WARNING 'Failed to enable realtime for user_sessions table';
    END IF;
END $$;
