import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";

export function HeroLeft() {
  return (
    <div className="pt-4 sm:pt-8 md:pt-12 pb-6 sm:pb-10 text-white relative z-10 flex flex-col items-start">
      <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm border border-white/10 text-yellow-300">
        <Sparkles size={14} className="text-[#FFD700]" />
        <span>Умная генерация текстов нового поколения</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-5 tracking-tight">
        ОСВОЙ СКОРОПЕЧАТАНИЕ С <span className="text-[#FFD700]">BANANATYPING!</span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">
        Учись печатать быстро, ритмично и без опечаток. Интерактивный тренажер с умной ИИ-генерацией текстов под любые темы поможет увеличить скорость печати в 2 раза и довести слепой метод до автоматизма.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
        <Link
          to="/training"
          className="bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-extrabold py-3.5 sm:py-4 px-7 sm:px-8 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_24px_rgba(255,215,0,0.35)] hover:shadow-[0_0_28px_rgba(255,215,0,0.5)] text-sm sm:text-base text-center"
        >
          <span>НАЧАТЬ ТРЕНИРОВКУ</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
