-- Add recurrence column to tasks table if it doesn't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS "recurrence" JSONB;
-- Update API permissions to allow access to the new column
GRANT SELECT,
    INSERT,
    UPDATE("recurrence") ON tasks TO anon,
    authenticated;
-- Reset supabase schema cache to ensure column is recognized
NOTIFY pgrst,
'reload schema';