import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id || decoded.userId

    if (!userId) {
      return NextResponse.json({ message: "Invalid token: missing user ID" }, { status: 401 })
    }

    const { role, experience, topicsToFocus, description, questions } = await req.json()

    const insertData = {
      user_id: userId,
      role,
      experience,
      topics_to_focus: topicsToFocus || "",
      description: description || "",
      created_at: new Date().toISOString(),
    }

    const { data: newSession, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert(insertData)
      .select()
      .single()

    if (sessionError || !newSession) {
      console.error("Session Insert Error:", sessionError)
      return NextResponse.json(
        { message: sessionError?.message || "Could not save session" },
        { status: 500 }
      )
    }

    if (Array.isArray(questions) && questions.length > 0) {
      const questionInserts = questions.map((q) => ({
        session_id: newSession.id,
        user_id: userId,
        question: q.question || "",
        answer: q.answer || "",
        created_at: new Date().toISOString(),
      }))

      const { error: questionsError } = await supabaseAdmin
        .from("questions")
        .insert(questionInserts)

      if (questionsError) {
        console.error("Questions creation error:", questionsError)
      }
    }

    return NextResponse.json({
      success: true,
      session: { ...newSession, _id: newSession.id },
    })
  } catch (error) {
    console.error("Create Session Error:", error)
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
