import type { TypingResult } from "../stores/userStore";

export interface RankInfo {
  title: string;
  emoji: string;
  nextTitle: string | null;
  minWpm: number;
  nextWpm: number | null;
  progressPercent: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progressText: string;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
}

export interface WeekdayStat {
  day: string;
  runs: number;
  avgWpm: number;
}

export interface SpeedBucket {
  range: string;
  count: number;
}

export interface AdvancedTypingStats {
  totalRuns: number;
  bestWpm: number;
  bestResultId: number | null;
  avgWpm: number;
  latestWpm: number;
  avgAccuracy: number;
  bestAccuracy: number;
  totalDurationSec: number;
  totalCharacters: number;
  totalErrors: number;
  wpmTrend: number; // Разница между недавней серией и предыдущей
  consistencyScore: number; // 0..100%
  streakDays: number;
  rank: RankInfo;
  languageBreakdown: BreakdownItem[];
  modeBreakdown: BreakdownItem[];
  weekdayActivity: WeekdayStat[];
  speedBuckets: SpeedBucket[];
  achievements: AchievementItem[];
}

const RANKS = [
  { min: 0, title: "Банановый новичок", emoji: "🍌" },
  { min: 30, title: "Уверенный старт", emoji: "⌨️" },
  { min: 50, title: "Быстрые пальцы", emoji: "⚡" },
  { min: 70, title: "Банановый ниндзя", emoji: "🥷" },
  { min: 90, title: "Мастер скорости", emoji: "🚀" },
  { min: 110, title: "Легенда клавиатуры", emoji: "👑" },
];

export function getRankForWpm(bestWpm: number): RankInfo {
  let currentIndex = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (bestWpm >= RANKS[i].min) {
      currentIndex = i;
    }
  }

  const current = RANKS[currentIndex];
  const next = RANKS[currentIndex + 1] || null;

  if (!next) {
    return {
      title: current.title,
      emoji: current.emoji,
      nextTitle: null,
      minWpm: current.min,
      nextWpm: null,
      progressPercent: 100,
    };
  }

  const span = next.min - current.min;
  const gained = Math.max(0, bestWpm - current.min);
  const progressPercent = Math.min(100, Math.round((gained / span) * 100));

  return {
    title: current.title,
    emoji: current.emoji,
    nextTitle: next.title,
    minWpm: current.min,
    nextWpm: next.min,
    progressPercent,
  };
}

export function formatTotalDuration(totalSec: number): string {
  if (totalSec <= 0) return "0 сек";
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }
  if (mins > 0) {
    return `${mins} мин ${secs} сек`;
  }
  return `${secs} сек`;
}

function getLocalDateKey(dateInput: string): string | null {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calculateStreakDays(results: TypingResult[]): number {
  const uniqueDays = new Set<string>();
  results.forEach((r) => {
    if (r.createdAt) {
      const key = getLocalDateKey(r.createdAt);
      if (key) uniqueDays.add(key);
    }
  });

  if (uniqueDays.size === 0) return 0;

  const today = new Date();
  const todayKey = getLocalDateKey(today.toISOString())!;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday.toISOString())!;

  // Серия активна, если были заезды сегодня или вчера
  let cursor: Date | null = null;
  if (uniqueDays.has(todayKey)) {
    cursor = new Date(today);
  } else if (uniqueDays.has(yesterdayKey)) {
    cursor = new Date(yesterday);
  }

  if (!cursor) return 0;

  let streak = 0;
  while (cursor) {
    const key = getLocalDateKey(cursor.toISOString());
    if (key && uniqueDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calculateAdvancedStats(rawResults: TypingResult[]): AdvancedTypingStats {
  const results = [...(rawResults || [])].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta !== tb ? ta - tb : Number(a.id) - Number(b.id);
  });

  const totalRuns = results.length;
  if (totalRuns === 0) {
    return {
      totalRuns: 0,
      bestWpm: 0,
      bestResultId: null,
      avgWpm: 0,
      latestWpm: 0,
      avgAccuracy: 0,
      bestAccuracy: 0,
      totalDurationSec: 0,
      totalCharacters: 0,
      totalErrors: 0,
      wpmTrend: 0,
      consistencyScore: 0,
      streakDays: 0,
      rank: getRankForWpm(0),
      languageBreakdown: [],
      modeBreakdown: [],
      weekdayActivity: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => ({
        day,
        runs: 0,
        avgWpm: 0,
      })),
      speedBuckets: [
        { range: "<40", count: 0 },
        { range: "40–59", count: 0 },
        { range: "60–79", count: 0 },
        { range: "80–99", count: 0 },
        { range: "100+", count: 0 },
      ],
      achievements: buildAchievements(0, 0, 0, 0, 0, false),
    };
  }

  let bestWpm = 0;
  let bestResultId: number | null = null;
  let sumWpm = 0;
  let sumAcc = 0;
  let bestAccuracy = 0;
  let totalDurationSec = 0;
  let totalCharacters = 0;
  let totalErrors = 0;

  for (const r of results) {
    const wpm = r.wpm || 0;
    const acc = r.accuracy || 0;
    const dur = Math.max(0, r.duration_sec || 0);

    if (wpm >= bestWpm) {
      bestWpm = wpm;
      bestResultId = r.id;
    }
    if (acc > bestAccuracy) bestAccuracy = acc;

    sumWpm += wpm;
    sumAcc += acc;
    totalDurationSec += dur;

    const estChars =
      typeof r.characters === "number" && r.characters > 0
        ? r.characters
        : Math.round((wpm * 5 * Math.max(1, dur)) / 60);
    totalCharacters += estChars;

    if (typeof r.errors === "number") {
      totalErrors += r.errors;
    }
  }

  const avgWpm = Math.round(sumWpm / totalRuns);
  const latestWpm = results[totalRuns - 1]?.wpm || 0;
  const avgAccuracy = Math.round(sumAcc / totalRuns);

  // Тренд скорости: сравниваем последние до 5 заездов с предыдущими до 5 заездов
  let wpmTrend = 0;
  if (totalRuns >= 2) {
    const windowSize = Math.min(5, Math.floor(totalRuns / 2));
    const recentSlice = results.slice(-windowSize);
    const prevSlice = results.slice(-windowSize * 2, -windowSize);
    if (prevSlice.length > 0) {
      const recentAvg = recentSlice.reduce((s, x) => s + x.wpm, 0) / recentSlice.length;
      const prevAvg = prevSlice.reduce((s, x) => s + x.wpm, 0) / prevSlice.length;
      wpmTrend = Math.round(recentAvg - prevAvg);
    }
  }

  // Стабильность (Consistency): на основе коэффициента вариации WPM
  let consistencyScore = 100;
  if (totalRuns >= 2 && avgWpm > 0) {
    const variance =
      results.reduce((acc, r) => acc + Math.pow(r.wpm - avgWpm, 2), 0) / totalRuns;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgWpm;
    consistencyScore = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  }

  const streakDays = calculateStreakDays(results);

  // Разбивка по языкам
  const langMap = new Map<string, TypingResult[]>();
  results.forEach((r) => {
    const k = r.language || "other";
    langMap.set(k, [...(langMap.get(k) || []), r]);
  });

  const LANG_LABELS: Record<string, string> = {
    ru: "Русская (РУС)",
    en: "Английская (ENG)",
    other: "Не указана",
  };

  const languageBreakdown: BreakdownItem[] = Array.from(langMap.entries())
    .filter(([k, list]) => k !== "other" || list.length > 0)
    .map(([key, list]) => ({
      key,
      label: LANG_LABELS[key] || key,
      count: list.length,
      avgWpm: Math.round(list.reduce((s, x) => s + x.wpm, 0) / list.length),
      bestWpm: Math.max(...list.map((x) => x.wpm)),
      avgAccuracy: Math.round(list.reduce((s, x) => s + x.accuracy, 0) / list.length),
    }))
    .sort((a, b) => b.count - a.count);

  // Разбивка по режимам
  const modeMap = new Map<string, TypingResult[]>();
  results.forEach((r) => {
    const k = r.mode || "text";
    modeMap.set(k, [...(modeMap.get(k) || []), r]);
  });

  const MODE_LABELS: Record<string, string> = {
    text: "Обычный текст",
    time: "На время",
    endless: "Бесконечный",
    quick: "Быстрый старт",
  };

  const modeBreakdown: BreakdownItem[] = Array.from(modeMap.entries())
    .map(([key, list]) => ({
      key,
      label: MODE_LABELS[key] || key,
      count: list.length,
      avgWpm: Math.round(list.reduce((s, x) => s + x.wpm, 0) / list.length),
      bestWpm: Math.max(...list.map((x) => x.wpm)),
      avgAccuracy: Math.round(list.reduce((s, x) => s + x.accuracy, 0) / list.length),
    }))
    .sort((a, b) => b.count - a.count);

  // Активность по дням недели (Пн = 0 .. Вс = 6)
  const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const weekdayBuckets: TypingResult[][] = Array.from({ length: 7 }, () => []);
  results.forEach((r) => {
    if (!r.createdAt) return;
    const d = new Date(r.createdAt);
    if (isNaN(d.getTime())) return;
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    weekdayBuckets[idx].push(r);
  });

  const weekdayActivity: WeekdayStat[] = weekdayNames.map((day, idx) => {
    const bucket = weekdayBuckets[idx];
    return {
      day,
      runs: bucket.length,
      avgWpm:
        bucket.length > 0
          ? Math.round(bucket.reduce((s, x) => s + x.wpm, 0) / bucket.length)
          : 0,
    };
  });

  // Распределение скоростей
  const speedBuckets: SpeedBucket[] = [
    { range: "<40", count: results.filter((r) => r.wpm < 40).length },
    { range: "40–59", count: results.filter((r) => r.wpm >= 40 && r.wpm < 60).length },
    { range: "60–79", count: results.filter((r) => r.wpm >= 60 && r.wpm < 80).length },
    { range: "80–99", count: results.filter((r) => r.wpm >= 80 && r.wpm < 100).length },
    { range: "100+", count: results.filter((r) => r.wpm >= 100).length },
  ];

  const hasBothLangs =
    results.some((r) => r.language === "ru") && results.some((r) => r.language === "en");

  const achievements = buildAchievements(
    totalRuns,
    bestWpm,
    bestAccuracy,
    totalDurationSec,
    streakDays,
    hasBothLangs
  );

  return {
    totalRuns,
    bestWpm,
    bestResultId,
    avgWpm,
    latestWpm,
    avgAccuracy,
    bestAccuracy,
    totalDurationSec,
    totalCharacters,
    totalErrors,
    wpmTrend,
    consistencyScore,
    streakDays,
    rank: getRankForWpm(bestWpm),
    languageBreakdown,
    modeBreakdown,
    weekdayActivity,
    speedBuckets,
    achievements,
  };
}

function buildAchievements(
  totalRuns: number,
  bestWpm: number,
  bestAccuracy: number,
  totalDurationSec: number,
  streakDays: number,
  hasBothLangs: boolean
): AchievementItem[] {
  return [
    {
      id: "first-run",
      title: "Первый банан",
      description: "Завершите хотя бы 1 тренировку",
      emoji: "🍌",
      unlocked: totalRuns >= 1,
      progressText: `${Math.min(1, totalRuns)}/1`,
    },
    {
      id: "sniper",
      title: "Снайпер",
      description: "Достигните точности 98%+ за заезд",
      emoji: "🎯",
      unlocked: bestAccuracy >= 98,
      progressText: `${bestAccuracy}% / 98%`,
    },
    {
      id: "sprinter-80",
      title: "Турбо-пальцы",
      description: "Наберите скорость 80+ WPM",
      emoji: "⚡",
      unlocked: bestWpm >= 80,
      progressText: `${bestWpm} / 80 WPM`,
    },
    {
      id: "legend-100",
      title: "Мастер 100+",
      description: "Преодолейте планку 100 WPM",
      emoji: "👑",
      unlocked: bestWpm >= 100,
      progressText: `${bestWpm} / 100 WPM`,
    },
    {
      id: "marathon-10",
      title: "Марафонец",
      description: "Пройдите 10 тренировок",
      emoji: "🔥",
      unlocked: totalRuns >= 10,
      progressText: `${Math.min(10, totalRuns)}/10`,
    },
    {
      id: "polyglot",
      title: "Полиглот",
      description: "Потренируйтесь на РУС и ENG раскладках",
      emoji: "🌍",
      unlocked: hasBothLangs,
      progressText: hasBothLangs ? "Готово" : streakDays > 1 ? `${streakDays} дн. серия` : "РУС + ENG",
    },
  ];
}
