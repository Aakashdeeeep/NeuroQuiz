export async function generateQuiz({
  topic,
  numQuestions,
  difficulty,
}: {
  topic: string;
  numQuestions: number;
  difficulty: string;
}) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, numQuestions, difficulty }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = errorData.error || response.statusText;
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      msg = "API KEY EXPIRED. PLEASE RENEW THE API KEY."; 
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data;
}

export async function generateChatReply(
  messages: { role: string; content: string }[],
  context: string
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = errorData.error || response.statusText;
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      msg = "API KEY EXPIRED. PLEASE RENEW THE API KEY."; 
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.reply;
}
