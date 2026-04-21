import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type Difficulty = "easy" | "medium" | "hard";

type PuzzleWord = {
  word: string;
  reveal: string;
  clue: string;
  category: string;
  difficulty: Difficulty;
};

type PuzzleResponse = {
  puzzle: PuzzleWord[];
};

// In-memory cache (per serverless instance). Good enough — Vercel reuses warm
// instances for repeat requests, and this saves Gemini calls on the same day.
// Key: `${category}|${difficulty}|${YYYY-MM-DD}`
const cache = new Map<string, PuzzleResponse>();

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

function buildPrompt(category: string, difficulty: Difficulty): string {
  return `Generate exactly 8 words for a word guessing puzzle game called "Word Perch".

Category: ${category}
Difficulty: ${difficulty}

Word length rules:
- easy: common words 3-5 letters, known by all ages
- medium: familiar words 5-7 letters
- hard: challenging but well-known words 7-9 letters

For each word provide:
1. word: the complete word (capitalize first letter only). Prefer single-word, well-known nouns.
2. reveal: a placeholder of underscores, ignored by the client (the client randomizes its own reveal mask). Use just underscores the same length as the word.
3. clue: ONE concise, vivid sentence (12-25 words) describing the word so a player can guess it. CRITICAL: the clue MUST NOT contain the answer word, any plural/possessive form of it, or any obvious sub-string of it. Use a synonym or paraphrase instead. Family-friendly tone. No quotation marks around the answer.
4. category: "${category}"
5. difficulty: "${difficulty}"

Constraints:
- Family-friendly. All ages. No offensive words.
- Only well-known words from the chosen category. No obscure vocabulary.
- 8 unique words, no duplicates.

Return ONLY a valid JSON object, no markdown, no commentary, in exactly this shape:
{
  "puzzle": [
    { "word": "Pizza", "reveal": "_____", "clue": "This iconic round dish topped with cheese and tomato sauce originated in Naples and became the world's most popular fast food.", "category": "Food", "difficulty": "medium" }
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

function validatePuzzle(
  raw: unknown,
  category: string,
  difficulty: Difficulty,
): PuzzleResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid response: not an object");
  }
  const r = raw as Record<string, unknown>;
  const puzzle = r["puzzle"];
  if (!Array.isArray(puzzle) || puzzle.length === 0) {
    throw new Error("Invalid response: missing puzzle array");
  }
  const words: PuzzleWord[] = [];
  for (const item of puzzle) {
    if (typeof item !== "object" || item === null) continue;
    const it = item as Record<string, unknown>;
    const word = typeof it["word"] === "string" ? (it["word"] as string) : "";
    const reveal =
      typeof it["reveal"] === "string" ? (it["reveal"] as string) : "";
    const clueRaw =
      typeof it["clue"] === "string" ? (it["clue"] as string).trim() : "";
    if (!word || word.length < 2) continue;
    const safeReveal =
      reveal.length === word.length
        ? reveal
        : word
            .split("")
            .map((ch, i) => (i === 0 ? ch : "_"))
            .join("");
    const safeClue =
      clueRaw && clueRaw.length >= 10 && clueRaw.length <= 400
        ? clueRaw
        : "A fascinating word worth knowing.";
    words.push({
      word,
      reveal: safeReveal,
      clue: safeClue,
      category,
      difficulty,
    });
  }
  if (words.length < 4) {
    throw new Error("Invalid response: too few valid words");
  }
  return { puzzle: words.slice(0, 8) };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Vercel forwards the client IP in x-forwarded-for.
  const fwd = req.headers["x-forwarded-for"];
  const ip = (
    Array.isArray(fwd) ? fwd[0] : (fwd ?? "").toString().split(",")[0]
  ).trim() || "unknown";

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

  const body = (req.body ?? {}) as {
    category?: unknown;
    difficulty?: unknown;
  };
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const difficultyRaw =
    typeof body.difficulty === "string"
      ? body.difficulty.trim().toLowerCase()
      : "";

  if (!category || category.length > 40) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }
  if (!ALLOWED_DIFFICULTY.has(difficultyRaw as Difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }
  const difficulty = difficultyRaw as Difficulty;

  const cacheKey = `${category.toLowerCase()}|${difficulty}|${todayKey()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(category, difficulty);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.9,
      },
    });
    const text = response.text ?? "";
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = extractJson(text);
    const validated = validatePuzzle(parsed, category, difficulty);
    cache.set(cacheKey, validated);
    res.status(200).json(validated);
  } catch (err) {
    console.error("Puzzle generation failed", {
      err: err instanceof Error ? err.message : String(err),
      category,
      difficulty,
    });
    res
      .status(502)
      .json({ error: "Percy had trouble finding words. Try again!" });
  }
}
