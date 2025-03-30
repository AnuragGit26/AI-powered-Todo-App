-- Create the profiles table to store user profile information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_region TEXT,
    location TEXT,
    phone_number TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
-- Add unique constraint on username to prevent duplicates (only if it doesn't exist)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_unique'
) THEN
ALTER TABLE profiles
ADD CONSTRAINT profiles_username_unique UNIQUE (username);
END IF;
END $$;
-- Add RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Allow users to view their own profile
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'profiles_select_own'
) THEN CREATE POLICY profiles_select_own ON profiles FOR
SELECT USING (auth.uid() = user_id);
END IF;
END $$;
-- Allow users to update their own profile
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'profiles_update_own'
) THEN CREATE POLICY profiles_update_own ON profiles FOR
UPDATE USING (auth.uid() = user_id);
END IF;
END $$;
-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop trigger if it exists 
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
-- Create trigger to update timestamp on modification
CREATE TRIGGER trigger_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_profiles_modified_column();
-- Create a function to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (user_id, username)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            'user_' || substr(NEW.id::text, 1, 8)
        )
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Remove the trigger if it exists already (to avoid errors on re-running)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Allow the service role to access all profiles for admin purposes
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'service_role_policy_profiles'
) THEN CREATE POLICY service_role_policy_profiles ON profiles USING (auth.role() = 'service_role');
END IF;
END $$;