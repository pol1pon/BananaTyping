import { Banana, Github, Heart } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#111111] text-gray-400 pt-16 pb-12 px-4 sm:px-8 relative overflow-hidden mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        {/* Бренд и описание */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-3 text-white group">
            <div className="text-[#FFD700] transition-transform group-hover:rotate-12 duration-200">
              <Banana size={24} className="fill-current" />
            </div>
            <span className="font-extrabold text-lg tracking-wide">BananaTyping</span>
          </Link>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Современный тренажер слепой десятипальцевой печати с умной генерацией текстов через ИИ и персональной аналитикой прогресса.
          </p>
        </div>

        {/* Навигационные ссылки */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-gray-300">
          <Link to="/" className="hover:text-[#FFD700] transition-colors">
            Главная
          </Link>
          <Link to="/training" className="hover:text-[#FFD700] transition-colors">
            Тренажер
          </Link>
          <Link to="/leaderboard" className="hover:text-[#FFD700] transition-colors">
            Топ игроков
          </Link>
          <Link to="/profile" className="hover:text-[#FFD700] transition-colors">
            Личный кабинет
          </Link>
          <Link to="/login" className="hover:text-[#FFD700] transition-colors">
            Авторизация
          </Link>
        </div>

        {/* Копирайт */}
        <div className="flex flex-col items-center md:items-end text-xs text-gray-500 gap-1">
          <p>© 2026 BananaTyping. Все права защищены.</p>
          <p className="flex items-center gap-1 text-gray-600">
            Сделано с любовью к скоропечатанию
          </p>
        </div>
      </div>
    </footer>
  );
}
