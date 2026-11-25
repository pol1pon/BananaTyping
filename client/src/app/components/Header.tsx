import { Trophy, Keyboard, Shield } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../stores/userStore";
import { BananaLogo } from "./BananaLogo";
import { UserAvatar } from "./UserAvatar";

export function Header() {
  const { currentUser } = useAuthStore();
  const location = useLocation();

  const isTraining = location.pathname === "/training";
  const isLeaderboard = location.pathname === "/leaderboard";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="bg-[#111111] text-white border-b border-white/5 px-4 sm:px-6 md:px-10 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="transition-transform group-hover:scale-105 group-hover:-rotate-3 duration-200">
            <BananaLogo size={28} className="sm:w-8 sm:h-8" />
          </div>
          <span className="font-extrabold text-base sm:text-xl tracking-wide text-white group-hover:text-[#FFD700] transition-colors">
            BananaTyping
          </span>
        </Link>

        {/* Десктопная навигация */}
        <nav className="hidden sm:flex items-center gap-5 md:gap-7 text-sm font-medium">
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
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {currentUser ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all border ${
                    isAdminPage
                      ? "bg-[#FFD700] text-[#111111] border-[#FFD700]"
                      : "bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30"
                  }`}
                  title="Панель администратора"
                >
                  <Shield size={13} />
                  <span className="hidden md:inline">Админ</span>
                </Link>
              )}

              <Link
                to="/profile"
                className="flex items-center gap-1.5 sm:gap-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-full text-xs sm:text-sm transition-transform active:scale-95 shadow-sm"
              >
                <UserAvatar
                  avatar={currentUser.avatar}
                  username={currentUser.username}
                  size={22}
                  isAdmin={isAdmin}
                  showAdminBadge={false}
                />
                <span className="max-w-[85px] sm:max-w-[120px] truncate">{currentUser.username || "Профиль"}</span>
              </Link>
            </>
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
      </div>

      {/* Мобильная навигация (< sm) */}
      <nav className="flex sm:hidden items-center justify-center gap-2 mt-2.5 pt-2.5 border-t border-white/10 text-xs font-semibold">
        <Link
          to="/training"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl transition-colors ${
            isTraining
              ? "bg-[#FFD700]/15 text-[#FFD700] font-bold border border-[#FFD700]/30"
              : "text-gray-300 bg-white/5 hover:text-[#FFD700]"
          }`}
        >
          <Keyboard size={14} />
          <span>Тренировка</span>
        </Link>
        <Link
          to="/leaderboard"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl transition-colors ${
            isLeaderboard
              ? "bg-[#FFD700]/15 text-[#FFD700] font-bold border border-[#FFD700]/30"
              : "text-gray-300 bg-white/5 hover:text-[#FFD700]"
          }`}
        >
          <Trophy size={14} />
          <span>Топ игроков</span>
        </Link>
      </nav>
    </header>
  );
}
