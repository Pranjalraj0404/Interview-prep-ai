import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req) {
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

    console.log("📡 my-sessions: fetching sessions for user:", userId)

    // sessions for THIS user and THIS project
    const { data: sessionsOnly, error: sessionsError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Session fetch error:", sessionsError)
      return NextResponse.json({ message: "DB error" }, { status: 500 })
    }

    if (!sessionsOnly?.length) return NextResponse.json([])

    const sessionIds = sessionsOnly.map((s) => s.id)

    const { data: allQuestions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select("*")
      .in("session_id", sessionIds)

    if (questionsError) {
      console.error("Questions fetch error:", questionsError)
    }

    const questionsBySession = {}
    ;(allQuestions || []).forEach((q) => {
      if (!questionsBySession[q.session_id]) questionsBySession[q.session_id] = []
      questionsBySession[q.session_id].push(q)
    })

    const formattedSessions = sessionsOnly.map((session) => ({
      ...session,
      _id: session.id,
      questions: questionsBySession[session.id] || [],
      topicsToFocus: session.topics_to_focus || "",
      description: session.description || "",
      createdAt: session.created_at,
    }))

    console.log("📡 my-sessions: returning", formattedSessions.length, "sessions")
    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error("My-Sessions Error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
