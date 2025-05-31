-- Create pomodoro_sessions table to store timer state across devices
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state JSONB NOT NULL,
    device_id TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_updated_at ON pomodoro_sessions(updated_at);
-- Enable row level security
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
-- Create policy for users to only access their own pomodoro sessions
CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pomodoro sessions" ON pomodoro_sessions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pomodoro sessions" ON pomodoro_sessions FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pomodoro sessions" ON pomodoro_sessions FOR DELETE USING (auth.uid() = user_id);
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pomodoro_sessions_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER trigger_update_pomodoro_sessions_updated_at BEFORE
UPDATE ON pomodoro_sessions FOR EACH ROW EXECUTE FUNCTION update_pomodoro_sessions_updated_at();
-- Function to create the table (for backwards compatibility)
CREATE OR REPLACE FUNCTION create_pomodoro_sessions_table() RETURNS void AS $$ BEGIN -- This function is intentionally empty since the table is created above
    -- It exists for backwards compatibility with the service
    RETURN;
END;
$$ LANGUAGE plpgsql;