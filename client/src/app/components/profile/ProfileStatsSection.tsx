import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Zap,
  Target,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Flame,
  Activity,
  BarChart3,
  Keyboard,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Link } from "react-router";
import type { TypingResult } from "../../stores/userStore";
import {
  calculateAdvancedStats,
  formatTotalDuration,
} from "../../utils/typingStats";

interface ProfileStatsSectionProps {
  results: TypingResult[];
}

type ChartRange = "10" | "30" | "all";
type ChartMetric = "wpm" | "accuracy" | "both";
type DistributionTab = "weekday" | "speed";

const MODE_NAMES: Record<string, string> = {
  text: "Текст",
  time: "На время",
  endless: "Бесконечный",
  quick: "Быстрый старт",
};

export function ProfileStatsSection({ results }: ProfileStatsSectionProps) {
  const [chartRange, setChartRange] = useState<ChartRange>("30");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("both");
  const [distTab, setDistTab] = useState<DistributionTab>("weekday");

  const stats = useMemo(() => calculateAdvancedStats(results), [results]);

  const sortedChronological = useMemo(() => {
    return [...(results || [])].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta !== tb ? ta - tb : Number(a.id) - Number(b.id);
    });
  }, [results]);

  const chartData = useMemo(() => {
    const sliced =
      chartRange === "10"
        ? sortedChronological.slice(-10)
        : chartRange === "30"
        ? sortedChronological.slice(-30)
        : sortedChronological;

    return sliced.map((item, idx) => ({
      label: `#${idx + 1}`,
      wpm: item.wpm,
      accuracy: item.accuracy,
      duration: item.duration_sec,
      mode: item.mode ? MODE_NAMES[item.mode] || item.mode : "Тренировка",
      language: item.language === "en" ? "ENG" : item.language === "ru" ? "РУС" : "",
      fullDate: item.createdAt
        ? new Date(item.createdAt).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Недавно",
    }));
  }, [sortedChronological, chartRange]);

  if (!results || results.length === 0) {
    return (
      <div className="bg-[#18181B] border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={30} />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
          Статистика ждёт первого заезда
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          Завершите хотя бы одну тренировку, чтобы открыть графики прогресса, анализ стабильности, статистику по дням недели и достижения.
        </p>
        <Link
          to="/training"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-sm transition-transform active:scale-95 shadow-lg"
        >
          <Keyboard size={18} />
          <span>Начать тренировку</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 4 карточки ключевых показателей */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Рекорд скорости */}
        <div className="bg-[#18181B] rounded-3xl p-5 border border-white/10 relative overflow-hidden group hover:border-[#FFD700]/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Рекорд скорости
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{stats.bestWpm}</span>
            <span className="text-xs font-bold text-[#FFD700]">WPM</span>
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>
              {stats.rank.emoji} {stats.rank.title}
            </span>
            {stats.rank.nextWpm && (
              <span className="text-[11px] text-gray-500">
                Цель: {stats.rank.nextWpm}
              </span>
            )}
          </div>
        </div>

        {/* Средняя скорость + тренд */}
        <div className="bg-[#18181B] rounded-3xl p-5 border border-white/10 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Средняя скорость
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{stats.avgWpm}</span>
            <span className="text-xs font-bold text-gray-400">WPM</span>
            {stats.wpmTrend !== 0 && (
              <span
                className={`ml-auto inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  stats.wpmTrend > 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {stats.wpmTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stats.wpmTrend > 0 ? `+${stats.wpmTrend}` : stats.wpmTrend}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>Последний заезд:</span>
            <span className="font-bold text-gray-200">{stats.latestWpm} WPM</span>
          </div>
        </div>

        {/* Точность и стабильность */}
        <div className="bg-[#18181B] rounded-3xl p-5 border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Точность и ритм
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">{stats.avgAccuracy}%</span>
            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              Макс: {stats.bestAccuracy}%
            </span>
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Activity size={12} className="text-blue-400" />
              Стабильность:
            </span>
            <span className="font-bold text-gray-200">{stats.consistencyScore}%</span>
          </div>
        </div>

        {/* Время, объём и серия */}
        <div className="bg-[#18181B] rounded-3xl p-5 border border-white/10 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Объём практики
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-white truncate">
              {formatTotalDuration(stats.totalDurationSec)}
            </span>
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-between gap-2">
            <span>~{stats.totalCharacters.toLocaleString("ru-RU")} симв.</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
              <Flame size={12} />
              {stats.streakDays} дн. серия
            </span>
          </div>
        </div>
      </div>

      {/* 2. Главный график динамики прогресса */}
      <div className="bg-[#18181B] rounded-3xl p-5 sm:p-7 border border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-[#FFD700]" />
              <span>Динамика скорости и точности</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Показатели по завершённым тренировкам (всего заездов: {stats.totalRuns})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Переключатель метрики */}
            <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMetric("wpm")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  chartMetric === "wpm"
                    ? "bg-[#FFD700] text-[#111111]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Скорость
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("accuracy")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  chartMetric === "accuracy"
                    ? "bg-emerald-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Точность
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("both")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  chartMetric === "both"
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Совмещённый
              </button>
            </div>

            {/* Переключатель диапазона */}
            <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 text-xs font-bold">
              {(["10", "30", "all"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setChartRange(range)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    chartRange === range
                      ? "bg-[#FFD700]/20 text-[#FFD700]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {range === "all" ? "Все" : `${range}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[260px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === "both" ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileWpmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#FFD700" }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[Math.max(0, Math.min(...chartData.map((d) => d.accuracy)) - 10), 100]}
                  tick={{ fontSize: 11, fill: "#10B981" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="wpm"
                  name="Скорость"
                  stroke="#FFD700"
                  strokeWidth={2.5}
                  fill="url(#profileWpmGrad)"
                  dot={{ r: 3, fill: "#FFD700", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracy"
                  name="Точность"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#10B981", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileSingleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartMetric === "wpm" ? "#FFD700" : "#10B981"}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartMetric === "wpm" ? "#FFD700" : "#10B981"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={
                    chartMetric === "accuracy"
                      ? [Math.max(0, Math.min(...chartData.map((d) => d.accuracy)) - 10), 100]
                      : [0, "auto"]
                  }
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke={chartMetric === "wpm" ? "#FFD700" : "#10B981"}
                  strokeWidth={2.5}
                  fill="url(#profileSingleGrad)"
                  dot={{
                    r: 3,
                    fill: chartMetric === "wpm" ? "#FFD700" : "#10B981",
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Два аналитических блока: Распределение + Режимы/Языки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левый: Активность по дням недели / Распределение WPM */}
        <div className="bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-[#FFD700]" />
              <span>
                {distTab === "weekday" ? "Активность по дням недели" : "Диапазоны скорости"}
              </span>
            </h3>

            <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setDistTab("weekday")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  distTab === "weekday"
                    ? "bg-[#FFD700] text-[#111111]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Дни недели
              </button>
              <button
                type="button"
                onClick={() => setDistTab("speed")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  distTab === "speed"
                    ? "bg-[#FFD700] text-[#111111]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Скорость WPM
              </button>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {distTab === "weekday" ? (
                <BarChart data={stats.weekdayActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: any, _: any, item: any) => [
                      `${value} заезд(ов) • ср. ${item?.payload?.avgWpm || 0} WPM`,
                      item?.payload?.day,
                    ]}
                    labelFormatter={() => ""}
                  />
                  <Bar dataKey="runs" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    {stats.weekdayActivity.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.runs > 0 ? "#FFD700" : "#27272A"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={stats.speedBuckets} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: any) => [`${value} заезд(ов)`, "Количество"]}
                    labelFormatter={(label) => `${label} WPM`}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42}>
                    {stats.speedBuckets.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          idx === 4
                            ? "#FFD700"
                            : idx === 3
                            ? "#34D399"
                            : entry.count > 0
                            ? "#F59E0B"
                            : "#27272A"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Правый: Разбивка по раскладкам и режимам */}
        <div className="bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl flex flex-col gap-5">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Keyboard size={18} className="text-[#FFD700]" />
            <span>Раскладки и режимы тренировок</span>
          </h3>

          {/* Раскладки */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              По языкам
            </div>
            {stats.languageBreakdown.map((item) => {
              const pct = Math.round((item.count / stats.totalRuns) * 100);
              return (
                <div key={item.key} className="bg-[#111111] rounded-2xl p-3 border border-white/5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white">{item.label}</span>
                    <span className="text-gray-400">
                      {item.count} ({pct}%) • ср.{" "}
                      <strong className="text-[#FFD700]">{item.avgWpm} WPM</strong> • макс{" "}
                      <strong className="text-white">{item.bestWpm}</strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFD700] to-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Режимы */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              По режимам
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.modeBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#111111] rounded-2xl p-3 border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[11px] text-gray-500">{item.count} заезд(ов)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#FFD700]">{item.avgWpm} WPM</div>
                    <div className="text-[10px] text-emerald-400">{item.avgAccuracy}% точн.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Достижения игрока */}
      <div className="bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#FFD700]" />
            <span>Достижения</span>
          </h3>
          <span className="text-xs font-bold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/20 px-3 py-1 rounded-full">
            Открыто {stats.achievements.filter((a) => a.unlocked).length} из{" "}
            {stats.achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-2xl p-3.5 border transition-all flex items-start gap-3 ${
                ach.unlocked
                  ? "bg-gradient-to-br from-[#FFD700]/10 to-amber-500/5 border-[#FFD700]/35"
                  : "bg-[#111111]/70 border-white/5 opacity-65"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  ach.unlocked ? "bg-[#FFD700]/20" : "bg-white/5 grayscale"
                }`}
              >
                {ach.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-white truncate">{ach.title}</span>
                  {ach.unlocked ? (
                    <CheckCircle2 size={14} className="text-[#FFD700] shrink-0" />
                  ) : (
                    <Lock size={13} className="text-gray-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                  {ach.description}
                </p>
                <div className="text-[10px] font-bold mt-1.5 text-gray-500">
                  {ach.unlocked ? (
                    <span className="text-emerald-400">Получено</span>
                  ) : (
                    <span>Прогресс: {ach.progressText}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomChartTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-[#111111] border border-white/15 rounded-2xl p-3 shadow-2xl text-xs">
      <div className="font-bold text-gray-300 mb-1.5 flex items-center justify-between gap-4">
        <span>Заезд {item.label}</span>
        <span className="text-[10px] text-gray-500">{item.fullDate}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">Скорость:</span>
          <span className="font-black text-[#FFD700]">{item.wpm} WPM</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">Точность:</span>
          <span className="font-black text-emerald-400">{item.accuracy}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">Время:</span>
          <span className="font-bold text-white">{item.duration} сек</span>
        </div>
        {(item.mode || item.language) && (
          <div className="pt-1 mt-1 border-t border-white/10 text-[10px] text-gray-400 flex items-center justify-between gap-2">
            <span>{item.mode}</span>
            {item.language && <span className="text-white font-bold">{item.language}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
