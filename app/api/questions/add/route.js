import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Question from "@/models/Question"
import Session from "@/models/Session"

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
    const decoded = jwt.verify(token, secret)
    const userId = decoded.userId || decoded.id

    const { sessionId, questions } = await req.json()

    if (!sessionId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    // Verify session ownership
    const session = await Session.findById(sessionId)

    if (!session) {
      return NextResponse.json({ message: "Session not found or not authorized" }, { status: 404 })
    }

    if (session.user_id.toString() !== userId) {
      return NextResponse.json({ message: "Session not found or not authorized" }, { status: 404 })
    }

    console.log("Adding questions to session:", {
      sessionId,
      questionsCount: questions.length,
    })

    const questionInserts = questions.map(q => ({
      session_id: sessionId,
      user_id: userId,
      question: q.question || "",
      answer: q.answer || "No answer provided",
      is_pinned: false
    }))

    const createdQuestions = await Question.insertMany(questionInserts)

    console.log("Batch insert complete:", {
      sessionId,
      created: createdQuestions.length,
    })

    return NextResponse.json({ 
      success: true, 
      questions: createdQuestions,
      count: createdQuestions.length
    })

  } catch (error) {
    console.error("Add questions error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
