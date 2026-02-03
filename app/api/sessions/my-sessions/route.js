import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Session from "@/models/Session"
import Question from "@/models/Question"

export const dynamic = "force-dynamic"

export async function GET(req) {
  try {
    await connectDB()
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
    const sessionsOnly = await Session.find({ user_id: userId }).sort({ created_at: -1 })

    if (!sessionsOnly?.length) return NextResponse.json([])

    const sessionIds = sessionsOnly.map((s) => s._id)

    const allQuestions = await Question.find({ session_id: { $in: sessionIds } })

    const questionsBySession = {}
    ;(allQuestions || []).forEach((q) => {
      const sId = q.session_id.toString()
      if (!questionsBySession[sId]) {
        questionsBySession[sId] = []
      }
      questionsBySession[sId].push(q)
    })

    const result = sessionsOnly.map((session) => {
      const sId = session._id.toString()
      const sessionQuestions = questionsBySession[sId] || []
      return {
        _id: session._id,
        role: session.role,
        experience: session.experience,
        topicsToFocus: session.topics_to_focus,
        description: session.description,
        createdAt: session.created_at,
        questionsCount: sessionQuestions.length,
        questions: sessionQuestions.map((q) => ({
          ...q.toObject(),
          _id: q._id,
        })),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("My Sessions error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
