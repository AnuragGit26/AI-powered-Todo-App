-- Add lastRecurrenceDate column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS "lastRecurrenceDate" TIMESTAMPTZ;
-- Update API permissions to allow access to the new column
GRANT SELECT,
    INSERT,
    UPDATE("lastRecurrenceDate") ON tasks TO anon,
    authenticated;
-- Update supabase schema cache
NOTIFY pgrst,
'reload schema';