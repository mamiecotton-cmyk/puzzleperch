const VERSION = "tv-v2";

export const DIFFICULTY_RULES = {
  easy: {
    label: "Easy",
    size: 5,
    free: true,
    targetTimeSec: 240,
    hintLimit: { free: 2, premium: 4 },
    points: { word: 20, master: 40, speed: 20 },
  },
  medium: {
    label: "Medium",
    size: 6,
    free: true,
    targetTimeSec: 330,
    hintLimit: { free: 2, premium: 5 },
    points: { word: 24, master: 50, speed: 25 },
  },
  hard: {
    label: "Hard",
    size: 7,
    free: false,
    targetTimeSec: 480,
    hintLimit: { free: 0, premium: 5 },
    points: { word: 30, master: 65, speed: 30 },
  },
};

const LIBRARY = {
  easy: [
    {
      theme: "Cozy Bakery",
      clue: "Every answer belongs in a warm, sweet bakery morning.",
      words: ["BREAD", "OVEN", "ICING", "SCONE"],
      master: "BAKERY",
      unlockCopy: "Each solve reveals a vault pin in the final bakery word.",
    },
    {
      theme: "Rainy Commute",
      clue: "Think about the gear, weather, and routine of a wet city commute.",
      words: ["TRAIN", "UMBRELLA", "PUDDLE", "COAT"],
      master: "MORNING",
      unlockCopy: "The hidden vault word ties the whole commute together.",
    },
  ],
  medium: [
    {
      theme: "Museum Night",
      clue: "The words fit a quiet late-night walk through a museum.",
      words: ["GALLERY", "MARBLE", "CURATOR", "FRAME"],
      master: "EXHIBIT",
      unlockCopy: "Theme solves feed the vault lock one letter at a time.",
    },
    {
      theme: "Campfire Lake",
      clue: "Every solve belongs at a calm campfire beside the water.",
      words: ["LANTERN", "KAYAK", "EMBER", "CANOE"],
      master: "OUTDOOR",
      unlockCopy: "Crack the vault to reveal the final outdoor answer.",
    },
  ],
  hard: [
    {
      theme: "Midnight Observatory",
      clue: "Look for words that belong in a serious stargazing session.",
      words: ["TELESCOPE", "SPECTRUM", "ORBIT", "CONSTELLATION"],
      master: "ASTRONOMY",
      unlockCopy: "Every solve lights a different tumbler in the vault.",
    },
    {
      theme: "Luxury Train",
      clue: "All answers fit a plush long-distance sleeper train.",
      words: ["COMPARTMENT", "PORTER", "DINING", "TICKET"],
      master: "VOYAGER",
      unlockCopy: "Open the vault with the word that ties the trip together.",
    },
  ],
};

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeWord(word) {
  return String(word).trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function choice(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function sanitizeThemeWords(words) {
  if (!Array.isArray(words)) return [];
  const seen = new Set();
  const out = [];
  for (const item of words) {
    const normalized = normalizeWord(item);
    if (normalized.length < 3 || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

export function normalizeThemeVaultPack(rawPack) {
  if (!rawPack || typeof rawPack !== "object") {
    throw new Error("Invalid Theme Vault pack");
  }

  const pack = rawPack;
  const theme = typeof pack.theme === "string" ? pack.theme.trim() : "";
  const clue = typeof pack.clue === "string" ? pack.clue.trim() : "";
  const unlockCopy = typeof pack.unlockCopy === "string" ? pack.unlockCopy.trim() : "";
  const words = sanitizeThemeWords(pack.words).slice(0, 4);
  const master = normalizeWord(pack.master);

  if (!theme || !clue || !unlockCopy || words.length < 4 || master.length < 4) {
    throw new Error("Incomplete Theme Vault pack");
  }
  if (words.includes(master)) {
    throw new Error("Master word must be distinct");
  }

  return {
    theme,
    clue,
    unlockCopy,
    words,
    master,
  };
}

function buildAdjacency(size) {
  const out = [];
  for (let index = 0; index < size * size; index += 1) {
    const row = Math.floor(index / size);
    const col = index % size;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        neighbors.push(nr * size + nc);
      }
    }
    out.push(neighbors);
  }
  return out;
}

function tryPlaceWord(grid, word, adjacency, rng) {
  const letters = word.split("");
  const starts = shuffle(
    Array.from({ length: grid.length }, (_, index) => index).filter((index) => {
      return grid[index] === null || grid[index] === letters[0];
    }),
    rng,
  );

  const walk = (index, depth, used, path) => {
    if (depth === letters.length) {
      return path.slice();
    }
    const nextLetter = letters[depth];
    const options = shuffle(
      adjacency[index].filter((candidate) => {
        if (used.has(candidate)) return false;
        return grid[candidate] === null || grid[candidate] === nextLetter;
      }),
      rng,
    );
    for (const candidate of options) {
      used.add(candidate);
      path.push(candidate);
      const found = walk(candidate, depth + 1, used, path);
      if (found) return found;
      path.pop();
      used.delete(candidate);
    }
    return null;
  };

  for (const start of starts) {
    const used = new Set([start]);
    const path = [start];
    if (letters.length === 1) return path;
    const found = walk(start, 1, used, path);
    if (found) return found;
  }
  return null;
}

function placeWords(size, words, rng) {
  const adjacency = buildAdjacency(size);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const grid = Array(size * size).fill(null);
    const placements = {};
    const ordered = shuffle(words.slice().sort((a, b) => b.length - a.length), rng);
    let failed = false;

    for (const word of ordered) {
      const path = tryPlaceWord(grid, word, adjacency, rng);
      if (!path) {
        failed = true;
        break;
      }
      placements[word] = path;
      path.forEach((index, charIndex) => {
        grid[index] = word[charIndex];
      });
    }

    if (failed) continue;

    const alphabet = "AEILNORSTU";
    for (let index = 0; index < grid.length; index += 1) {
      if (!grid[index]) {
        grid[index] = alphabet[Math.floor(rng() * alphabet.length)];
      }
    }
    return { grid, placements };
  }
  throw new Error("Unable to generate Theme Vault board");
}

export function dateKeyFromDate(date = new Date()) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const value = typeof date === "string" ? new Date(date) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function canAccessDifficulty(difficulty, premium) {
  const rules = DIFFICULTY_RULES[difficulty];
  return Boolean(rules) && (rules.free || Boolean(premium));
}

export function canPlayDate(dateKey, premium, completedDates = {}) {
  const today = dateKeyFromDate(new Date());
  if (premium) return true;
  if (dateKey !== today) return false;
  return !completedDates[dateKey];
}

export function updateStreak(lastCompletedDate, nextCompletedDate, currentStreak) {
  if (!lastCompletedDate) {
    return { current: 1 };
  }
  const last = new Date(`${lastCompletedDate}T00:00:00`);
  const next = new Date(`${nextCompletedDate}T00:00:00`);
  const diff = Math.round((next.getTime() - last.getTime()) / 86400000);
  if (diff === 1) return { current: currentStreak + 1 };
  if (diff <= 0) return { current: currentStreak };
  return { current: 1 };
}

export function generateDailyPuzzle({ dateKey, difficulty, premium = false }) {
  const pack = pickFallbackPack({ dateKey, difficulty, premium });
  return generatePuzzleFromPack({ dateKey, difficulty, premium, pack });
}

export function pickFallbackPack({ dateKey, difficulty, premium = false }) {
  if (!canAccessDifficulty(difficulty, premium)) {
    throw new Error("Hard mode is part of PuzzlePerch Pro.");
  }

  const seed = hashString(`${VERSION}:${dateKey}:${difficulty}`);
  const rng = mulberry32(seed);
  return normalizeThemeVaultPack(clone(choice(LIBRARY[difficulty], rng)));
}

export function generatePuzzleFromPack({ dateKey, difficulty, premium = false, pack }) {
  if (!canAccessDifficulty(difficulty, premium)) {
    throw new Error("Hard mode is part of PuzzlePerch Pro.");
  }

  const normalizedPack = normalizeThemeVaultPack(pack);
  const seed = hashString(
    `${VERSION}:${dateKey}:${difficulty}:${normalizedPack.theme}:${normalizedPack.master}:${normalizedPack.words.join("|")}`,
  );
  const rng = mulberry32(seed);
  const themeWords = normalizedPack.words;
  const masterWord = normalizedPack.master;
  const size = DIFFICULTY_RULES[difficulty].size;
  const placed = placeWords(size, [...themeWords, masterWord], rng);

  return {
    id: `${VERSION}:${dateKey}:${difficulty}:${slugify(normalizedPack.theme)}`,
    dateKey,
    difficulty,
    seed,
    theme: normalizedPack.theme,
    clue: normalizedPack.clue,
    unlockCopy: normalizedPack.unlockCopy,
    contentPack: normalizedPack,
    size,
    targetTimeSec: DIFFICULTY_RULES[difficulty].targetTimeSec,
    grid: placed.grid,
    themeWords: themeWords.map((word, index) => ({
      id: `theme:${index}:${word}`,
      word,
      path: placed.placements[word],
      points: DIFFICULTY_RULES[difficulty].points.word + word.length,
    })),
    masterWord: {
      word: masterWord,
      path: placed.placements[masterWord],
      points: DIFFICULTY_RULES[difficulty].points.master + masterWord.length,
    },
  };
}

export function buildPuzzleState(puzzle, premium = false, difficulty = "easy") {
  const hintLimit = premium
    ? DIFFICULTY_RULES[difficulty].hintLimit.premium
    : DIFFICULTY_RULES[difficulty].hintLimit.free;
  return {
    foundThemeWordIds: [],
    masterUnlocked: false,
    masterSolved: false,
    score: 0,
    speedBonus: 0,
    hintsUsed: 0,
    hintLimit,
    completed: false,
    solvedAtSec: null,
  };
}

export function evaluateSelection(puzzle, path, puzzleState) {
  const spelled = path.map((index) => puzzle.grid[index]).join("");
  const reversed = spelled.split("").reverse().join("");

  const themeWord = puzzle.themeWords.find((entry) => {
    return entry.word === spelled || entry.word === reversed;
  });
  if (themeWord && !puzzleState.foundThemeWordIds.includes(themeWord.id)) {
    return { status: "theme", entry: themeWord, word: themeWord.word };
  }

  if (puzzleState.masterUnlocked && !puzzleState.masterSolved) {
    if (puzzle.masterWord.word === spelled || puzzle.masterWord.word === reversed) {
      return { status: "master", entry: puzzle.masterWord, word: puzzle.masterWord.word };
    }
  }

  return { status: "miss", word: spelled };
}

export function validateMasterGuess(puzzle, puzzleState, guess) {
  if (!puzzleState.masterUnlocked || puzzleState.masterSolved) {
    return false;
  }
  return normalizeWord(guess) === puzzle.masterWord.word;
}

export function applySelection(puzzle, puzzleState, selection, elapsedSec) {
  const next = clone(puzzleState);
  if (selection.status === "theme") {
    next.foundThemeWordIds.push(selection.entry.id);
    next.score += selection.entry.points;
    if (next.foundThemeWordIds.length === puzzle.themeWords.length) {
      next.masterUnlocked = true;
    }
    return next;
  }

  if (selection.status === "master") {
    next.masterSolved = true;
    next.completed = true;
    next.solvedAtSec = elapsedSec;
    next.score += selection.entry.points;
    if (elapsedSec <= puzzle.targetTimeSec) {
      next.speedBonus = DIFFICULTY_RULES[puzzle.difficulty].points.speed;
      next.score += next.speedBonus;
    }
    return next;
  }

  return next;
}

export function revealHint(puzzle, puzzleState) {
  if (puzzleState.hintsUsed >= puzzleState.hintLimit) {
    return null;
  }

  const remaining = puzzle.themeWords.find((entry) => !puzzleState.foundThemeWordIds.includes(entry.id));
  if (remaining) {
    return {
      type: "theme",
      word: remaining.word,
      message: `${remaining.word[0]} starts the next vault clue.`,
      path: remaining.path,
    };
  }

  if (puzzleState.masterUnlocked && !puzzleState.masterSolved) {
    return {
      type: "master",
      word: puzzle.masterWord.word,
      message: `The master word begins with ${puzzle.masterWord.word[0]}.`,
      path: puzzle.masterWord.path,
    };
  }

  return null;
}

export function applyHint(puzzleState) {
  const next = clone(puzzleState);
  next.hintsUsed += 1;
  return next;
}

export function getMasterReveal(puzzle, puzzleState) {
  const revealedCount = Math.min(puzzleState.foundThemeWordIds.length, puzzle.masterWord.word.length);
  return puzzle.masterWord.word
    .split("")
    .map((letter, index) => (index < revealedCount || puzzleState.masterSolved ? letter : "•"))
    .join("");
}

export function summarizePuzzle(puzzle, puzzleState) {
  return {
    theme: puzzle.theme,
    solvedThemeWords: puzzleState.foundThemeWordIds.length,
    totalThemeWords: puzzle.themeWords.length,
    masterSolved: puzzleState.masterSolved,
    score: puzzleState.score,
    speedBonus: puzzleState.speedBonus,
    hintsUsed: puzzleState.hintsUsed,
    solvedAtSec: puzzleState.solvedAtSec,
  };
}
