// Debug endpoint to check questions in database
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(req) {
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

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ message: "sessionId required" }, { status: 400 })
    }

    const debugInfo = {
      userId,
      sessionId,
    }

    // Test 1: Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    debugInfo.test1_session = {
      exists: !!session,
      error: sessionError?.message,
      sessionUserId: session?.user_id,
      matchesCurrentUser: session?.user_id === userId
    }

    // Test 2: Try to get ALL questions (no filter)
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from("questions")
      .select("*")
      .limit(10)

    debugInfo.test2_allQuestions = {
      count: allQuestions?.length || 0,
      error: allQuestionsError?.message,
      sample: allQuestions?.[0] || null
    }

    // Test 3: Get questions for this specific session
    const { data: sessionQuestions, error: sessionQuestionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("session_id", sessionId)

    debugInfo.test3_sessionQuestions = {
      count: sessionQuestions?.length || 0,
      error: sessionQuestionsError?.message,
      questions: sessionQuestions || []
    }

    // Test 4: Try with different query methods
    const { data: sessionQuestions2, error: sessionQuestionsError2 } = await supabase
      .from("questions")
      .select("id, session_id, question, answer")
      .eq("session_id", sessionId)

    debugInfo.test4_sessionQuestionsSelect = {
      count: sessionQuestions2?.length || 0,
      error: sessionQuestionsError2?.message
    }

    // Test 5: Check if questions table exists and is accessible
    const { data: tableInfo, error: tableError } = await supabase
      .from("questions")
      .select("id")
      .limit(1)

    debugInfo.test5_tableAccess = {
      accessible: !tableError,
      error: tableError?.message
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

