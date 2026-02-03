// GUARDRAIL: This API route handles user login - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { mockDb } from "@/lib/mock-db"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const db = await connectDB()
    const { email, password } = await req.json()

    let user;

    // --- MOCK DB MODE ---
    if (!db) {
        console.log("Mock DB Mode: Logging in user");
        user = await mockDb.findUserByEmail(email);
    } else {
        // Find user in MongoDB
        user = await User.findOne({ email })
    }
    // --------------------

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
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
    const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: "30d" })

    return NextResponse.json({
      _id: user._id,
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
