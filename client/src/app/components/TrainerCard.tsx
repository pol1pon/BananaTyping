import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const keyboardRows = [
  ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
  ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
  ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", ".", "-", "␣"]
];

export function TrainerCard() {
  return (
    <Link to="/training" className="block group">
      <div className="bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-6 transition-all group-hover:shadow-[0_8px_32px_rgba(255,215,0,0.2)] group-hover:border-yellow-200 border border-transparent">
        {/* Шапка статистики */}
        <div className="flex items-center justify-between text-xs sm:text-sm md:text-base border-b border-gray-100 pb-3 sm:pb-4">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
              Скорость
            </span>
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              75 <span className="text-gray-500 text-[10px] sm:text-xs">СЛ/МИН</span>
            </span>
          </div>
          <div className="w-px h-6 sm:h-8 bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
              Точность
            </span>
            <span className="font-bold text-gray-900 text-sm sm:text-base">99%</span>
          </div>
          <div className="w-px h-6 sm:h-8 bg-gray-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
              Время
            </span>
            <span className="font-bold text-gray-900 text-sm sm:text-base">0:48</span>
          </div>
        </div>

        {/* Область текста */}
        <div className="text-lg sm:text-2xl md:text-3xl leading-relaxed font-medium text-gray-400 min-h-[50px] sm:min-h-[64px]">
          <span>скоропечатание </span>
          <span className="bg-[#FFD700]/30 rounded-md px-1 py-0.5 text-gray-900 relative">
            <span className="relative">
              р
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#FFD700] animate-pulse"></span>
            </span>
            азвивает
          </span>
          <span> моторику и память</span>
        </div>

        {/* Адаптивная превью-клавиатура */}
        <div className="flex flex-col gap-1.5 sm:gap-2 items-center bg-gray-50/90 p-3 sm:p-5 rounded-2xl w-full overflow-hidden">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-1.5 w-full justify-center">
              {row.map((key) => {
                const isActive = key === "Р";
                const isNext = key === "А";

                let keyBg = "bg-white shadow-xs border border-gray-100 text-gray-600";

                if (isActive) {
                  keyBg = "bg-[#FFD700] shadow-sm border-[#FACC15] text-[#111111] font-bold";
                } else if (isNext) {
                  keyBg = "bg-white shadow-xs border border-[#FFD700] ring-1 ring-[#FFD700]/40 text-gray-900 font-bold";
                }

                return (
                  <div
                    key={key}
                    className={`${keyBg} flex-1 max-w-[38px] sm:max-w-[46px] h-7 sm:h-9 md:h-11 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs md:text-sm select-none transition-all duration-200`}
                  >
                    {key}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Spacebar */}
          <div className="flex gap-2 mt-1 w-full justify-center">
            <div className="bg-white shadow-xs border border-gray-100 w-36 sm:w-56 md:w-64 h-7 sm:h-9 md:h-11 rounded-md sm:rounded-lg"></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
          <span>Нажмите для перехода к тренировке</span>
          <span className="inline-flex items-center gap-1 font-bold text-gray-900 group-hover:text-[#D97706] transition-colors">
            Тренироваться <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
