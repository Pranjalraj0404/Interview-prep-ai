import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Session from "@/models/Session"
import Question from "@/models/Question"
import { mockDb } from "@/lib/mock-db"

export const dynamic = "force-dynamic"

export async function POST(req) {
  try {
    const db = await connectDB()
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

    // --- MOCK DB MODE ---
    if (!db) {
         console.log("Mock DB Mode: Creating session");
         const newSession = await mockDb.createSession({
            user_id: userId,
            role,
            experience,
            topics_to_focus: topicsToFocus || "",
            description: description || "",
         });

         let createdQuestions = [];
         if (Array.isArray(questions) && questions.length > 0) {
            const questionInserts = questions.map((q) => ({
                session_id: newSession._id,
                user_id: userId,
                question: q.question || "",
                answer: q.answer || "",
                is_pinned: false,
            }));
            createdQuestions = await mockDb.createQuestions(questionInserts);
         }

         return NextResponse.json({
            message: "Session created successfully (Mock Mode)",
            session: {
                _id: newSession._id,
                role: newSession.role,
                experience: newSession.experience,
                createdAt: newSession.created_at,
            },
            questionsCount: createdQuestions.length,
         })
    }
    // --------------------

    // Create Session
    const newSession = await Session.create({
      user_id: userId,
      role,
      experience,
      topics_to_focus: topicsToFocus || "",
      description: description || "",
    })

    let createdQuestions = []
    if (Array.isArray(questions) && questions.length > 0) {
      const questionInserts = questions.map((q) => ({
        session_id: newSession._id,
        user_id: userId,
        question: q.question || "",
        answer: q.answer || "",
        is_pinned: false,
      }))

      try {
        createdQuestions = await Question.insertMany(questionInserts)
      } catch (qError) {
        console.error("Failed to save questions:", qError)
        // Rollback: delete the session if questions fail
        await Session.findByIdAndDelete(newSession._id)
        return NextResponse.json(
          { message: "Failed to save questions. Session cancelled." },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: "Session created successfully",
      session: {
        _id: newSession._id,
        role: newSession.role,
        experience: newSession.experience,
        createdAt: newSession.created_at,
      },
      questionsCount: createdQuestions.length,
    })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
