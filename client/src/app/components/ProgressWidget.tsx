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
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={15} className="text-[#D97706]" />
          <span>Ваш прогресс</span>
        </h3>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap size={12} />
          {avgWpm} wpm
        </span>
      </div>

      <p className="text-[11px] text-gray-400 mb-3">
        {hasRealData
          ? `Статистика последних ${chartData.length} заездов`
          : "Пройдите тренировку, чтобы сохранять динамику скорости"}
      </p>

      <div className="h-28 w-full min-h-[110px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={110}>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWpm)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span className="text-gray-400">
          {currentUser ? currentUser.username : "Гостевой режим"}
        </span>
        <Link
          to={currentUser ? "/profile" : "/login"}
          className="text-[#D97706] hover:underline font-bold"
        >
          {currentUser ? "Подробная статистика →" : "Войти в профиль →"}
        </Link>
      </div>
    </div>
  );
}
