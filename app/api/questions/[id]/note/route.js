import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Question from "@/models/Question"
import Session from "@/models/Session"

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
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

    const { note } = await req.json()
    const { id } = params

    // Get question
    const question = await Question.findById(id)

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 })
    }

    // Get session to verify ownership
    const session = await Session.findById(question.session_id)

    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Verify session ownership
    if (session.user_id.toString() !== userId) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 })
    }

    // Update question note
    question.note = note || ""
    const updatedQuestion = await question.save()

    return NextResponse.json({ success: true, question: updatedQuestion })
  } catch (error) {
    console.error("Note update error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
