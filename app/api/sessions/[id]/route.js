import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req, { params }) {
  const { id } = params

  try {
    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("session_id", id)

    const normalizedQuestions = (questions || []).map((q) => ({
      ...q,
      _id: q.id,
      isPinned: !!q.is_pinned,
      note: q.note || "",
    }))

    return NextResponse.json({
      session: {
        ...session,
        _id: session.id,
        questions: normalizedQuestions,
        topicsToFocus: session.topics_to_focus || "",
        createdAt: session.created_at,
      }
    })
  } catch (err) {
    console.error("GET session error:", err)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const { id } = params

  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id || decoded.userId

    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    console.log("Deleting session:", id, "for user:", userId)

    // delete questions first
    await supabaseAdmin.from("questions").delete().eq("session_id", id)

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select()

    if (error) {
      console.error("Delete session error:", error)
      return NextResponse.json({ message: "Failed to delete" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.log("No session row found to delete for id:", id)
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    console.log("Session deleted successfully:", id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE session fatal error:", err)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
