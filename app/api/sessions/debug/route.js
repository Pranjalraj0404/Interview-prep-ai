// Debug endpoint to check database connection and sessions
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

    if (!userId) {
      return NextResponse.json({ message: "Invalid token: missing user ID" }, { status: 401 })
    }

    const debugInfo = {
      userId,
      tokenDecoded: {
        hasUserId: !!decoded.userId,
        hasId: !!decoded.id,
        keys: Object.keys(decoded)
      }
    }

    // Test 1: Check if sessions table exists and is accessible
    const { data: allSessions, error: allSessionsError } = await supabase
      .from("sessions")
      .select("id, user_id, role, created_at")
      .limit(10)

    debugInfo.test1_allSessions = {
      count: allSessions?.length || 0,
      error: allSessionsError?.message,
      sample: allSessions?.[0] || null
    }

    // Test 2: Check sessions for this specific user
    const { data: userSessions, error: userSessionsError } = await supabase
      .from("sessions")
      .select("id, user_id, role, created_at")
      .eq("user_id", userId)

    debugInfo.test2_userSessions = {
      count: userSessions?.length || 0,
      error: userSessionsError?.message,
      sessions: userSessions || []
    }

    // Test 3: Check if questions table exists
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from("questions")
      .select("id, session_id")
      .limit(10)

    debugInfo.test3_questions = {
      count: allQuestions?.length || 0,
      error: allQuestionsError?.message
    }

    // Test 4: Check questions for user's sessions
    if (userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map(s => s.id)
      const { data: sessionQuestions, error: sessionQuestionsError } = await supabase
        .from("questions")
        .select("id, session_id")
        .in("session_id", sessionIds)

      debugInfo.test4_sessionQuestions = {
        count: sessionQuestions?.length || 0,
        error: sessionQuestionsError?.message
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

