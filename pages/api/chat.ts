/**
 * Next.js API Route: /api/chat
 *
 * Handles AI assistant chat messages for the in-quiz hint system.
 * The Gemini chat API is called server-side, keeping the API key secure.
 *
 * Method: POST
 * Body: { messages: { role: string, content: string }[], context: string }
 * Returns: { reply: string }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { messages, context } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing required field: messages (array)" });
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: geminiMessages,
      config: { systemInstruction: systemPrompt },
    });

    if (!response.text) {
      return res.status(500).json({ error: "Empty response from Gemini." });
    }

    return res.status(200).json({ reply: response.text });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: (err as Error)?.message || "Chat failed." });
  }
}
