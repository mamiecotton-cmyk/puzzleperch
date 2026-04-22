import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

type Difficulty = "easy" | "medium" | "hard";

type ThemeVaultPack = {
  theme: string;
  clue: string;
  words: string[];
  master: string;
  unlockCopy: string;
};

type ThemeVaultResponse = {
  pack: ThemeVaultPack;
};

const cache = new Map<string, ThemeVaultResponse>();
const rateBuckets = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_DIFFICULTY: ReadonlySet<Difficulty> = new Set([
  "easy",
  "medium",
  "hard",
]);

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (rateBuckets.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(ip, recent);
  return true;
}

function todayKey(): string {
  const value = new Date();
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

function buildPrompt(difficulty: Difficulty, dateKey: string): string {
  const guide: Record<Difficulty, string> = {
    easy:
      "Use approachable everyday themes. Theme words should usually be 4-7 letters and clearly connected. The master word should be 6-8 letters and feel satisfying, not obscure.",
    medium:
      "Use richer themes that require a small leap. Theme words should usually be 5-8 letters. The master word should be 6-9 letters and tie the set together cleanly.",
    hard:
      "Use deeper themes with more specific vocabulary, while still fair. Theme words should usually be 6-10 letters. The master word should be 7-10 letters and elegant, not random.",
  };

  return `Generate exactly 1 content pack for a daily word puzzle game called "Theme Vault".

Date key: ${dateKey}
Difficulty: ${difficulty}
Style guide: ${guide[difficulty]}

The puzzle works like this:
- Players search a letter grid to find exactly 4 theme-related words.
- After all 4 theme words are found, they solve 1 hidden master word.
- Every solved theme word reveals another letter of the master word.
- The experience should feel calm, smart, and replayable as a daily brain workout.

Return exactly one JSON object with this shape:
{
  "pack": {
    "theme": "short theme title",
    "clue": "one short clue sentence",
    "words": ["WORDONE", "WORDTWO", "WORDTHREE", "WORDFOUR"],
    "master": "MASTERWORD",
    "unlockCopy": "one short sentence about the vault reveal"
  }
}

Rules:
- Family-friendly only.
- Theme, clue, and answers must be original, clean, and not reference politics, sex, slurs, graphic violence, or current events.
- The 4 theme words must all be distinct, directly connected to the theme, and suitable for placement in a word-grid puzzle.
- Use single words only for "words" and "master". No spaces, hyphens, apostrophes, numerals, or punctuation.
- All answer words must be uppercase alphabetic A-Z only.
- Do not repeat the master word among the 4 theme words.
- Keep clue under 120 characters.
- Keep unlockCopy under 100 characters.
- Return ONLY valid JSON. No markdown fences. No commentary.`;
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function normalizeWord(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function asWordArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = normalizeWord(item);
    if (normalized.length < 3 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function validatePack(raw: unknown, difficulty: Difficulty): ThemeVaultResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid response: not an object");
  }

  const record = raw as Record<string, unknown>;
  const rawPack = record["pack"];
  if (typeof rawPack !== "object" || rawPack === null) {
    throw new Error("Invalid response: missing pack");
  }

  const pack = rawPack as Record<string, unknown>;
  const theme = typeof pack["theme"] === "string" ? pack["theme"].trim() : "";
  const clue = typeof pack["clue"] === "string" ? pack["clue"].trim() : "";
  const unlockCopy =
    typeof pack["unlockCopy"] === "string" ? pack["unlockCopy"].trim() : "";
  const words = asWordArray(pack["words"]).slice(0, 4);
  const master = typeof pack["master"] === "string"
    ? normalizeWord(pack["master"])
    : "";

  const bounds: Record<Difficulty, { minWord: number; maxWord: number; minMaster: number; maxMaster: number }> = {
    easy: { minWord: 4, maxWord: 7, minMaster: 6, maxMaster: 8 },
    medium: { minWord: 5, maxWord: 8, minMaster: 6, maxMaster: 9 },
    hard: { minWord: 6, maxWord: 10, minMaster: 7, maxMaster: 10 },
  };
  const limits = bounds[difficulty];

  if (theme.length < 4 || theme.length > 40) {
    throw new Error("Invalid response: theme length");
  }
  if (clue.length < 20 || clue.length > 120) {
    throw new Error("Invalid response: clue length");
  }
  if (unlockCopy.length < 20 || unlockCopy.length > 100) {
    throw new Error("Invalid response: unlock copy length");
  }
  if (words.length !== 4) {
    throw new Error("Invalid response: must contain exactly 4 theme words");
  }
  if (master.length < limits.minMaster || master.length > limits.maxMaster) {
    throw new Error("Invalid response: invalid master length");
  }
  if (words.includes(master)) {
    throw new Error("Invalid response: master duplicates a theme word");
  }
  if (
    words.some((word) => word.length < limits.minWord || word.length > limits.maxWord)
  ) {
    throw new Error("Invalid response: invalid theme word length");
  }

  return {
    pack: {
      theme,
      clue,
      words,
      master,
      unlockCopy,
    },
  };
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

  const body = (req.body ?? {}) as {
    difficulty?: unknown;
    dateKey?: unknown;
  };
  const difficultyRaw =
    typeof body.difficulty === "string"
      ? body.difficulty.trim().toLowerCase()
      : "";
  if (!ALLOWED_DIFFICULTY.has(difficultyRaw as Difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }

  const difficulty = difficultyRaw as Difficulty;
  const dateKey =
    typeof body.dateKey === "string" && DATE_KEY_RE.test(body.dateKey.trim())
      ? body.dateKey.trim()
      : todayKey();

  const cacheKey = `${difficulty}|${dateKey}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: buildPrompt(difficulty, dateKey) }] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        temperature: 0.9,
      },
    });

    const text = response.text ?? "";
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = extractJson(text);
    const validated = validatePack(parsed, difficulty);
    cache.set(cacheKey, validated);
    res.status(200).json(validated);
  } catch (error) {
    console.error("Theme Vault generation failed", {
      err: error instanceof Error ? error.message : String(error),
      difficulty,
      dateKey,
    });
    res.status(502).json({ error: "The vault is resting. Try again in a moment." });
  }
}
