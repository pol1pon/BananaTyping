import React, { useEffect } from "react";
import { Crown, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useLeaderboardStore } from "../stores/leaderboardStore";

const fallbackLeaders = [
  { rank: 1, name: "SpeedDemon", wpm: 120 },
  { rank: 2, name: "TypingNinja", wpm: 115 },
  { rank: 3, name: "AlexQwerty", wpm: 108 },
];

export function LeaderboardWidget() {
  const { entries, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const displayLeaders =
    entries && entries.length > 0
      ? entries.slice(0, 3).map((item, idx) => ({
          rank: idx + 1,
          name: item.user?.username || `Игрок #${item.id}`,
          wpm: item.wpm,
        }))
      : fallbackLeaders;

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy size={15} className="text-[#D97706]" />
            <span>Лидеры дня</span>
          </h3>
          <span className="text-[11px] text-[#D97706] font-bold bg-[#FFD700]/15 px-2 py-0.5 rounded-md">
            Топ 3
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {displayLeaders.map((leader) => (
            <div
              key={leader.rank}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {leader.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  {leader.name}
                </div>
              </div>

              <div className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                {leader.wpm}{" "}
                <span className="text-[10px] font-normal text-gray-500">WPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span className="text-gray-400">Обновляется в реальном времени</span>
        <Link
          to="/training"
          className="inline-flex items-center gap-1 text-[#D97706] hover:underline font-bold"
        >
          <span>Участвовать</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
