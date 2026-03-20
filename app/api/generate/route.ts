import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [5000, 10000, 20000];
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = (err as Error)?.message || "";
      const isRateLimit = msg.includes("429") || msg.includes("QUOTA") || msg.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { topic, numQuestions, difficulty } = await req.json();

    if (!topic || !numQuestions || !difficulty) {
      return NextResponse.json({ error: "Missing required fields: topic, numQuestions, difficulty" }, { status: 400 });
    }

    const prompt = `Generate a quiz about "${topic}" with a MIX of exactly these three question types:
- "mcq": Multiple choice with 4 options
- "true_false": True or False question (options must be exactly ["True", "False"])
- "fill_blank": Fill in the blank (the question text must contain "___" where the answer goes, NO options array — set options to [])

Difficulty: ${difficulty}. Total questions: ${numQuestions}.
Distribute question types roughly equally.

Return ONLY a valid JSON array. Each object MUST follow this exact structure:
[
  {
    "type": "mcq",
    "question": "What is X?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "One sentence max.",
    "hint": "A short, subtle clue."
  }
]`;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      if (!response.text) throw new Error("No text returned from Gemini API.");
      return JSON.parse(response.text);
    });

    return NextResponse.json({ questions: result }, { status: 200 });
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Failed to generate quiz." }, { status: 500 });
  }
}
