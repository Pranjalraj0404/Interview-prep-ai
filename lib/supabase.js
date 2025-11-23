// lib/supabase.js
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
if (!anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
if (!service) console.warn("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY")

// for frontend (if you ever need it)
export const supabaseBrowser =
  typeof window !== "undefined" ? createClient(url, anon) : null

// for API routes – always use this
export const supabaseAdmin = createClient(url, service)

// compatibility export for existing server routes
export const supabase = supabaseAdmin
