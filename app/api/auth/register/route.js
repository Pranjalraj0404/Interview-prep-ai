// GUARDRAIL: This API route handles user registration - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { name, email, password, profileImageUrl } = await req.json()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user in Supabase
    // Start with basic required fields only (profile_image_url may not exist in schema)
    let insertData = {
      name,
      email,
      password_hash: passwordHash,
    }
    
    let { data: newUser, error } = await supabase
      .from("users")
      .insert(insertData)
      .select()
      .single()

    // If password_hash column doesn't exist, try with 'password' instead
    if (error && error.message?.includes("password_hash")) {
      insertData = {
        name,
        email,
        password: passwordHash,
      }
      const result = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single()
      newUser = result.data
      error = result.error
    }

    // If profile_image_url column exists and we have a value, try to update it
    // This is done separately to avoid schema errors if column doesn't exist
    if (!error && newUser && profileImageUrl) {
      const updateResult = await supabase
        .from("users")
        .update({ profile_image_url: profileImageUrl })
        .eq("id", newUser.id)
        .select()
        .single()
      
      // If update succeeds, use the updated user data
      // If it fails (column doesn't exist), ignore - user is already created successfully
      if (updateResult.data && !updateResult.error) {
        newUser = updateResult.data
      }
    }

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ message: `Failed to create user: ${error.message}` }, { status: 500 })
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.json(
        { message: "Server misconfigured: JWT_SECRET missing" },
        { status: 500 },
      )
    }
    const token = jwt.sign({ userId: newUser.id }, secret, { expiresIn: "30d" })

    return NextResponse.json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      profileImageUrl: newUser.profile_image_url || null,
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    if (error?.code === "23505") {
      // PostgreSQL unique violation
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
