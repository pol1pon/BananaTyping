import React, { useEffect } from "react";
import { Crown } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useLeaderboardStore } from "../stores/leaderboardStore";

const fallbackLeaders = [
  { rank: 1, name: "SpeedDemon", wpm: 120, avatar: "https://images.unsplash.com/photo-1579420593648-0deba81fd762?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwcGVyc29uJTIwaGVhZHNob3R8ZW58MXx8fHwxNzc4NTkxMjU3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { rank: 2, name: "TypingNinja", wpm: 115, avatar: "https://images.unsplash.com/photo-1762522926157-bcc04bf0b10a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3ODU5MTI1OHww&ixlib=rb-4.1.0&q=80&w=1080" },
  { rank: 3, name: "AlexQwerty", wpm: 108, avatar: "https://images.unsplash.com/photo-1612074962245-966ee49932b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHdvbWFuJTIwZmFjZXxlbnwxfHx8fDE3Nzg1OTEyNTh8MA&ixlib=rb-4.1.0&q=80&w=1080" },
];

export function LeaderboardWidget() {
  const { entries, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const displayLeaders = entries && entries.length > 0 
    ? entries.slice(0, 3).map((item, idx) => ({
        rank: idx + 1,
        name: item.user?.username || `Игрок #${item.id}`,
        wpm: item.wpm,
        avatar: fallbackLeaders[idx % fallbackLeaders.length].avatar,
      }))
    : fallbackLeaders;

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 flex-1">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">Лидеры дня</h3>
        <span className="text-xs text-[#FFD700] font-bold bg-[#FFD700]/10 px-2 py-1 rounded-md">Топ 3</span>
      </div>
      
      <div className="flex flex-col gap-4">
        {displayLeaders.map((leader) => (
          <div key={leader.rank} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${leader.rank === 1 ? 'bg-[#FFD700] text-black' : leader.rank === 2 ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-800'}`}>
              {leader.rank === 1 || leader.rank === 2 ? <Crown size={12} className={leader.rank === 1 ? "text-black" : "text-gray-700"} /> : leader.rank}
            </div>
            <ImageWithFallback 
              src={leader.avatar} 
              alt={leader.name} 
              className="w-10 h-10 rounded-full object-cover shadow-sm"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-900">{leader.name}</div>
            </div>
            <div className="text-sm font-bold text-gray-900">{leader.wpm} <span className="text-xs font-normal text-gray-500">wpm</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
