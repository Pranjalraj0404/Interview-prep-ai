# Supabase Database Setup

This project uses Supabase as the database. You need to create the following tables in your Supabase project.

## Tables to Create

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
```

### 2. Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  experience TEXT NOT NULL,
  topics_to_focus TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### 3. Questions Table

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  note TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id for faster lookups
CREATE INDEX idx_questions_session_id ON questions(session_id);
-- Create index on is_pinned for sorting
CREATE INDEX idx_questions_is_pinned ON questions(is_pinned);
```

## How to Run These Queries

1. Go to your Supabase project dashboard: https://cuvhrfownjnofiizkzxs.supabase.co
2. Navigate to the SQL Editor
3. Run each CREATE TABLE statement above
4. The tables will be created with the necessary relationships and indexes

## Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cuvhrfownjnofiizkzxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4ubaZVoFd1NtT7p6M2lcFw_Wmxe9b8N
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Important: Fix Your Existing Table

If you already created the table with `password` instead of `password_hash`, run this SQL in Supabase:

```sql
-- Add password_hash column if you created 'password' instead
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Migrate existing passwords (if any)
UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

-- Optionally remove the old password column after migration
-- ALTER TABLE users DROP COLUMN IF EXISTS password;
```

Or recreate the table with the correct schema above.

