// GUARDRAIL: This API route handles user registration - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { mockDb } from "@/lib/mock-db"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const db = await connectDB()
    const { name, email, password, profileImageUrl } = await req.json()

    // --- MOCK DB MODE ---
    if (!db) {
        console.log("Mock DB Mode: Registering user");
        const existingUser = await mockDb.findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 })
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)
        
        const newUser = await mockDb.createUser({
            name,
            email,
            password: passwordHash,
            profileImageUrl
        });

        return NextResponse.json({
            message: "User registered successfully (Mock Mode)",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                profileImageUrl: newUser.profile_image_url,
            },
        }, { status: 201 });
    }
    // --------------------

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: passwordHash,
      profile_image_url: profileImageUrl || null,
    })

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profileImageUrl: newUser.profile_image_url,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
