import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ message: "Server misconfigured: JWT_SECRET missing" }, { status: 500 });
    }
    jwt.verify(token, secret);

    const body = await request.json();
    const role = body.role || "Software Engineer";
    const experience = body.experience || "Mid-Level (3-5 years)";
    const topics = body.topicsToFocus || "General";
    const count = Math.max(1, Math.min(parseInt(body.numberOfQuestions) || 10, 25));

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "undefined") {
      console.warn("GEMINI_API_KEY is missing or invalid");
      const fallback = Array.from({ length: count }).map((_, i) => ({
        question: `Draft Q${i + 1}: ${role} • ${topics}`,
        answer: "Generated without AI due to missing API key.",
      }));
      return NextResponse.json(fallback);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
    let model = genAI.getGenerativeModel({ model: modelNames[0] });

    const prompt = `Generate ${count} interview questions and concise model answers for a ${role} with ${experience} experience focusing on ${topics}.
Return strictly valid JSON array where each item is {"question":"...","answer":"..."}. No markdown, no fences, no extra text.`;

    let rawText;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
    } catch (apiError) {
      if (
        apiError.message?.includes("404") ||
        apiError.message?.includes("not found") ||
        apiError.message?.includes("not available") ||
        apiError.message?.includes("429") ||
        apiError.message?.includes("quota")
      ) {
        console.warn(`Primary model failed with ${apiError.message}. Attempting fallbacks...`);
        
        for (let i = 1; i < modelNames.length; i++) {
          try {
            // Add a small delay before retrying to avoid hitting rate limits immediately
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(`Trying fallback model: ${modelNames[i]}`);
            model = genAI.getGenerativeModel({ model: modelNames[i] });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            rawText = response.text();
            break;
          } catch (fallbackError) {
            console.warn(`Fallback model ${modelNames[i]} failed:`, fallbackError.message);
            if (i === modelNames.length - 1) {
              // If all models fail, check if it was a quota error
              if (
                apiError.message?.includes("429") || 
                apiError.message?.includes("quota") ||
                fallbackError.message?.includes("429") ||
                fallbackError.message?.includes("quota")
              ) {
                 // Return a specific error structure that we can handle gracefully
                 throw new Error("QUOTA_EXCEEDED");
              }
              throw apiError;
            }
          }
        }
      } else {
        throw apiError;
      }
    }

    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json({ message: "Invalid AI response" }, { status: 500 });
    }

    const normalized = Array.isArray(parsed)
      ? parsed.slice(0, count).map((q) => ({
          question: String(q.question || "").trim(),
          answer: String(q.answer || "").trim(),
        }))
      : [];

    if (normalized.length === 0) {
      const fallback = Array.from({ length: count }).map((_, i) => ({
        question: `Draft Q${i + 1}: ${role} • ${topics}`,
        answer: "Generated fallback due to empty AI response.",
      }));
      return NextResponse.json(fallback);
    }

    return NextResponse.json(normalized);
  } catch (error) {
    const msg = error?.message || "";
    if (msg.includes("API key") || msg.includes("API_KEY_INVALID")) {
      return NextResponse.json({ message: "Invalid Gemini API key" }, { status: 400 });
    }
    if (msg.includes("quota") || msg.includes("QUOTA_EXCEEDED")) {
      console.warn("API quota exceeded. Returning fallback questions.");
      // Fallback generation when quota is exceeded
      const body = await request.clone().json().catch(() => ({}));
      const role = body.role || "Software Engineer";
      const topics = body.topicsToFocus || "General";
      const count = Math.max(1, Math.min(parseInt(body.numberOfQuestions) || 10, 25));

      const fallback = Array.from({ length: count }).map((_, i) => ({
        question: `(Offline Mode) ${role} Question ${i + 1} about ${topics}`,
        answer: "This question was generated in offline mode because the AI service is currently busy. Please try again later for AI-powered questions.",
      }));
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
