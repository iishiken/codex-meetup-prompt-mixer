const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.PUBLIC_SITE_URL,
].filter(Boolean);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
  }

  let body;

  try {
    body = req.body || (await readJsonBody(req));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const theme = String(body.theme || "Meetup支援").slice(0, 80);
  const difficulty = String(body.difficulty || "5分で見える").slice(0, 80);
  const stack = String(body.stack || "HTML/CSS/JS").slice(0, 80);
  const tone = String(body.tone || "明るく実用的").slice(0, 80);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.PUBLIC_SITE_URL || "https://example.com",
      "X-OpenRouter-Title": "Vibe Coding Prompt Mixer",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: [
            "あなたはCodex Meetupのvibeコーディング案内役です。",
            "スマホからCodexへそのまま渡せる、vibeコーディングのお題を日本語で1つ作ってください。",
            "必ずJSONだけを返してください。Markdown、説明、コードフェンスは不要です。",
            "JSON schema: {\"challenge\":\"短いお題名\",\"difficulty\":\"初級|中級|上級\",\"duration\":\"5分|10分|15分\",\"prompt\":\"Codexに渡す具体的な指示文\"}",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `テーマ: ${theme}`,
            `難易度: ${difficulty}`,
            `技術: ${stack}`,
            `見た目: ${tone}`,
            "条件に合うWebアプリのお題を作ってください。",
          ].join("\n"),
        },
      ],
      temperature: 0.9,
      max_completion_tokens: 360,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "OpenRouter request failed",
    });
  }

  const content = data.choices?.[0]?.message?.content?.trim() || "{}";

  try {
    const result = JSON.parse(content);

    return res.status(200).json({
      challenge: String(result.challenge || "").slice(0, 120),
      difficulty: String(result.difficulty || difficulty).slice(0, 40),
      duration: String(result.duration || "").slice(0, 40),
      prompt: String(result.prompt || "").slice(0, 1200),
    });
  } catch {
    return res.status(200).json({
      challenge: "vibeコーディングお題",
      difficulty,
      duration: difficulty.includes("5") ? "5分" : "10分",
      prompt: content,
    });
  }
}
