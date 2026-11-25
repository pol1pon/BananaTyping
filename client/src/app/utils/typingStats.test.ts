import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAdvancedStats,
  formatTotalDuration,
  getRankForWpm,
} from "./typingStats.ts";
import type { TypingResult } from "../stores/userStore.ts";

test("calculateAdvancedStats: корректно обрабатывает пустую историю", () => {
  const stats = calculateAdvancedStats([]);
  assert.equal(stats.totalRuns, 0);
  assert.equal(stats.bestWpm, 0);
  assert.equal(stats.avgWpm, 0);
  assert.equal(stats.streakDays, 0);
  assert.equal(stats.rank.title, "Банановый новичок");
  assert.equal(stats.weekdayActivity.length, 7);
  assert.equal(stats.achievements.every((a) => !a.unlocked), true);
});

test("calculateAdvancedStats: рассчитывает агрегаты, тренд, стабильность, раскладки и достижения", () => {
  const now = Date.now();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const today = new Date(now).toISOString();

  const runs: TypingResult[] = [
    {
      id: 1,
      wpm: 50,
      accuracy: 92,
      duration_sec: 30,
      createdAt: yesterday,
      language: "ru",
      mode: "text",
      characters: 125,
      errors: 10,
    },
    {
      id: 2,
      wpm: 80,
      accuracy: 98,
      duration_sec: 45,
      createdAt: today,
      language: "en",
      mode: "time",
      characters: 300,
      errors: 6,
    },
    {
      id: 3,
      wpm: 104,
      accuracy: 99,
      duration_sec: 60,
      createdAt: today,
      language: "ru",
      mode: "endless",
      characters: 520,
      errors: 5,
    },
  ];

  const stats = calculateAdvancedStats(runs);

  assert.equal(stats.totalRuns, 3);
  assert.equal(stats.bestWpm, 104);
  assert.equal(stats.bestResultId, 3);
  assert.equal(stats.avgWpm, Math.round((50 + 80 + 104) / 3));
  assert.equal(stats.latestWpm, 104);
  assert.equal(stats.bestAccuracy, 99);
  assert.equal(stats.avgAccuracy, Math.round((92 + 98 + 99) / 3));
  assert.equal(stats.totalDurationSec, 135);
  assert.equal(stats.totalCharacters, 125 + 300 + 520);
  assert.equal(stats.totalErrors, 21);
  assert.equal(stats.streakDays, 2);
  assert.ok(stats.wpmTrend > 0);
  assert.ok(stats.consistencyScore > 0 && stats.consistencyScore <= 100);
  assert.equal(stats.rank.title, "Мастер скорости");

  // Проверка разбивки по языкам и режимам
  assert.equal(stats.languageBreakdown.length, 2);
  assert.equal(stats.modeBreakdown.length, 3);

  // Достижения: должны быть открыты first-run, sniper (>=98%), sprinter-80, legend-100, polyglot
  const unlockedIds = stats.achievements.filter((a) => a.unlocked).map((a) => a.id);
  assert.ok(unlockedIds.includes("first-run"));
  assert.ok(unlockedIds.includes("sniper"));
  assert.ok(unlockedIds.includes("sprinter-80"));
  assert.ok(unlockedIds.includes("legend-100"));
  assert.ok(unlockedIds.includes("polyglot"));
  assert.ok(!unlockedIds.includes("marathon-10"));
});

test("getRankForWpm и formatTotalDuration: пограничные значения", () => {
  assert.equal(getRankForWpm(0).progressPercent, 0);
  assert.equal(getRankForWpm(125).nextTitle, null);
  assert.equal(getRankForWpm(125).progressPercent, 100);

  assert.equal(formatTotalDuration(0), "0 сек");
  assert.equal(formatTotalDuration(45), "45 сек");
  assert.equal(formatTotalDuration(125), "2 мин 5 сек");
  assert.equal(formatTotalDuration(3720), "1 ч 2 мин");
});
