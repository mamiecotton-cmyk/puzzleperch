const VERSION = "wt-v1";

export const ROUND_MODES = ["theme", "master", "chain", "ladder"];

export const DIFFICULTY_RULES = {
  easy: {
    label: "Easy",
    size: 5,
    wordMultiplier: 8,
    targetTimes: { theme: 55, master: 60, chain: 55, ladder: 50 },
    free: true,
    hintLimits: { free: 1, premium: 3 },
  },
  medium: {
    label: "Medium",
    size: 6,
    wordMultiplier: 10,
    targetTimes: { theme: 65, master: 70, chain: 65, ladder: 60 },
    free: true,
    hintLimits: { free: 1, premium: 4 },
  },
  hard: {
    label: "Hard",
    size: 7,
    wordMultiplier: 12,
    targetTimes: { theme: 85, master: 90, chain: 85, ladder: 80 },
    free: false,
    hintLimits: { free: 0, premium: 4 },
  },
};

const MODE_META = {
  theme: {
    title: "Theme Trail",
    subtitle: "Find the featured words from today's theme.",
    emoji: "🌿",
  },
  master: {
    title: "Hidden Master",
    subtitle: "Clear the listed words, then sniff out the secret bonus word.",
    emoji: "👑",
  },
  chain: {
    title: "Chain Run",
    subtitle: "Solve the trail in order. Each word starts with the last letter of the one before it.",
    emoji: "🔗",
  },
  ladder: {
    title: "Length Ladder",
    subtitle: "Climb from shortest word to longest without breaking the trail.",
    emoji: "📈",
  },
};

const ROUND_LIBRARY = {
  easy: {
    theme: [
      {
        theme: "Meadow Morning",
        required: ["BLOOM", "ROBIN", "HONEY", "MOSS"],
        hidden: ["FLOWER"],
      },
    ],
    master: [
      {
        theme: "Cozy Kitchen",
        required: ["APPLE", "BREAD", "HERBS"],
        hidden: ["DINNER"],
      },
    ],
    chain: [
      {
        theme: "Trail Chain",
        required: ["STONE", "EAGER", "ROBIN", "NURSE"],
        hidden: [],
      },
    ],
    ladder: [
      {
        theme: "Length Ladder",
        required: ["BEE", "MOSS", "CLOUD", "GARDEN"],
        hidden: [],
      },
    ],
  },
  medium: {
    theme: [
      {
        theme: "Harbor Watch",
        required: ["ANCHOR", "MARINA", "HARBOR", "COMPASS"],
        hidden: ["CAPTAIN"],
      },
    ],
    master: [
      {
        theme: "Studio Session",
        required: ["CANVAS", "LYRICS", "MELODY"],
        hidden: ["RHYTHM"],
      },
    ],
    chain: [
      {
        theme: "River Chain",
        required: ["SILVER", "RABBIT", "TUNNEL", "LANTERN"],
        hidden: [],
      },
    ],
    ladder: [
      {
        theme: "Climb Higher",
        required: ["PATH", "TRAIL", "BRIDGE", "CAPTAIN"],
        hidden: [],
      },
    ],
  },
  hard: {
    theme: [
      {
        theme: "Astral Drift",
        required: ["COMET", "NEBULA", "QUASAR", "ORBITAL"],
        hidden: ["GALAXY"],
      },
    ],
    master: [
      {
        theme: "Winter Front",
        required: ["GLACIER", "ICEFIELD", "FROST"],
        hidden: ["BLIZZARD"],
      },
    ],
    chain: [
      {
        theme: "Night Chain",
        required: ["FRACTAL", "LANTERN", "NIGHTLY", "YONDER"],
        hidden: [],
      },
    ],
    ladder: [
      {
        theme: "Summit Push",
        required: ["SPARK", "SIGNAL", "VOYAGER", "MOUNTAIN"],
        hidden: [],
      },
    ],
  },
};

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), 1 | t);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function idForRound(dateKey, difficulty, mode, pack) {
  return `${VERSION}:${dateKey}:${difficulty}:${mode}:${pack.theme.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function neighbors(index, size) {
  const row = Math.floor(index / size);
  const col = index % size;
  const out = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      out.push(nr * size + nc);
    }
  }
  return out;
}

function buildAdjacency(size) {
  const out = [];
  for (let i = 0; i < size * size; i += 1) {
    out.push(neighbors(i, size));
  }
  return out;
}

function tryPlaceWord(grid, size, word, rng, adjacency) {
  const letters = word.split("");
  const starts = shuffle(
    Array.from({ length: grid.length }, (_, index) => index).filter((index) => {
      return grid[index] === null || grid[index] === letters[0];
    }),
    rng,
  );

  const walk = (position, depth, used, path) => {
    if (depth === letters.length) {
      return path.slice();
    }
    const nextLetter = letters[depth];
    const options = shuffle(
      adjacency[position].filter((index) => {
        if (used.has(index)) return false;
        return grid[index] === null || grid[index] === nextLetter;
      }),
      rng,
    );
    for (const option of options) {
      used.add(option);
      path.push(option);
      const found = walk(option, depth + 1, used, path);
      if (found) return found;
      path.pop();
      used.delete(option);
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
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const grid = Array(size * size).fill(null);
    const placements = {};
    const ordered = shuffle(words.slice().sort((a, b) => b.length - a.length), rng);
    let failed = false;

    for (const word of ordered) {
      const path = tryPlaceWord(grid, size, word, rng, adjacency);
      if (!path) {
        failed = true;
        break;
      }
      placements[word] = path;
      for (let i = 0; i < path.length; i += 1) {
        grid[path[i]] = word[i];
      }
    }

    if (failed) continue;

    const alphabet = "AEILNORSTU";
    for (let i = 0; i < grid.length; i += 1) {
      if (!grid[i]) {
        grid[i] = alphabet[Math.floor(rng() * alphabet.length)];
      }
    }
    return { grid, placements };
  }
  throw new Error("Unable to generate a word trail board");
}

function normalizeWord(word) {
  return String(word).trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function scoreForWord(word, difficulty, solvedCountInRound, mode) {
  const multiplier = DIFFICULTY_RULES[difficulty].wordMultiplier;
  const modeBonus = mode === "chain" ? 4 : mode === "master" ? 3 : mode === "ladder" ? 2 : 0;
  return word.length * multiplier + solvedCountInRound * 3 + modeBonus;
}

export function dateKeyFromDate(date = new Date()) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const value = typeof date === "string" ? new Date(date) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function seedFromDate(dateKey, difficulty) {
  return hashString(`${VERSION}:${dateKey}:${difficulty}`);
}

export function getModeMeta(mode) {
  return clone(MODE_META[mode]);
}

export function canAccessDifficulty(difficulty, premium) {
  const rule = DIFFICULTY_RULES[difficulty];
  if (!rule) return false;
  return rule.free || Boolean(premium);
}

export function canPlayDate(dateKey, premium, completedDates = {}) {
  const today = dateKeyFromDate(new Date());
  if (premium) return true;
  if (dateKey !== today) return false;
  return !completedDates[dateKey];
}

export function updateStreak(lastCompletedDate, nextCompletedDate, currentStreak) {
  if (!lastCompletedDate) {
    return { current: 1, bestDelta: 1 };
  }
  const last = new Date(`${lastCompletedDate}T00:00:00Z`);
  const next = new Date(`${nextCompletedDate}T00:00:00Z`);
  const diffDays = Math.round((next.getTime() - last.getTime()) / 86400000);
  if (diffDays <= 0) {
    return { current: currentStreak, bestDelta: 0 };
  }
  if (diffDays === 1) {
    return { current: currentStreak + 1, bestDelta: 1 };
  }
  return { current: 1, bestDelta: 1 };
}

export function generateDailySession({ dateKey, difficulty, premium = false }) {
  if (!canAccessDifficulty(difficulty, premium)) {
    throw new Error("Hard mode is part of PuzzlePerch Pro.");
  }

  const seed = seedFromDate(dateKey, difficulty);
  const rng = mulberry32(seed);
  const session = {
    id: `${VERSION}:${dateKey}:${difficulty}`,
    dateKey,
    difficulty,
    seed,
    rounds: [],
  };

  for (const mode of ROUND_MODES) {
    const pack = choice(ROUND_LIBRARY[difficulty][mode], rng);
    const words = [...pack.required, ...pack.hidden].map(normalizeWord);
    const size = DIFFICULTY_RULES[difficulty].size;
    const board = placeWords(size, words, rng);
    const round = {
      id: idForRound(dateKey, difficulty, mode, pack),
      mode,
      title: MODE_META[mode].title,
      subtitle: MODE_META[mode].subtitle,
      emoji: MODE_META[mode].emoji,
      theme: pack.theme,
      size,
      targetTimeSec: DIFFICULTY_RULES[difficulty].targetTimes[mode],
      grid: board.grid,
      targets: pack.required.map((word, index) => {
        const normalized = normalizeWord(word);
        return {
          id: `${mode}:target:${index}:${normalized}`,
          word: normalized,
          length: normalized.length,
          path: board.placements[normalized],
          points: scoreForWord(normalized, difficulty, index, mode),
        };
      }),
      hiddenBonuses: pack.hidden.map((word, index) => {
        const normalized = normalizeWord(word);
        return {
          id: `${mode}:bonus:${index}:${normalized}`,
          word: normalized,
          length: normalized.length,
          path: board.placements[normalized],
          points: scoreForWord(normalized, difficulty, pack.required.length + index, mode) + 12,
        };
      }),
      targetDescriptor:
        mode === "chain"
          ? pack.required.map((word, index) => `${index + 1}. ${normalizeWord(word).length} letters`)
          : mode === "ladder"
            ? pack.required.map((word) => `${normalizeWord(word).length} letters`)
            : pack.required.map((word) => `${pack.theme} • ${normalizeWord(word).length} letters`),
    };
    session.rounds.push(round);
  }

  return session;
}

export function buildRoundState(round, premium = false, difficulty = "easy") {
  return {
    roundId: round.id,
    foundWordIds: [],
    bonusWordIds: [],
    score: 0,
    completed: false,
    speedBonus: 0,
    finishedInSec: null,
    hintsUsed: 0,
    hintLimit: premium
      ? DIFFICULTY_RULES[difficulty].hintLimits.premium
      : DIFFICULTY_RULES[difficulty].hintLimits.free,
  };
}

export function evaluatePath(round, path, roundState) {
  const spelled = path.map((index) => round.grid[index]).join("");
  const reversedSpelled = spelled.split("").reverse().join("");
  const target = round.targets.find((item) => {
    return item.word === spelled || item.word === reversedSpelled;
  });
  if (target && !roundState.foundWordIds.includes(target.id)) {
    const orderIndex = roundState.foundWordIds.length;
    if (round.mode === "chain" && round.targets[orderIndex]?.id !== target.id) {
      return { status: "blocked", reason: "Find the chain in order." };
    }
    if (round.mode === "ladder" && round.targets[orderIndex]?.length !== target.length) {
      return { status: "blocked", reason: "Climb the ladder from shortest to longest." };
    }
    return { status: "target", word: target.word, target };
  }

  const bonus = round.hiddenBonuses.find((item) => {
    return item.word === spelled || item.word === reversedSpelled;
  });
  if (bonus && !roundState.bonusWordIds.includes(bonus.id)) {
    return { status: "bonus", word: bonus.word, bonus };
  }

  return { status: "miss" };
}

export function applyWordFound(round, roundState, match, elapsedSec) {
  const next = clone(roundState);
  if (match.status === "target") {
    next.foundWordIds.push(match.target.id);
    next.score += match.target.points;
  }
  if (match.status === "bonus") {
    next.bonusWordIds.push(match.bonus.id);
    next.score += match.bonus.points;
  }

  const allTargetsFound = next.foundWordIds.length === round.targets.length;
  if (allTargetsFound && !next.completed) {
    next.completed = true;
    next.finishedInSec = elapsedSec;
    if (elapsedSec <= round.targetTimeSec) {
      next.speedBonus = 20;
      next.score += 20;
    }
  }
  return next;
}

export function revealHint(round, roundState) {
  if (roundState.hintsUsed >= roundState.hintLimit) {
    return null;
  }
  const solved = new Set(roundState.foundWordIds);
  const remaining = round.targets.filter((item) => !solved.has(item.id));
  if (!remaining.length) {
    return null;
  }
  const nextTarget = remaining[0];
  return {
    wordId: nextTarget.id,
    letter: nextTarget.word[0],
    path: nextTarget.path,
    message: `Start with ${nextTarget.word[0]}.`,
  };
}

export function applyHint(roundState) {
  const next = clone(roundState);
  next.hintsUsed += 1;
  return next;
}

export function summarizeSession(session, roundStates) {
  const rounds = session.rounds.map((round) => {
    const state = roundStates[round.id];
    return {
      roundId: round.id,
      title: round.title,
      theme: round.theme,
      completed: state.completed,
      score: state.score,
      speedBonus: state.speedBonus,
      hintsUsed: state.hintsUsed,
      found: state.foundWordIds.length,
      bonusFound: state.bonusWordIds.length,
      total: round.targets.length,
      finishedInSec: state.finishedInSec,
    };
  });
  const totalScore = rounds.reduce((sum, round) => sum + round.score, 0);
  return {
    totalScore,
    perfectRounds: rounds.filter((round) => round.found === round.total).length,
    speedRounds: rounds.filter((round) => round.speedBonus > 0).length,
    bonusRounds: rounds.filter((round) => round.bonusFound > 0).length,
    rounds,
  };
}
