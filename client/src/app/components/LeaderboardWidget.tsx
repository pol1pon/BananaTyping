import React, { useEffect, useMemo } from "react";
import { Crown, Trophy, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { useLeaderboardStore, LeaderboardEntry } from "../stores/leaderboardStore";

export function LeaderboardWidget() {
  const { entries, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // 1. Фильтрация строго за последние 24 часа (сброс каждые 24 часа)
  // 2. Дедупликация: 1 уникальный пользователь = ровно 1 лучший результат
  const topDailyLeaders = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const dailyEntries = (entries || []).filter((item) => {
      if (!item.createdAt) return false;
      const time = new Date(item.createdAt).getTime();
      return !isNaN(time) && time >= oneDayAgo;
    });

    // Храним лучший результат каждого уникального пользователя
    const userBestMap = new Map<string, LeaderboardEntry>();

    dailyEntries.forEach((item) => {
      // Идентифицируем пользователя по ID, либо по никнейму
      const userKey = item.user?.id
        ? `user-${item.user.id}`
        : `name-${(item.user?.username || "").trim().toLowerCase() || item.id}`;

      if (!userBestMap.has(userKey)) {
        userBestMap.set(userKey, item);
      } else {
        const existing = userBestMap.get(userKey)!;
        if (item.wpm > existing.wpm) {
          userBestMap.set(userKey, item);
        }
      }
    });

    // Сортируем по убыванию WPM и берем топ-3 уникальных игроков
    return Array.from(userBestMap.values())
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 3)
      .map((item, idx) => ({
        rank: idx + 1,
        name: item.user?.username || `Игрок #${item.id}`,
        wpm: item.wpm,
      }));
  }, [entries]);

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 flex-1 flex flex-col justify-between">
      <div>
        {/* Заголовок виджета с индикатором 24 часов */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy size={15} className="text-[#D97706]" />
            <span>Лидеры дня</span>
          </h3>
          <span className="text-[11px] text-[#D97706] font-bold bg-[#FFD700]/15 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock size={11} />
            <span>24 часа</span>
          </span>
        </div>

        {/* Список лидеров или состояние отсутствия заездов за последние 24ч */}
        {topDailyLeaders.length === 0 ? (
          <div className="py-5 px-2 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-yellow-50 text-[#D97706] flex items-center justify-center">
              <Crown size={20} />
            </div>
            <div className="text-xs font-bold text-gray-900">
              Топ дня ждет чемпионов!
            </div>
            <p className="text-[11px] text-gray-500 max-w-[210px] leading-tight">
              За последние 24 часа рекордов еще нет. Начни тренировку и займи 1-е место!
            </p>
            <Link
              to="/training"
              className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <span>Стать лидером дня</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {topDailyLeaders.map((leader) => (
              <div
                key={leader.rank}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Номер ранга */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    leader.rank === 1
                      ? "bg-[#FFD700] text-black shadow-xs"
                      : leader.rank === 2
                      ? "bg-gray-200 text-gray-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {leader.rank === 1 ? (
                    <Crown size={14} className="text-black" />
                  ) : (
                    leader.rank
                  )}
                </div>

                {/* Аватарка с инициалом */}
                <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ${
                  leader.rank === 1
                    ? "bg-gradient-to-tr from-yellow-400 to-amber-500 text-gray-950 font-black"
                    : leader.rank === 2
                    ? "bg-gradient-to-tr from-gray-300 to-gray-500"
                    : "bg-gradient-to-tr from-amber-600 to-amber-700"
                }`}>
                  {leader.name.charAt(0).toUpperCase()}
                </div>

                {/* Имя пользователя (только уникальные) */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {leader.name}
                  </div>
                </div>

                {/* Скорость WPM */}
                <div className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                  {leader.wpm}{" "}
                  <span className="text-[10px] font-normal text-gray-500">WPM</span>
                </div>
              </div>
            ))}

            {/* Если за 24ч набралось меньше 3 человек, отображаем интерактивное свободное место */}
            {topDailyLeaders.length < 3 && (
              <Link
                to="/training"
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-dashed border-yellow-300 bg-yellow-50/40 hover:bg-yellow-50 text-[#D97706] transition-colors group mt-0.5"
                title="Начни тренировку и займи свободное место в топе"
              >
                <div className="w-7 h-7 rounded-full border border-yellow-300 text-yellow-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {topDailyLeaders.length + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-600 group-hover:text-gray-900 truncate">
                    Свободное место в топе
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#FFD700] text-[#111111] px-2 py-0.5 rounded-md shadow-xs shrink-0">
                  Занять ⚡
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Подвал виджета: инфо о сбросе каждые 24 часа и ссылка на полный топ */}
      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span className="text-gray-400 flex items-center gap-1" title="Результаты автоматически сбрасываются по истечении 24 часов">
          <RefreshCw size={11} className="text-gray-400" />
          <span>Сброс каждые 24ч</span>
        </span>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-1 text-[#D97706] hover:underline font-bold"
        >
          <span>Весь топ игроков</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
