export async function callZai(
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<string> {
  const url = "https://api.z.ai/api/coding/paas/v4/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept-Language": "en-US,en",
    },
    body: JSON.stringify({
      model: "glm-4.7",
      messages: messages,
      temperature: 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Z.AI API call failed: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || "No content received.";
}

export async function callOpenAi(
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<string> {
  const url = "https://api.openai.com/v1/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API call failed: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || "No content received.";
}
