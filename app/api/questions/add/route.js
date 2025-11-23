import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function POST(req) {
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

    const { sessionId, questions } = await req.json()

    if (!sessionId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ message: "Session not found or not authorized" }, { status: 404 })
    }

    if (session.user_id !== userId) {
      return NextResponse.json({ message: "Session not found or not authorized" }, { status: 404 })
    }

    // NEW APPROACH: Insert questions one at a time to ensure each is saved
    console.log("Adding questions to session (new approach):", {
      sessionId,
      questionsCount: questions.length,
      sampleQuestion: questions[0] ? {
        hasQuestion: !!questions[0].question,
        hasAnswer: !!questions[0].answer,
        questionLength: questions[0].question?.length || 0
      } : null
    })

    const createdQuestions = []
    const errors = []

    // Insert questions one by one
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      // Ensure answer is not empty (database might require it)
      const questionData = {
        session_id: sessionId,
        question: q.question || "",
        answer: q.answer || "No answer provided",
      }

      const { data: inserted, error: insertError } = await supabase
        .from("questions")
        .insert(questionData)
        .select()
        .single()

      if (insertError) {
        console.error(`Error inserting question ${i + 1}:`, insertError)
        errors.push({ index: i, error: insertError.message })
      } else if (inserted) {
        createdQuestions.push(inserted)
        console.log(`Question ${i + 1} inserted successfully:`, inserted.id)
      }
    }

    if (errors.length > 0) {
      console.error("Some questions failed to insert:", errors)
      // Continue anyway if at least some were inserted
    }

    console.log("Batch insert complete:", {
      sessionId,
      attempted: questions.length,
      created: createdQuestions.length,
      errors: errors.length,
      createdIds: createdQuestions.map(q => q.id)
    })

    // Wait a moment for database to commit
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify questions were actually saved by querying them back
    const { data: verifyQuestions, error: verifyError } = await supabase
      .from("questions")
      .select("id, session_id, question")
      .eq("session_id", sessionId)

    console.log("Verification query after insert:", {
      sessionId,
      questionsFound: verifyQuestions?.length || 0,
      error: verifyError?.message,
      questionIds: verifyQuestions?.map(q => q.id) || [],
      allQuestions: verifyQuestions || []
    })

    if (createdQuestions.length === 0) {
      return NextResponse.json({ 
        message: "Failed to add questions",
        error: "No questions were inserted",
        details: errors,
        verifiedCount: verifyQuestions?.length || 0
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      createdQuestions: createdQuestions,
      count: createdQuestions.length,
      verifiedCount: verifyQuestions?.length || 0,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("Add questions error:", error)
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
