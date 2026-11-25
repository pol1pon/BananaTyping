import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Zap, 
  Target, 
  Clock, 
  Search, 
  ArrowRight, 
  RefreshCw,
  User as UserIcon,
  Keyboard
} from "lucide-react";
import { useLeaderboardStore, LeaderboardEntry } from "../stores/leaderboardStore";
import { useAuthStore } from "../stores/userStore";

// Резервный список лидеров для демонстрации, если в базе еще мало записей
const FALLBACK_LEADERS: LeaderboardEntry[] = [
  { id: 101, wpm: 124, accuracy: 99, duration_sec: 30, createdAt: new Date(Date.now() - 3600000).toISOString(), user: { id: 1, username: "SpeedDemon" } },
  { id: 102, wpm: 115, accuracy: 98, duration_sec: 45, createdAt: new Date(Date.now() - 7200000).toISOString(), user: { id: 2, username: "TypingNinja" } },
  { id: 103, wpm: 108, accuracy: 97, duration_sec: 60, createdAt: new Date(Date.now() - 14400000).toISOString(), user: { id: 3, username: "BananaKing" } },
  { id: 104, wpm: 96, accuracy: 96, duration_sec: 30, createdAt: new Date(Date.now() - 28800000).toISOString(), user: { id: 4, username: "CodeMaster" } },
  { id: 105, wpm: 92, accuracy: 95, duration_sec: 60, createdAt: new Date(Date.now() - 43200000).toISOString(), user: { id: 5, username: "FastFingers" } },
  { id: 106, wpm: 87, accuracy: 98, duration_sec: 30, createdAt: new Date(Date.now() - 57600000).toISOString(), user: { id: 6, username: "CyberTypist" } },
  { id: 107, wpm: 81, accuracy: 94, duration_sec: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), user: { id: 7, username: "QwertyWarrior" } },
  { id: 108, wpm: 75, accuracy: 93, duration_sec: 30, createdAt: new Date(Date.now() - 100000000).toISOString(), user: { id: 8, username: "KeyMaster" } },
];

export function LeaderboardPage() {
  const { entries, isLoading, fetchLeaderboard } = useLeaderboardStore();
  const { currentUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"best" | "all">("best");
  const [timeRange, setTimeRange] = useState<"all" | "24h">("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Данные лидерборда (из API или резервные)
  const allEntries = useMemo(() => {
    return entries && entries.length > 0 ? entries : FALLBACK_LEADERS;
  }, [entries]);

  // Обработка данных: фильтрация по периоду, уникальным рекордам и поиску
  const processedEntries = useMemo(() => {
    let list = [...allEntries];

    // Фильтр по времени (если выбрано за последние 24 часа)
    if (timeRange === "24h") {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter((item) => {
        if (!item.createdAt) return false;
        const time = new Date(item.createdAt).getTime();
        return !isNaN(time) && time >= oneDayAgo;
      });
    }

    // Дедупликация: 1 уникальный пользователь = 1 лучший рекорд
    if (filterMode === "best") {
      const bestMap = new Map<string, LeaderboardEntry>();
      list.forEach((entry) => {
        const key = entry.user?.id
          ? `user-${entry.user.id}`
          : `name-${(entry.user?.username || "").trim().toLowerCase() || entry.id}`;
        if (!bestMap.has(key) || (bestMap.get(key)!.wpm < entry.wpm)) {
          bestMap.set(key, entry);
        }
      });
      list = Array.from(bestMap.values());
    }

    // Сортировка по скорости набора WPM (по убыванию)
    list.sort((a, b) => b.wpm - a.wpm);

    // Поиск по имени пользователя
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) =>
        (item.user?.username || `Игрок #${item.id}`).toLowerCase().includes(q)
      );
    }

    return list;
  }, [allEntries, timeRange, filterMode, searchQuery]);

  // Находим место текущего пользователя в топе
  const currentUserRank = useMemo(() => {
    if (!currentUser) return null;
    const index = processedEntries.findIndex(
      (e) => e.user?.id && String(e.user.id) === String(currentUser.id)
    );
    return index !== -1 ? { rank: index + 1, entry: processedEntries[index] } : null;
  }, [currentUser, processedEntries]);

  // Топ-3 для пьедестала почета
  const topThree = processedEntries.slice(0, 3);
  const remainingEntries = processedEntries.slice(3);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Верхний блок заголовка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFD700] text-[#111111] shadow-xs">
              <Trophy size={14} className="fill-current" />
              <span>Таблица рекордов</span>
            </span>
            <span className="text-xs text-gray-500 font-medium">Обновляется в реальном времени</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Топ пользователей по <span className="text-[#D97706]">WPM</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Рейтинг лучших мастеров слепой печати BananaTyping по скорости набора (слов в минуту) и точности.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={() => fetchLeaderboard()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title="Обновить таблицу"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-[#D97706]" : ""} />
            <span className="hidden sm:inline">Обновить</span>
          </button>

          <Link
            to="/training"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-gray-800 text-[#FFD700] font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Keyboard size={16} />
            <span>Тренироваться</span>
          </Link>
        </div>
      </div>

      {/* Уведомление о позиции текущего авторизованного пользователя */}
      {currentUser && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-400/10 to-yellow-300/10 border border-yellow-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700] text-gray-900 font-black flex items-center justify-center text-sm shadow-xs">
              {currentUserRank ? `#${currentUserRank.rank}` : "—"}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">
                {currentUser.username} {currentUserRank && <span className="text-[#D97706]">(Твое место в рейтинге)</span>}
              </div>
              <div className="text-xs text-gray-600">
                {currentUserRank
                  ? `Твой личный рекорд: ${currentUserRank.entry.wpm} WPM с точностью ${currentUserRank.entry.accuracy}%`
                  : "Ты еще не установил свой рекорд. Пройди тренировку, чтобы попасть в топ!"}
              </div>
            </div>
          </div>

          <Link
            to="/training"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-gray-800 text-[#FFD700] text-xs font-bold transition-all active:scale-95 self-start sm:self-center shrink-0"
          >
            <span>{currentUserRank ? "Улучшить рекорд" : "Войти в топ"}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Пьедестал почёта: Топ-3 игрока */}
      {topThree.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end">
          
          {/* 2 МЕСТО (Серебро) */}
          <div className="order-2 md:order-1 bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-black text-sm flex items-center justify-center mb-3">
              2
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 text-white font-black text-xl flex items-center justify-center shadow-md mb-2">
              {(topThree[1].user?.username || "2").charAt(0).toUpperCase()}
            </div>
            <div className="font-extrabold text-gray-900 text-base max-w-full truncate px-2 mb-1">
              {topThree[1].user?.username || `Игрок #${topThree[1].id}`}
            </div>
            <div className="flex items-center gap-1 text-2xl font-black text-gray-900 mb-2">
              <span>{topThree[1].wpm}</span>
              <span className="text-xs font-semibold text-gray-400">WPM</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Target size={12} className="text-gray-400" />
              <span>Точность: {topThree[1].accuracy}%</span>
            </div>
          </div>

          {/* 1 МЕСТО (Золото) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/15 via-white to-white rounded-3xl p-6 sm:p-7 border-2 border-[#FFD700] ring-4 ring-[#FFD700]/20 shadow-[0_12px_32px_rgba(255,215,0,0.2)] flex flex-col items-center text-center relative overflow-hidden md:-mt-4">
            <div className="absolute top-3 right-3 text-xs font-bold bg-[#FFD700] text-gray-900 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Crown size={12} className="fill-current" />
              <span>Чемпион</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FFD700] text-gray-950 font-black text-base flex items-center justify-center mb-2 shadow-sm">
              <Crown size={20} className="fill-current text-gray-900" />
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-300 text-gray-950 font-black text-2xl flex items-center justify-center shadow-md mb-2 ring-4 ring-white">
              {(topThree[0].user?.username || "1").charAt(0).toUpperCase()}
            </div>
            <div className="font-black text-gray-900 text-lg max-w-full truncate px-2 mb-1">
              {topThree[0].user?.username || `Игрок #${topThree[0].id}`}
            </div>
            <div className="flex items-center gap-1.5 text-3xl font-black text-[#D97706] mb-2">
              <span>{topThree[0].wpm}</span>
              <span className="text-sm font-bold text-gray-500">WPM</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
              <Target size={12} className="text-[#D97706]" />
              <span>Точность: {topThree[0].accuracy}%</span>
            </div>
          </div>

          {/* 3 МЕСТО (Бронза) */}
          <div className="order-3 bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center mb-3">
              3
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-xl flex items-center justify-center shadow-md mb-2">
              {(topThree[2].user?.username || "3").charAt(0).toUpperCase()}
            </div>
            <div className="font-extrabold text-gray-900 text-base max-w-full truncate px-2 mb-1">
              {topThree[2].user?.username || `Игрок #${topThree[2].id}`}
            </div>
            <div className="flex items-center gap-1 text-2xl font-black text-gray-900 mb-2">
              <span>{topThree[2].wpm}</span>
              <span className="text-xs font-semibold text-gray-400">WPM</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Target size={12} className="text-gray-400" />
              <span>Точность: {topThree[2].accuracy}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Панель фильтров и поиска */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Переключатель периода (За 24 часа / За все время) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setTimeRange("all")}
                className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  timeRange === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                За все время
              </button>
              <button
                onClick={() => setTimeRange("24h")}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  timeRange === "24h"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Clock size={13} className={timeRange === "24h" ? "text-[#D97706]" : ""} />
                <span>За 24 часа</span>
              </button>
            </div>

            {/* Переключатель режимов отображения */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setFilterMode("best")}
                className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  filterMode === "best"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Личные рекорды
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  filterMode === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Все заезды ({allEntries.length})
              </button>
            </div>
          </div>

          {/* Строка поиска по нику */}
          <div className="relative flex-1 w-full lg:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени игрока..."
              className="w-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Таблица лидеров */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 sm:py-4 px-3 sm:px-6 w-12 sm:w-16">#</th>
                <th className="py-3.5 sm:py-4 px-3 sm:px-6">Пользователь</th>
                <th className="py-3.5 sm:py-4 px-3 sm:px-6 text-right">Скорость</th>
                <th className="py-3.5 sm:py-4 px-3 sm:px-6 text-right">Точность</th>
                <th className="py-3.5 sm:py-4 px-3 sm:px-6 text-right hidden sm:table-cell">Время</th>
                <th className="py-3.5 sm:py-4 px-3 sm:px-6 text-right hidden md:table-cell">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {processedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-base mb-1">Ничего не найдено</p>
                    <p className="text-xs">Попробуй изменить поисковый запрос</p>
                  </td>
                </tr>
              ) : (
                processedEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isCurrent =
                    currentUser && entry.user?.id && String(entry.user.id) === String(currentUser.id);
                  const username = entry.user?.username || `Игрок #${entry.id}`;

                  return (
                    <tr
                      key={entry.id || idx}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-yellow-50/80 font-semibold"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      {/* Ранг # */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center">
                          {rank === 1 ? (
                            <span className="w-7 h-7 rounded-full bg-[#FFD700] text-gray-900 flex items-center justify-center font-black text-xs shadow-xs">
                              <Crown size={14} className="fill-current text-gray-900" />
                            </span>
                          ) : rank === 2 ? (
                            <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                              2
                            </span>
                          ) : rank === 3 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="font-bold text-gray-400 pl-2">{rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Пользователь */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${
                            rank === 1
                              ? "bg-gradient-to-tr from-yellow-400 to-amber-500 text-gray-900"
                              : rank === 2
                              ? "bg-gradient-to-tr from-gray-300 to-gray-500"
                              : rank === 3
                              ? "bg-gradient-to-tr from-amber-600 to-amber-700"
                              : "bg-gradient-to-tr from-gray-400 to-gray-600"
                          }`}>
                            {username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className={`font-bold truncate max-w-[100px] sm:max-w-none ${isCurrent ? "text-[#D97706]" : "text-gray-900"}`}>
                              {username}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#FFD700] text-gray-950 uppercase shrink-0">
                                Ты
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Скорость WPM */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1 font-black text-gray-900 text-sm sm:text-base">
                          <Zap size={14} className="text-[#D97706] fill-current" />
                          <span>{entry.wpm}</span>
                          <span className="text-[10px] font-semibold text-gray-400">WPM</span>
                        </span>
                      </td>

                      {/* Точность % */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-700">
                          <Target size={13} className="text-emerald-500" />
                          <span>{entry.accuracy}%</span>
                        </span>
                      </td>

                      {/* Длительность сессии */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6 text-right text-gray-500 hidden sm:table-cell font-medium">
                        {entry.duration_sec ? `${entry.duration_sec}с` : "—"}
                      </td>

                      {/* Дата */}
                      <td className="py-3.5 sm:py-4 px-3 sm:px-6 text-right text-gray-400 hidden md:table-cell text-xs font-medium">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Нижний призыв к действию */}
      <div className="bg-gradient-to-r from-[#111111] via-gray-900 to-[#111111] text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-[#FFD700] mb-1">
            Хочешь занять первое место в топе? 🍌
          </h3>
          <p className="text-xs sm:text-sm text-gray-300">
            Тренируйся ежедневно, развивай мышечную память и побеждай в рейтинге скоропечатания.
          </p>
        </div>
        <Link
          to="/training"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-black text-sm transition-all active:scale-95 shadow-sm whitespace-nowrap"
        >
          <span>Начать тренировку</span>
          <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}
