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
      console.warn("GEMINI_API_KEY missing. Returning mock explanation.");
      return NextResponse.json({
        title: "Mock Explanation (Dev Mode)",
        explanation: "This is a simulated explanation because the GEMINI_API_KEY is missing. In a real environment, this would be a detailed AI-generated explanation of the concept."
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try multiple model names in order of preference
    // Prioritizing newer models (Gemini 2.5) as Gemini 2.0 Flash/Lite are being discontinued
    const modelNames = [
      "gemini-2.5-flash",          // Newest, Fast
      "gemini-2.5-flash-lite",     // Newest, Lighter
      "gemini-1.5-flash",          // Stable, Fast, Cost-effective
      "gemini-1.5-pro",            // Stable, High capability
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
      
      // If model not found error or other potentially recoverable errors, try other models
      if (
        apiError.message?.includes("404") || 
        apiError.message?.includes("not found") || 
        apiError.message?.includes("not available") ||
        apiError.message?.includes("429") ||
        apiError.message?.includes("quota")
      ) {
        console.warn(`Primary model failed with ${apiError.message}. Attempting fallbacks...`);
        
        // Try fallback models
        for (let i = 1; i < modelNames.length; i++) {
          try {
            // Add a small delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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
              // If all models fail, check if it was a quota error
              if (
                apiError.message?.includes("429") || 
                apiError.message?.includes("quota") ||
                fallbackError.message?.includes("429") ||
                fallbackError.message?.includes("quota")
              ) {
                 throw new Error("QUOTA_EXCEEDED");
              }
              
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
      console.warn("API quota exceeded. Returning fallback explanation.");
      return NextResponse.json(
        {
          title: "Explanation Unavailable (Offline Mode)",
          explanation: "The AI service is currently unavailable due to high traffic or quota limits. Please try again later to get a detailed AI-powered explanation for this question."
        }
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
