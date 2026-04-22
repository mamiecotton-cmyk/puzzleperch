// PuzzlePerch shared stats - streak + per-game best score.
// Stored in localStorage under "pp_stats_v1".
// ES module. Import with: <script type="module"> import { recordSession } from '/pp-stats.js'; </script>

const KEY = "pp_stats_v1";

const GAME_IDS = [
  "wordPerch",
  "logicLagoon",
  "lateralLounge",
  "memoryMeadow",
  "wordTrail",
  "themeVault",
];

function defaultStore() {
  const games = {};
  GAME_IDS.forEach((id) => {
    games[id] = { bestScore: 0, lastPlayedDate: null };
  });
  return {
    sharedStreak: { current: 0, best: 0, lastPlayedDate: null },
    games,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    const base = defaultStore();
    if (parsed.sharedStreak) {
      base.sharedStreak = { ...base.sharedStreak, ...parsed.sharedStreak };
    }
    if (parsed.games) {
      GAME_IDS.forEach((id) => {
        if (parsed.games[id]) {
          base.games[id] = { ...base.games[id], ...parsed.games[id] };
        }
      });
    }
    return base;
  } catch {
    return defaultStore();
  }
}

function save(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Ignore quota errors.
  }
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(earlierDateKey, laterDateKey) {
  if (!earlierDateKey || !laterDateKey) return null;
  const earlier = new Date(`${earlierDateKey}T00:00:00`);
  const later = new Date(`${laterDateKey}T00:00:00`);
  return Math.round((later.getTime() - earlier.getTime()) / 86400000);
}

export function recordSession(gameId, score) {
  if (!GAME_IDS.includes(gameId)) {
    console.warn(`pp-stats: unknown gameId "${gameId}"`);
    return null;
  }

  const safeScore = Math.max(0, Math.floor(Number(score) || 0));
  const store = load();
  const today = todayKey();

  const game = store.games[gameId] || { bestScore: 0, lastPlayedDate: null };
  const previousBest = game.bestScore || 0;
  const newBest = safeScore > previousBest;
  game.bestScore = Math.max(previousBest, safeScore);
  game.lastPlayedDate = today;
  store.games[gameId] = game;

  const lastPlayed = store.sharedStreak.lastPlayedDate;
  let streakChange;
  if (!lastPlayed) {
    store.sharedStreak.current = 1;
    streakChange = "started";
  } else {
    const diff = daysBetween(lastPlayed, today);
    if (diff === 0) {
      streakChange = "maintained";
    } else if (diff === 1) {
      store.sharedStreak.current += 1;
      streakChange = "increased";
    } else {
      store.sharedStreak.current = 1;
      streakChange = "reset";
    }
  }

  store.sharedStreak.lastPlayedDate = today;
  if (store.sharedStreak.current > store.sharedStreak.best) {
    store.sharedStreak.best = store.sharedStreak.current;
  }

  save(store);

  return {
    newBest,
    previousBest,
    bestScore: game.bestScore,
    streakChange,
    current: store.sharedStreak.current,
    best: store.sharedStreak.best,
  };
}

export function getGameStats(gameId) {
  const store = load();
  const game = store.games[gameId] || { bestScore: 0, lastPlayedDate: null };
  return {
    bestScore: game.bestScore || 0,
    lastPlayedDate: game.lastPlayedDate,
    humanLastPlayed: humanizeDate(game.lastPlayedDate),
  };
}

export function getSharedStreak() {
  const store = load();
  return { ...store.sharedStreak };
}

export function humanizeDate(dateKey) {
  if (!dateKey) return "Never";
  const today = todayKey();
  if (dateKey === today) return "Today";
  const diff = daysBetween(dateKey, today);
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff >= 7 && diff < 30) {
    const weeks = Math.floor(diff / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diff >= 30 && diff < 365) {
    const months = Math.floor(diff / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  return dateKey;
}
