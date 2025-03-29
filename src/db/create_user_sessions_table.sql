-- Create the user_sessions table to track active login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,
    -- Session ID from Supabase Auth
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_agent TEXT,
    -- Browser/device information
    ip TEXT,
    -- IP address
    device_type TEXT,
    -- Desktop, Mobile, Tablet, etc.
    location TEXT -- Optional location information
);
-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
-- Create a trigger to automatically clean up expired sessions (older than 30 days)
CREATE OR REPLACE FUNCTION clean_expired_sessions() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM user_sessions
WHERE last_seen_at < NOW() - INTERVAL '30 days';
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_clean_expired_sessions ON user_sessions;
-- Create trigger to run the cleanup function
CREATE TRIGGER trigger_clean_expired_sessions
AFTER
INSERT ON user_sessions EXECUTE FUNCTION clean_expired_sessions();
-- Add RLS policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
-- Policy for users to view only their own sessions
CREATE POLICY user_sessions_select_policy ON user_sessions FOR
SELECT USING (auth.uid() = user_id);
-- Policy for users to delete only their own sessions
CREATE POLICY user_sessions_delete_policy ON user_sessions FOR DELETE USING (auth.uid() = user_id);
-- Policy for service role to manage all sessions
CREATE POLICY service_role_policy ON user_sessions USING (auth.role() = 'service_role');