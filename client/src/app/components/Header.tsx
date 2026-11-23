import { Banana, User, Trophy, Keyboard } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../stores/userStore";

export function Header() {
  const { currentUser } = useAuthStore();
  const location = useLocation();

  const isTraining = location.pathname === "/training";
  const isLeaderboard = location.pathname === "/leaderboard";

  return (
    <header className="flex items-center justify-between py-3.5 sm:py-5 px-4 sm:px-6 md:px-10 bg-[#111111] text-white border-b border-white/5">
      {/* Логотип */}
      <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
        <div className="text-[#FFD700] transition-transform group-hover:rotate-12 duration-200">
          <Banana size={24} className="sm:w-7 sm:h-7 fill-current" />
        </div>
        <span className="font-extrabold text-base sm:text-xl tracking-wide text-white group-hover:text-[#FFD700] transition-colors">
          BananaTyping
        </span>
      </Link>

      {/* Навигация */}
      <nav className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-medium">
        <Link 
          to="/training" 
          className={`flex items-center gap-1.5 transition-colors relative py-1 group ${
            isTraining ? "text-[#FFD700] font-bold" : "text-gray-300 hover:text-[#FFD700]"
          }`}
        >
          <Keyboard size={15} className={isTraining ? "text-[#FFD700]" : "text-gray-400 group-hover:text-[#FFD700]"} />
          <span>Тренировка</span>
          <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#FFD700] transition-transform origin-left ${
            isTraining ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}></span>
        </Link>

        <Link 
          to="/leaderboard" 
          className={`flex items-center gap-1.5 transition-colors relative py-1 group ${
            isLeaderboard ? "text-[#FFD700] font-bold" : "text-gray-300 hover:text-[#FFD700]"
          }`}
        >
          <Trophy size={15} className={isLeaderboard ? "text-[#FFD700]" : "text-gray-400 group-hover:text-[#FFD700]"} />
          <span>Топ игроков</span>
          <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#FFD700] transition-transform origin-left ${
            isLeaderboard ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}></span>
        </Link>
      </nav>

      {/* Кнопка профиля / входа */}
      <div>
        {currentUser ? (
          <Link
            to="/profile"
            className="flex items-center gap-1.5 sm:gap-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm transition-transform active:scale-95 shadow-sm"
          >
            <User size={15} />
            <span className="max-w-[120px] truncate">{currentUser.username || "Профиль"}</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm transition-transform active:scale-95 shadow-sm whitespace-nowrap"
          >
            <span className="sm:hidden">ВОЙТИ</span>
            <span className="hidden sm:inline">ВОЙТИ / РЕГИСТРАЦИЯ</span>
          </Link>
        )}
      </div>
    </header>
  );
}
