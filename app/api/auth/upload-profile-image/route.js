import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
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

      const formData = await req.formData()
      const file = formData.get("image")

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ message: "No image file provided" }, { status: 400 })
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ message: "Invalid file type. Please upload an image." }, { status: 400 })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "File too large. Please upload an image smaller than 5MB." },
          { status: 400 },
        )
      }

      // Convert file to base64 for storage (in a real app, you'd upload to a cloud service)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`

      // Update user profile image in Supabase
      const { data: user, error } = await supabase
        .from("users")
        .update({ profile_image_url: base64Image })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Database update error:", error)
        return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 })
      }

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Profile image updated successfully",
        profileImageUrl: base64Image,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          profileImageUrl: user.profile_image_url,
        },
      })
    } catch (jwtError) {
      return NextResponse.json({ message: "Not authorized, token failed" }, { status: 401 })
    }
  } catch (error) {
    console.error("Profile image upload error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
