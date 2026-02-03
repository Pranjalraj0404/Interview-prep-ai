// GUARDRAIL: This API route fetches user profile - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    await connectDB()
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Not authorized, no token" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        return NextResponse.json(
          { message: "Server misconfigured: JWT_SECRET missing" },
          { status: 500 },
        )
      }
      const decoded = jwt.verify(token, secret)
      const userId = decoded.userId || decoded.id

      const user = await User.findById(userId).select("-password")

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profile_image_url || null,
      })
    } catch (jwtError) {
      return NextResponse.json({ message: "Not authorized, token failed" }, { status: 401 })
    }
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
