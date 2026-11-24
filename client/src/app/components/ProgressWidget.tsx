import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useAuthStore } from "../stores/userStore";
import { Link } from "react-router";
import { Zap, TrendingUp } from "lucide-react";

const DEMO_DATA = [
  { name: "Пн", wpm: 45 },
  { name: "Вт", wpm: 52 },
  { name: "Ср", wpm: 50 },
  { name: "Чт", wpm: 65 },
  { name: "Пт", wpm: 72 },
  { name: "Сб", wpm: 70 },
  { name: "Вс", wpm: 75 },
];

export function ProgressWidget() {
  const { currentUser, recentResults } = useAuthStore();

  // Если у пользователя есть реальные результаты, формируем график по ним
  const hasRealData = recentResults && recentResults.length > 0;

  const chartData = hasRealData
    ? recentResults.slice(-7).map((item, idx) => ({
        name: `№${idx + 1}`,
        wpm: item.wpm,
        accuracy: item.accuracy,
      }))
    : DEMO_DATA;

  // Расчет средней скорости
  const avgWpm = hasRealData
    ? Math.round(
        recentResults.reduce((acc, curr) => acc + (curr.wpm || 0), 0) /
          recentResults.length
      )
    : 75;

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex-1 flex flex-col justify-between min-h-0">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={15} className="text-[#D97706]" />
            <span>Ваш прогресс</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Zap size={12} />
            {avgWpm} wpm
          </span>
        </div>

        <p className="text-[11px] text-gray-400 mb-2 leading-tight">
          {hasRealData
            ? `Статистика последних ${chartData.length} заездов`
            : "Пройдите тренировку для динамики"}
        </p>

        <div className="h-24 sm:h-26 w-full min-h-[85px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
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
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#111111", fontWeight: "bold" }}
                formatter={(value: any) => [`${value} СЛ/МИН`, "Скорость"]}
              />
              <Area
                type="monotone"
                dataKey="wpm"
                stroke="#FFD700"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorWpm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] gap-2">
        <span className="text-gray-400 truncate max-w-[100px]" title={currentUser ? currentUser.username : "Гостевой режим"}>
          {currentUser ? currentUser.username : "Гостевой режим"}
        </span>
        <Link
          to={currentUser ? "/profile" : "/login"}
          className="text-[#D97706] hover:underline font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-0.5"
        >
          <span>Статистика</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    </div>
  );
}
