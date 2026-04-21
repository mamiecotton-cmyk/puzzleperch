import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type Difficulty = "easy" | "medium" | "hard";

type Riddle = {
  scenario: string;
  answer: string;
  keywords: string[];
  acceptedAnswers: string[];
  hints: string[];
  decoys: string[];
};

type RiddleResponse = {
  riddles: Riddle[];
};

// In-memory cache keyed by `${difficulty}|${YYYY-MM-DD}`.
// Vercel can reuse warm instances, which helps avoid repeat Gemini calls.
const cache = new Map<string, RiddleResponse>();

// Per-IP rate limit: 10 requests / minute.
const rateBuckets = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_DIFFICULTY: ReadonlySet<Difficulty> = new Set([
  "easy",
  "medium",
  "hard",
]);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (arr.length >= RATE_LIMIT) {
    rateBuckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(ip, arr);
  return true;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function buildPrompt(difficulty: Difficulty): string {
  const difficultyGuide: Record<Difficulty, string> = {
    easy:
      'Use well-known, classic lateral thinking puzzles with clear "aha!" moments - the twist should click within 30 seconds of reading. Common tropes are fine (things like "it was a photograph", "it was a game", "they were fish", "he had hiccups", "he was short").',
    medium:
      'Use moderate lateral puzzles that require a mental leap. The twist is not immediately obvious but is satisfying when revealed. Think classic "situation puzzles" like the man with the unopened package, the woman afraid of the masked man, etc.',
    hard:
      "Use tricky lateral puzzles with obscure or multi-layered twists. The solution should require several logical leaps. Avoid absurdist or unfair puzzles - the answer must still feel fair and satisfying once revealed.",
  };

  return `Generate exactly 3 lateral thinking riddles for a daily puzzle game called "Lateral Lounge".

Difficulty: ${difficulty}
Style: ${difficultyGuide[difficulty]}

For each riddle provide:
1. scenario: The puzzle text. 2-5 sentences, under 80 words total. Present a strange or paradoxical situation that has a logical explanation. Do NOT give away the twist.
2. answer: The full explanation revealing the twist. 1-3 sentences. Satisfying "aha!" quality.
3. keywords: Array of 3-5 single lowercase words that capture the core twist. A user's answer containing ANY of these keywords should count as correct. Include the main concept plus natural synonyms. Example: ["parachute", "skydiving", "fell", "jumping"]. Do NOT include common stopwords (the, a, and, he, etc).
4. acceptedAnswers: Array of 5-8 short phrasings (2-8 words each, lowercase) a user might type to describe the twist. Include different valid ways to express the answer. Example: ["his parachute didn't open", "skydiving accident", "he was falling", "parachute failed"].
5. hints: Array of EXACTLY 3 progressive hints, each a short narrowing question or nudge (5-12 words). They should gradually narrow without giving away the answer. Hint 1 = most subtle. Hint 3 = strongest clue. Example: ["Think about what was in the package.", "He was traveling vertically.", "Gravity was his real problem."]
6. decoys: Array of EXACTLY 3 plausible-but-wrong explanations for the scenario (4-15 words each). Must sound like reasonable lateral-thinking answers - not absurd. Used as multiple-choice distractors. Example: ["He was the victim of a hit-and-run", "He was poisoned by a spy", "He died of exposure overnight"].

Constraints:
- Family-friendly. No graphic violence, no sexual content, no political topics, no slurs.
- Scenarios can involve death as in classic lateral puzzles (people die in these puzzles - that's fine - but keep it non-graphic).
- 3 riddles, all unique from each other in subject matter.
- Return ONLY a valid JSON object, no markdown fences, no commentary.

Exact output shape:
{
  "riddles": [
    {
      "scenario": "...",
      "answer": "...",
      "keywords": ["...", "..."],
      "acceptedAnswers": ["...", "..."],
      "hints": ["...", "...", "..."],
      "decoys": ["...", "...", "..."]
    }
  ]
}`;
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function asStringArray(v: unknown, minLen = 1): string[] {
  if (!Array.isArray(v)) {
    return [];
  }

  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") {
      continue;
    }
    const trimmed = item.trim();
    if (trimmed.length >= minLen) {
      out.push(trimmed);
    }
  }
  return out;
}

function validateRiddles(raw: unknown): RiddleResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid response: not an object");
  }

  const data = raw as Record<string, unknown>;
  const rawRiddles = data["riddles"];
  if (!Array.isArray(rawRiddles) || rawRiddles.length === 0) {
    throw new Error("Invalid response: missing riddles array");
  }

  const riddles: Riddle[] = [];
  for (const item of rawRiddles) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const scenario =
      typeof record["scenario"] === "string" ? record["scenario"].trim() : "";
    const answer =
      typeof record["answer"] === "string" ? record["answer"].trim() : "";
    const keywords = asStringArray(record["keywords"])
      .map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ""))
      .filter((value) => value.length >= 2);
    const acceptedAnswers = asStringArray(record["acceptedAnswers"]).map(
      (value) => value.toLowerCase(),
    );
    const hints = asStringArray(record["hints"]);
    const decoys = asStringArray(record["decoys"]);

    if (scenario.length < 15 || scenario.length > 600) {
      continue;
    }
    if (answer.length < 5 || answer.length > 400) {
      continue;
    }
    if (keywords.length < 1) {
      continue;
    }
    if (hints.length < 1) {
      continue;
    }
    if (decoys.length < 3) {
      continue;
    }

    while (hints.length < 3) {
      hints.push("Keep thinking - you're close.");
    }

    riddles.push({
      scenario,
      answer,
      keywords: keywords.slice(0, 6),
      acceptedAnswers: acceptedAnswers.slice(0, 10),
      hints: hints.slice(0, 3),
      decoys: decoys.slice(0, 3),
    });
  }

  if (riddles.length < 3) {
    throw new Error("Invalid response: fewer than 3 valid riddles");
  }

  return { riddles: riddles.slice(0, 3) };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd ?? "").toString().split(",")[0]).trim() ||
    "unknown";

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    res
      .status(500)
      .json({ error: "Server not configured. Please contact support." });
    return;
  }

  const body = (req.body ?? {}) as { difficulty?: unknown };
  const difficultyRaw =
    typeof body.difficulty === "string"
      ? body.difficulty.trim().toLowerCase()
      : "";

  if (!ALLOWED_DIFFICULTY.has(difficultyRaw as Difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }

  const difficulty = difficultyRaw as Difficulty;
  const cacheKey = `${difficulty}|${todayKey()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(difficulty);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.95,
      },
    });

    const text = response.text ?? "";
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = extractJson(text);
    const validated = validateRiddles(parsed);
    cache.set(cacheKey, validated);
    res.status(200).json(validated);
  } catch (err) {
    console.error("Riddle generation failed", {
      err: err instanceof Error ? err.message : String(err),
      difficulty,
    });
    res
      .status(502)
      .json({ error: "Percy couldn't dream up riddles. Try again!" });
  }
}
