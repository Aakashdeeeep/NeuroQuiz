import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required field: messages (array)" }, { status: 400 });
    }

    const systemPrompt = `You are the Knowledge Lab Neural AI, a brilliant, faintly robotic, cyber-assistant helping the user learn.
Current Quiz Context: ${context || "General"}

When the user asks for help:
1. DO NOT give them the direct answer to the current question. Guide them to it.
2. Provide concise, fascinating explanations using a slightly futuristic tone.
3. Keep responses under 3 paragraphs.`;

    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: geminiMessages,
      config: { systemInstruction: systemPrompt },
    });

    if (!response.text) {
      return NextResponse.json({ error: "Empty response from Gemini." }, { status: 500 });
    }

    return NextResponse.json({ reply: response.text }, { status: 200 });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Chat failed." }, { status: 500 });
  }
}
