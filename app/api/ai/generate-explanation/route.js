// GUARDRAIL: This API route generates explanations - DO NOT DELETE
// Always returns valid JSON, never HTML or Markdown
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

const conceptExplainPrompt = (question) => {
  return `
    You are an AI trained to generate explanations for a given interview question.
    Task:
    - Explain the following interview question and its concept in depth as if you're teaching a beginner developer.
    - Question: "${question}"
    - After the explanation, provide a short and clear title that summarizes the concept for the article or page header.
    - If the explanation includes a code example, provide a small code block.
    - Keep the formatting very clean and clear.
    - Return the result as a valid JSON object in the following format:
    {
        "title": "Short title here?",
        "explanation": "Explanation here."
    }
    Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
  `;
};

// GUARDRAIL: This function cleans AI responses - DO NOT MODIFY without testing JSON parsing
const cleanAIResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid AI response: not a string');
  }
  return rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^```\s*$/i, "")
    .trim();
};

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ message: "Server misconfigured: JWT_SECRET missing" }, { status: 500 });
    }
    jwt.verify(token, secret);

    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Generating explanation with Gemini API...");

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Server misconfigured: missing API key",
          message: "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try multiple model names in order of preference
    // Updated to use newer models that are actually available
    // Based on API key access, these models work: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
    const modelNames = [
      "gemini-2.0-flash",          // Stable flash model (confirmed working)
      "gemini-2.5-flash",          // Latest flash model (confirmed working)
      "gemini-2.5-pro",            // Latest pro model (confirmed working)
      "gemini-2.0-flash-exp",      // Experimental (may have quota limits)
      "gemini-1.5-flash",          // Fallback to older models
      "gemini-pro",                // Legacy fallback
      "gemini-1.5-pro",            // Legacy fallback
    ];
    
    // Initialize model (this doesn't validate availability, but we'll catch errors in generateContent)
    let model = genAI.getGenerativeModel({ model: modelNames[0] });
    
    const prompt = conceptExplainPrompt(question);

    let result, response, rawText;
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      rawText = response.text();
    } catch (apiError) {
      console.error("Gemini API call failed with primary model:", apiError);
      
      // If model not found error, try other models
      if (apiError.message?.includes("404") || 
          apiError.message?.includes("not found") || 
          apiError.message?.includes("not available")) {
        
        // Try fallback models
        for (let i = 1; i < modelNames.length; i++) {
          try {
            console.log(`Trying fallback model: ${modelNames[i]}`);
            model = genAI.getGenerativeModel({ model: modelNames[i] });
            result = await model.generateContent(prompt);
            response = await result.response;
            rawText = response.text();
            console.log(`Successfully used model: ${modelNames[i]}`);
            break;
          } catch (fallbackError) {
            console.warn(`Fallback model ${modelNames[i]} failed:`, fallbackError.message);
            if (i === modelNames.length - 1) {
              // All models failed
              return NextResponse.json(
                {
                  error: "Model not available",
                  message: `The AI model is not available. Error: ${apiError.message}. Please check your API key has access to Gemini models.`,
                  hint: "Your API key might not have access to the requested models. Try using a different API key or check your Google Cloud project settings.",
                  details: apiError.message
                },
                { status: 503 }
              );
            }
          }
        }
      } else {
        // Other types of errors (quota, invalid key, etc.)
        throw apiError;
      }
    }

    console.log(
      "Raw AI explanation response received:",
      rawText.substring(0, 100) + "..."
    );

    const cleanedText = cleanAIResponse(rawText);

    try {
      const jsonData = JSON.parse(cleanedText);

      if (!jsonData.title || !jsonData.explanation) {
        throw new Error(
          "AI response missing required fields: title or explanation"
        );
      }

      return NextResponse.json(jsonData);
    } catch (parseError) {
      console.error("Failed to parse AI explanation response:", parseError);
      console.error("Raw AI response:", rawText);
      console.error("Cleaned text:", cleanedText);

      return NextResponse.json(
        {
          message: "AI generated an invalid explanation format. Please try again.",
          error: "INVALID_AI_RESPONSE",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("AI explanation generation error:", error);

    const msg = error?.message || "";

    if (msg.includes("API_KEY_INVALID") || msg.includes("API Key not found") || msg.includes("API key")) {
      return NextResponse.json(
        {
          message: "Invalid Gemini API key. Please check your configuration.",
          error: "API_KEY_INVALID",
        },
        { status: 400 }
      );
    }

    if (msg.includes("quota") || msg.includes("QUOTA_EXCEEDED")) {
      return NextResponse.json(
        {
          message: "API quota exceeded. Please try again later.",
          error: "QUOTA_EXCEEDED",
        },
        { status: 429 }
      );
    }

    if (msg.includes("404") || msg.includes("not found") || msg.includes("not available")) {
      return NextResponse.json(
        {
          error: "Model not available",
          message: `The AI model is not available. Error: ${msg}. Please check your GEMINI_API_KEY and ensure it has access to Gemini models.`,
          hint: "Your API key might not have access to the requested models. Try using a different API key or check your Google Cloud project settings.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to generate explanation using AI. Please try again later.",
        error: "AI_EXPLANATION_FAILED",
        details: msg,
      },
      { status: 500 }
    );
  }
}
