// GUARDRAIL: This API route handles user login - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // Find user in Supabase
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const passwordHash = user.password_hash || user.password
    const isPasswordValid = await bcrypt.compare(password, passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.json(
        { message: "Server misconfigured: JWT_SECRET missing" },
        { status: 500 },
      )
    }
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "30d" })

    return NextResponse.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profile_image_url || null,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
