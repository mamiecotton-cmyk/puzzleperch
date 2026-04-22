import test from "node:test";
import assert from "node:assert/strict";

import {
  applyWordFound,
  buildRoundState,
  canAccessDifficulty,
  canPlayDate,
  dateKeyFromDate,
  evaluatePath,
  finalizeRound,
  generateDailySession,
  summarizeSession,
  updateStreak,
} from "../public/word-trail-core.js";

test("daily generation is deterministic for the same date and difficulty", () => {
  const a = generateDailySession({ dateKey: "2026-04-21", difficulty: "medium", premium: false });
  const b = generateDailySession({ dateKey: "2026-04-21", difficulty: "medium", premium: false });
  assert.deepEqual(a, b);
});

test("date keys preserve explicit yyyy-mm-dd strings for local daily play", () => {
  assert.equal(dateKeyFromDate("2026-04-21"), "2026-04-21");
});

test("hard mode is premium-gated", () => {
  assert.equal(canAccessDifficulty("hard", false), false);
  assert.equal(canAccessDifficulty("hard", true), true);
});

test("free players are limited to today's unplayed session", () => {
  const today = dateKeyFromDate(new Date());
  const yesterday = "2026-04-20";
  assert.equal(canPlayDate(yesterday, false, {}), false);
  assert.equal(canPlayDate(today, false, {}), true);
  assert.equal(canPlayDate(today, false, { [today]: true }), false);
  assert.equal(canPlayDate(yesterday, true, {}), true);
});

test("round flow awards words and adds the 20-point speed bonus on completion", () => {
  const session = generateDailySession({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const round = session.rounds.find((item) => item.hiddenBonuses.length === 0) ?? session.rounds[0];
  let roundState = buildRoundState(round, false, "easy");

  for (let index = 0; index < round.targets.length; index += 1) {
    const target = round.targets[index];
    const match = evaluatePath(round, target.path, roundState);
    assert.equal(match.status, "target");
    roundState = applyWordFound(round, roundState, match, 30);
  }

  assert.equal(roundState.completed, true);
  assert.equal(roundState.speedBonus, 20);
  assert.ok(roundState.score > 20);
});

test("bonus rounds stay open after required targets are solved until finalized", () => {
  const session = generateDailySession({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const round = session.rounds.find((item) => item.hiddenBonuses.length > 0);
  let roundState = buildRoundState(round, false, "easy");

  for (const target of round.targets) {
    const match = evaluatePath(round, target.path, roundState);
    roundState = applyWordFound(round, roundState, match, 25);
  }

  assert.equal(roundState.targetsComplete, true);
  assert.equal(roundState.completed, false);
  assert.equal(roundState.speedBonus, 20);

  roundState = finalizeRound(round, roundState, 30);
  assert.equal(roundState.completed, true);
  assert.equal(roundState.finishedInSec, 30);
});

test("chain rounds block out-of-order answers", () => {
  const session = generateDailySession({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const round = session.rounds.find((item) => item.mode === "chain");
  const roundState = buildRoundState(round, false, "easy");
  const secondTarget = round.targets[1];
  const blocked = evaluatePath(round, secondTarget.path, roundState);
  assert.equal(blocked.status, "blocked");
});

test("valid words can be traced in reverse order", () => {
  const session = generateDailySession({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const round = session.rounds[0];
  const roundState = buildRoundState(round, false, "easy");
  const target = round.targets[0];
  const reversed = target.path.slice().reverse();
  const match = evaluatePath(round, reversed, roundState);
  assert.equal(match.status, "target");
  assert.equal(match.word, target.word);
});

test("matching uses spelled letters, not only the stored canonical path", () => {
  const round = {
    mode: "theme",
    grid: [
      "B", "L", "O",
      "O", "M", "X",
      "X", "X", "X",
    ],
    targets: [
      { id: "bloom", word: "BLOOM", path: [0, 1, 2, 5, 8], points: 10, length: 5 },
    ],
    hiddenBonuses: [],
  };
  const roundState = {
    foundWordIds: [],
    bonusWordIds: [],
  };
  const alternatePath = [0, 1, 2, 3, 4];
  const match = evaluatePath(round, alternatePath, roundState);
  assert.equal(match.status, "target");
  assert.equal(match.word, "BLOOM");
});

test("session summary tracks round-by-round totals", () => {
  const session = generateDailySession({ dateKey: "2026-04-21", difficulty: "easy", premium: false });
  const roundStates = {};
  session.rounds.forEach((round) => {
    let state = buildRoundState(round, false, "easy");
    const match = evaluatePath(round, round.targets[0].path, state);
    state = applyWordFound(round, state, match, 40);
    roundStates[round.id] = state;
  });
  const summary = summarizeSession(session, roundStates);
  assert.equal(summary.rounds.length, 4);
  assert.ok(summary.totalScore > 0);
});

test("streaks increment on consecutive days and reset after gaps", () => {
  assert.deepEqual(updateStreak(null, "2026-04-21", 0), { current: 1, bestDelta: 1 });
  assert.deepEqual(updateStreak("2026-04-20", "2026-04-21", 4), { current: 5, bestDelta: 1 });
  assert.deepEqual(updateStreak("2026-04-18", "2026-04-21", 4), { current: 1, bestDelta: 1 });
});
