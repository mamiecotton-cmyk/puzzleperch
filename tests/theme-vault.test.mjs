import test from "node:test";
import assert from "node:assert/strict";

import {
  applySelection,
  buildPuzzleState,
  canAccessDifficulty,
  canPlayDate,
  dateKeyFromDate,
  evaluateSelection,
  generateDailyPuzzle,
  generatePuzzleFromPack,
  getMasterReveal,
  normalizeThemeVaultPack,
  updateStreak,
  validateMasterGuess,
} from "../public/theme-vault-core.js";

test("theme vault generation is deterministic by date and difficulty", () => {
  const first = generateDailyPuzzle({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const second = generateDailyPuzzle({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  assert.deepEqual(first, second);
});

test("theme vault can deterministically build from a supplied content pack", () => {
  const pack = normalizeThemeVaultPack({
    theme: "Garden Shelf",
    clue: "Everything belongs on a peaceful gardener's shelf.",
    words: ["TROWEL", "SEED", "MOSS", "TWINE"],
    master: "GREENERY",
    unlockCopy: "Each solve reveals another letter in the vault word.",
  });
  const first = generatePuzzleFromPack({
    dateKey: "2026-04-21",
    difficulty: "medium",
    premium: false,
    pack,
  });
  const second = generatePuzzleFromPack({
    dateKey: "2026-04-21",
    difficulty: "medium",
    premium: false,
    pack,
  });
  assert.deepEqual(first, second);
});

test("theme word validation accepts spelled board paths", () => {
  const puzzle = generateDailyPuzzle({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const puzzleState = buildPuzzleState(puzzle, false, "easy");
  const word = puzzle.themeWords[0];
  const match = evaluateSelection(puzzle, word.path, puzzleState);
  assert.equal(match.status, "theme");
  assert.equal(match.word, word.word);
});

test("master word unlocks after all theme words are found", () => {
  const puzzle = generateDailyPuzzle({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  let puzzleState = buildPuzzleState(puzzle, false, "easy");
  for (const word of puzzle.themeWords) {
    const match = evaluateSelection(puzzle, word.path, puzzleState);
    puzzleState = applySelection(puzzle, puzzleState, match, 120);
  }
  assert.equal(puzzleState.masterUnlocked, true);
  assert.equal(getMasterReveal(puzzle, puzzleState).includes("•"), true);
});

test("master guess validation works only after unlock", () => {
  const puzzle = generateDailyPuzzle({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  let puzzleState = buildPuzzleState(puzzle, false, "easy");
  assert.equal(validateMasterGuess(puzzle, puzzleState, puzzle.masterWord.word), false);
  puzzle.themeWords.forEach((word) => {
    const match = evaluateSelection(puzzle, word.path, puzzleState);
    puzzleState = applySelection(puzzle, puzzleState, match, 100);
  });
  assert.equal(validateMasterGuess(puzzle, puzzleState, puzzle.masterWord.word), true);
});

test("hard mode is premium-gated", () => {
  assert.equal(canAccessDifficulty("hard", false), false);
  assert.equal(canAccessDifficulty("hard", true), true);
});

test("free players are limited to today's unplayed puzzle", () => {
  const today = dateKeyFromDate(new Date());
  assert.equal(canPlayDate(today, false, {}), true);
  assert.equal(canPlayDate(today, false, { [today]: true }), false);
  assert.equal(canPlayDate("2026-04-19", false, {}), false);
  assert.equal(canPlayDate("2026-04-19", true, {}), true);
});

test("streak logic increments across consecutive days and resets after gaps", () => {
  assert.deepEqual(updateStreak(null, "2026-04-21", 0), { current: 1 });
  assert.deepEqual(updateStreak("2026-04-20", "2026-04-21", 3), { current: 4 });
  assert.deepEqual(updateStreak("2026-04-18", "2026-04-21", 3), { current: 1 });
});
