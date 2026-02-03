// Test endpoint to check available Gemini models
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          message: "GEMINI_API_KEY is missing. Running in Mock Mode.",
          status: "mock_mode",
          models: []
        },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try to list available models
    const models = [];
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a simple test call
        const result = await model.generateContent("Say 'test'");
        const text = result.response.text();
        models.push({
          name: modelName,
          status: "available",
          testResponse: text.substring(0, 50)
        });
      } catch (error) {
        models.push({
          name: modelName,
          status: "not available",
          error: error.message
        });
      }
    }

    return NextResponse.json({
      message: "Model availability test",
      apiKeySet: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + "...",
      models: models,
      recommendation: models.find(m => m.status === "available")?.name || "No models available"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to test models",
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

