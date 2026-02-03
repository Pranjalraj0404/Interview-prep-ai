import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    await connectDB()
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.json(
        { message: "Server misconfigured: JWT_SECRET missing" },
        { status: 500 },
      )
    }

    try {
      const decoded = jwt.verify(token, secret)
      const userId = decoded.userId || decoded.id

      const formData = await req.formData()
      const file = formData.get("file")

      if (!file) {
        return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`

      // Update user profile image in MongoDB
      const user = await User.findByIdAndUpdate(
        userId,
        { profile_image_url: base64Image },
        { new: true }
      )

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Profile image updated successfully",
        profileImageUrl: base64Image,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImageUrl: user.profile_image_url,
        },
      })
    } catch (jwtError) {
      console.error("JWT Error:", jwtError);
      return NextResponse.json({ message: "Not authorized, token failed" }, { status: 401 })
    }
  } catch (error) {
    console.error("Profile image upload error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
