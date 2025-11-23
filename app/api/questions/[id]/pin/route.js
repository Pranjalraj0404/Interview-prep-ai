import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
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
    const decoded = jwt.verify(token, secret)
    const userId = decoded.userId || decoded.id

    const { id } = params

    // Get question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 })
    }

    // Get session to verify ownership
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", question.session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Verify session ownership
    if (session.user_id !== userId) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 })
    }

    // Toggle pin status
    const { data: updatedQuestion, error: updateError } = await supabase
      .from("questions")
      .update({ is_pinned: !question.is_pinned })
      .eq("id", id)
      .select()
      .single()

    if (updateError || !updatedQuestion) {
      console.error("Pin toggle error:", updateError)
      return NextResponse.json({ message: "Failed to toggle pin" }, { status: 500 })
    }

    return NextResponse.json({ success: true, question: updatedQuestion })
  } catch (error) {
    console.error("Pin toggle error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
