// Test endpoint to directly insert and verify a question
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

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ message: "sessionId required" }, { status: 400 })
    }

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session || session.user_id !== userId) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    const testQuestion = {
      session_id: sessionId,
      question: "Test question - " + new Date().toISOString(),
      answer: "Test answer",
    }

    console.log("TEST: Inserting test question:", testQuestion)

    // Insert test question
    const { data: inserted, error: insertError } = await supabase
      .from("questions")
      .insert(testQuestion)
      .select()
      .single()

    if (insertError) {
      console.error("TEST: Insert error:", insertError)
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: insertError,
        testQuestion
      }, { status: 500 })
    }

    console.log("TEST: Question inserted:", inserted)

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500))

    // Try to fetch it back
    const { data: fetched, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", inserted.id)
      .single()

    console.log("TEST: Fetch result:", {
      found: !!fetched,
      error: fetchError?.message,
      data: fetched
    })

    // Try to fetch all questions for this session
    const { data: allSessionQuestions, error: allError } = await supabase
      .from("questions")
      .select("*")
      .eq("session_id", sessionId)

    console.log("TEST: All questions for session:", {
      count: allSessionQuestions?.length || 0,
      error: allError?.message
    })

    return NextResponse.json({
      success: true,
      inserted: inserted,
      fetched: fetched,
      allQuestionsCount: allSessionQuestions?.length || 0,
      allQuestions: allSessionQuestions || [],
      fetchError: fetchError?.message,
      allError: allError?.message
    })
  } catch (error) {
    console.error("TEST: Error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

