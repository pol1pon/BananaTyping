import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useAuthStore } from "../stores/userStore";
import { Link } from "react-router";
import { Zap, TrendingUp, TrendingDown, Target, Award, ArrowRight, Keyboard, Loader2 } from "lucide-react";

type MetricMode = "wpm" | "accuracy";

export function ProgressWidget() {
  const { currentUser, recentResults, guestResults, resultsLoading, fetchUserResults } = useAuthStore();
  const [metric, setMetric] = useState<MetricMode>("wpm");

  // Загружаем реальные результаты авторизованного пользователя при открытии главной страницы
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserResults(currentUser.id);
    }
  }, [currentUser?.id, fetchUserResults]);

  const activeResults = currentUser ? recentResults : guestResults;
  const hasRealData = activeResults && activeResults.length > 0;

  // Хронологический график по последним 10 реальным заездам
  const chartData = useMemo(() => {
    if (!hasRealData) return [];
    return activeResults.slice(-10).map((item, idx) => ({
      name: `#${idx + 1}`,
      wpm: item.wpm,
      accuracy: item.accuracy,
      duration: item.duration_sec,
      dateLabel: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          })
        : "",
    }));
  }, [activeResults, hasRealData]);

  const stats = useMemo(() => {
    if (!hasRealData) {
      return { avgWpm: 0, bestWpm: 0, avgAccuracy: 0, trend: 0, totalRuns: 0 };
    }
    const totalRuns = activeResults.length;
    const avgWpm = Math.round(
      activeResults.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / totalRuns
    );
    const bestWpm = Math.max(...activeResults.map((r) => r.wpm || 0));
    const avgAccuracy = Math.round(
      activeResults.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalRuns
    );

    let trend = 0;
    if (totalRuns >= 2) {
      const half = Math.min(3, Math.floor(totalRuns / 2));
      const recent = activeResults.slice(-half);
      const prev = activeResults.slice(-half * 2, -half);
      if (prev.length > 0) {
        const recentAvg = recent.reduce((s, r) => s + r.wpm, 0) / recent.length;
        const prevAvg = prev.reduce((s, r) => s + r.wpm, 0) / prev.length;
        trend = Math.round(recentAvg - prevAvg);
      }
    }

    return { avgWpm, bestWpm, avgAccuracy, trend, totalRuns };
  }, [activeResults, hasRealData]);

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex-1 flex flex-col justify-between min-h-0">
      <div>
        {/* Заголовок + переключатель метрики */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={15} className="text-[#D97706] shrink-0" />
            <span>Ваш прогресс</span>
          </h3>

          {hasRealData ? (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-[10px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setMetric("wpm")}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  metric === "wpm"
                    ? "bg-[#FFD700] text-[#111111] shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                WPM
              </button>
              <button
                type="button"
                onClick={() => setMetric("accuracy")}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  metric === "accuracy"
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                %
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {currentUser ? "Личный" : "Гость"}
            </span>
          )}
        </div>

        {/* Состояние загрузки */}
        {currentUser && resultsLoading && !hasRealData ? (
          <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin text-[#D97706]" />
            <span className="text-xs">Загрузка статистики...</span>
          </div>
        ) : !hasRealData ? (
          /* Реальное пустое состояние вместо фейкового демо-графика */
          <div className="py-3 px-2 text-center flex flex-col items-center justify-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Keyboard size={18} />
            </div>
            <div className="text-xs font-bold text-gray-900">
              Заездов пока нет
            </div>
            <p className="text-[11px] text-gray-500 max-w-[215px] leading-tight">
              Завершите фразу в тренажёре слева или в полном режиме — здесь появится реальный график!
            </p>
            <Link
              to="/training"
              className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Начать</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {/* Мини-KPI строка по реальным результатам */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <div className="bg-amber-50/70 rounded-xl px-2 py-1.5 text-center border border-amber-100/80">
                <div className="text-[9px] font-bold uppercase text-gray-400 flex items-center justify-center gap-0.5">
                  <Zap size={10} className="text-[#D97706]" /> Сред.
                </div>
                <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                  {stats.avgWpm}
                </div>
              </div>

              <div className="bg-yellow-50/80 rounded-xl px-2 py-1.5 text-center border border-yellow-200/60">
                <div className="text-[9px] font-bold uppercase text-gray-400 flex items-center justify-center gap-0.5">
                  <Award size={10} className="text-[#D97706]" /> Рекорд
                </div>
                <div className="text-xs sm:text-sm font-black text-[#D97706] leading-tight">
                  {stats.bestWpm}
                </div>
              </div>

              <div className="bg-emerald-50/70 rounded-xl px-2 py-1.5 text-center border border-emerald-100/80">
                <div className="text-[9px] font-bold uppercase text-gray-400 flex items-center justify-center gap-0.5">
                  <Target size={10} className="text-emerald-600" /> Точн.
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-700 leading-tight">
                  {stats.avgAccuracy}%
                </div>
              </div>
            </div>

            {/* Живой график Recharts */}
            <div className="h-[88px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRealMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={metric === "wpm" ? "#FFD700" : "#10B981"}
                        stopOpacity={0.75}
                      />
                      <stop
                        offset="95%"
                        stopColor={metric === "wpm" ? "#FFD700" : "#10B981"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={metric === "accuracy" ? ["dataMin - 5", 100] : [0, "auto"]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #F3F4F6",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                      fontSize: "11px",
                      padding: "6px 10px",
                    }}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload;
                      return p?.dateLabel ? `Заезд ${p.name} • ${p.dateLabel}` : "Заезд";
                    }}
                    formatter={(value: any) =>
                      metric === "wpm"
                        ? [`${value} СЛ/МИН`, "Скорость"]
                        : [`${value}%`, "Точность"]
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke={metric === "wpm" ? "#EAB308" : "#10B981"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRealMetric)"
                    dot={{ r: 2.5, fill: metric === "wpm" ? "#D97706" : "#059669", strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Подвал виджета */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-gray-500 font-medium truncate max-w-[105px]"
            title={currentUser ? currentUser.username : "Локально (гость)"}
          >
            {currentUser ? `@${currentUser.username}` : "Локально"}
          </span>
          {hasRealData && stats.trend !== 0 && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                stats.trend > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-500"
              }`}
              title="Тренд последних заездов"
            >
              {stats.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {stats.trend > 0 ? `+${stats.trend}` : stats.trend}
            </span>
          )}
        </div>

        <Link
          to={currentUser ? "/profile" : "/login"}
          className="text-[#D97706] hover:underline font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-0.5"
        >
          <span>{currentUser ? "Вся статистика" : "Войти"}</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
