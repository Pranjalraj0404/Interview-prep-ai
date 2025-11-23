// GUARDRAIL: This API route fetches user profile - DO NOT DELETE
// Always returns valid JSON responses
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(req) {
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

      // Try to select profile_image_url, but handle if column doesn't exist
      let { data: user, error } = await supabase
        .from("users")
        .select("id, name, email, profile_image_url")
        .eq("id", userId)
        .single()

      // If error is about missing column, try without profile_image_url
      if (error && error.message?.includes("profile_image_url")) {
        const result = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", userId)
          .single()
        user = result.data
        error = result.error
      }

      if (error || !user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        _id: user.id,
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
