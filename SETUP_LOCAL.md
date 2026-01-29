# Local Setup Guide

This guide will help you set up and run the Interview Prep AI project locally.

## Prerequisites

- Node.js (v18 or higher) - ✅ Installed (v22.19.0)
- npm (v9 or higher) - ✅ Installed (v11.6.2)
- A Supabase account (free tier works)
- A Google Gemini API key (free tier available)

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Set Up Environment Variables

1. Create a `.env.local` file in the project root (copy from `.env.example` if it exists)
2. Fill in the required values:

### Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use an existing one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Tables Setup

After setting up Supabase, you need to create the required tables. Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  experience TEXT NOT NULL,
  topics_to_focus TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  note TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_pinned ON questions(is_pinned);
```

### JWT Secret

Generate a secure random string for JWT token signing. You can use:

**Option 1: Using OpenSSL (if installed)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Use any random string generator**
- Minimum 32 characters recommended
- Example: `my-super-secret-jwt-key-change-this-in-production-12345`

### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key → `GEMINI_API_KEY`

## Step 3: Update .env.local

Edit the `.env.local` file in the project root and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
JWT_SECRET=your_generated_jwt_secret_here
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Step 4: Run the Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, Next.js will automatically use the next available port (3001, 3002, etc.)

### Environment Variables Not Loading
- Make sure `.env.local` is in the project root (same directory as `package.json`)
- Restart the development server after changing environment variables
- Check that variable names match exactly (case-sensitive)

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure all required tables are created

### Gemini API Issues
- Verify your API key is correct
- Check that you have API access enabled in Google AI Studio
- Ensure you haven't exceeded rate limits

### Database Errors
- Verify all tables are created with the correct schema
- Check column names match exactly (snake_case format)
- Ensure foreign key relationships are set up correctly

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Register a new account
3. Create an interview session
4. Start practicing!

For more detailed information, see:
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed Supabase setup
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema reference
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

