-- FIX_SESSIONS_TABLE.sql
-- 1) Make sure sessions table exists with correct columns
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  topics_to_focus TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Ensure columns exist and are correctly defined (safe to run multiple times)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS experience TEXT NOT NULL DEFAULT '';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS topics_to_focus TEXT NOT NULL DEFAULT '';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Fix token column: sessions don't need tokens, so make it nullable or drop it
-- This fixes the error: "null value in column 'token' of relation 'sessions' violates not-null constraint"

-- Option A: keep token but allow NULL (safe) - only if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'token'
  ) THEN
    ALTER TABLE sessions ALTER COLUMN token DROP NOT NULL;
    RAISE NOTICE 'Made token column nullable';
  END IF;
END $$;

-- Option B: if you are sure you never use sessions.token, uncomment this:
-- ALTER TABLE sessions
--   DROP COLUMN IF EXISTS token;

-- 4) Create questions table if missing
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);