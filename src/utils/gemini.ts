import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Only initialize if API key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function parseGeminiError(err: any): Error {
  let emsg = err?.message || String(err);
  try {
    if (emsg.includes("{") && emsg.includes("}")) {
      const match = emsg.match(/\{.*\}/s);
      if (match) {
         const parsed = JSON.parse(match[0]);
         const code = parsed?.error?.code || parsed?.ERROR?.CODE;
         if (code === 429 || emsg.includes("429") || emsg.includes("QUOTA EXCEEDED") || emsg.includes("QUOTA")) {
           return new Error("API Rate Limit Exceeded: You've reached the free tier limit. Retrying automatically — please wait...");
         }
         if (parsed?.error?.message || parsed?.ERROR?.MESSAGE) {
           return new Error(parsed?.error?.message || parsed?.ERROR?.MESSAGE);
         }
      }
    }
  } catch (e) {}
  
  if (emsg.includes("429") || emsg.includes("QUOTA")) {
    return new Error("API Rate Limit Exceeded: Please wait a minute and try again.");
  }
  
  return err instanceof Error ? err : new Error(emsg);
}

function isRateLimitError(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.includes("429") ||
    msg.includes("QUOTA") ||
    msg.includes("rate limit") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

// Retry with exponential backoff on rate limit errors
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [5000, 10000, 20000]; // 5s, 10s, 20s
  let lastError: any;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isRateLimitError(err) && !isLastAttempt) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function generateQuiz({
  topic,
  numQuestions,
  difficulty,
}: {
  topic: string;
  numQuestions: number;
  difficulty: string;
}) {
  if (!ai) throw new Error("VITE_GEMINI_API_KEY is missing from environment variables.");

  const prompt = `Generate a quiz about "${topic}" with a MIX of exactly these three question types:
- "mcq": Multiple choice with 4 options
- "true_false": True or False question (options must be exactly ["True", "False"])
- "fill_blank": Fill in the blank (the question text must contain "___" where the answer goes, NO options array — set options to [])

Difficulty: ${difficulty}. Total questions: ${numQuestions}.
Distribute question types roughly equally (e.g., for 9 questions: 3 MCQ, 3 True/False, 3 Fill-in-blank).

Return ONLY a valid JSON array. Each object MUST follow this exact structure:
[
  {
    "type": "mcq",
    "question": "What is X?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "One sentence max.",
    "hint": "A short, subtle clue that helps the user without giving the answer away."
  },
  {
    "type": "true_false",
    "question": "The sky is green.",
    "options": ["True", "False"],
    "correctAnswer": "False",
    "explanation": "One sentence max.",
    "hint": "A short, subtle clue."
  },
  {
    "type": "fill_blank",
    "question": "The capital of France is ___.",
    "options": [],
    "correctAnswer": "Paris",
    "explanation": "One sentence max.",
    "hint": "Think about the Eiffel Tower."
  }
]`;

  // Try primary model (2.5-flash), then fall back to 2.0-flash if rate limited
  const modelOrder = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError: any;

  for (const model of modelOrder) {
    try {
      const result = await withRetry(async () => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        if (!response.text) throw new Error("No text returned from Gemini API.");
        const parsedData = JSON.parse(response.text);
        return { questions: parsedData };
      });
      return result;
    } catch (err: any) {
      lastError = err;
      // Only fall through to the next model on a rate limit error
      if (!isRateLimitError(err)) break;
    }
  }

  throw parseGeminiError(lastError);
}

export async function generateChatReply(
  messages: { role: string; content: string }[],
  context: string
) {
  if (!ai) throw new Error("VITE_GEMINI_API_KEY is missing from environment variables.");

  const systemPrompt = `You are the Knowledge Lab Neural AI, a brilliant, faintly robotic, cyber-assistant helping the user learn.
Current Quiz Context: ${context || "General"}

When the user asks for help:
1. DO NOT give them the direct answer to the current question. Guide them to it.
2. Provide concise, fascinating explanations using a slightly futuristic tone.
3. Keep responses under 3 paragraphs.`;

  const geminiMessages = messages.map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  try {
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: geminiMessages,
        config: { systemInstruction: systemPrompt },
      });

      if (!response.text) throw new Error("No text returned from Gemini API.");
      return response.text;
    });
    return result;
  } catch (err) {
    throw parseGeminiError(err);
  }
}
