-- FIX QUESTIONS DISPLAY ISSUE
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: DISABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- This is the MOST COMMON issue - RLS blocks queries even if data exists
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: ENSURE QUESTIONS TABLE EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  note TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: ADD MISSING COLUMNS IF NEEDED
-- ============================================
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_pinned ON questions(is_pinned);

-- ============================================
-- STEP 5: VERIFY DATA
-- ============================================
-- Check total questions
SELECT COUNT(*) as total_questions FROM questions;

-- Check questions per session
SELECT 
  s.id as session_id,
  s.role,
  COUNT(q.id) as question_count
FROM sessions s
LEFT JOIN questions q ON q.session_id = s.id
GROUP BY s.id, s.role
ORDER BY question_count DESC;

-- ============================================
-- STEP 6: CHECK FOR ORPHANED QUESTIONS
-- ============================================
-- Questions without valid session_id
SELECT q.id, q.session_id, q.question
FROM questions q
LEFT JOIN sessions s ON s.id = q.session_id
WHERE s.id IS NULL;

-- ============================================
-- STEP 7: TEST QUERY (Should return questions)
-- ============================================
-- Replace 'YOUR_SESSION_ID' with an actual session ID
-- SELECT * FROM questions WHERE session_id = 'YOUR_SESSION_ID';

