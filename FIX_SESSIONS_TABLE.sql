-- Fix Sessions Table - Run this in Supabase SQL Editor
-- This will add any missing columns to your sessions table

-- First, check if table exists, if not create it
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  experience TEXT NOT NULL,
  topics_to_focus TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove token column if it exists (sessions don't need tokens)
-- If you have a token column that's NOT NULL, make it nullable or remove it
DO $$ 
BEGIN
  -- Check if token column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'token'
    AND is_nullable = 'NO'
  ) THEN
    -- Make token nullable (or you can delete it entirely)
    ALTER TABLE sessions ALTER COLUMN token DROP NOT NULL;
    -- OR to remove it completely: ALTER TABLE sessions DROP COLUMN token;
  END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add experience column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'experience'
  ) THEN
    ALTER TABLE sessions ADD COLUMN experience TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add role column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'role'
  ) THEN
    ALTER TABLE sessions ADD COLUMN role TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add topics_to_focus column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'topics_to_focus'
  ) THEN
    ALTER TABLE sessions ADD COLUMN topics_to_focus TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add description column if missing (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'description'
  ) THEN
    ALTER TABLE sessions ADD COLUMN description TEXT;
  END IF;

    -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Fix token column: Sessions don't need tokens, so make it nullable or remove it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'token'
    AND is_nullable = 'NO'
  ) THEN
    -- Make token nullable (sessions don't need tokens)
    ALTER TABLE sessions ALTER COLUMN token DROP NOT NULL;
    -- OR remove it completely: ALTER TABLE sessions DROP COLUMN token;
  END IF;
END $$;

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

