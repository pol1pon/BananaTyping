import { HeroLeft } from "../components/HeroLeft";
import { TrainerCard } from "../components/TrainerCard";
import { ProgressWidget } from "../components/ProgressWidget";
import { LeaderboardWidget } from "../components/LeaderboardWidget";
import { Sparkles, Trophy, Keyboard } from "lucide-react";

export function Home() {
  return (
    <div className="w-full">
      {/* Темный Hero-блок со скруглением в стиле спецификации */}
      <section className="bg-[#111111] rounded-b-[36px] sm:rounded-b-[48px] lg:rounded-br-[120px] lg:rounded-bl-none text-white pt-4 pb-14 sm:pb-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <HeroLeft />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-5 items-stretch">
              <div className="xl:col-span-7 flex flex-col">
                <TrainerCard />
              </div>
              <div className="xl:col-span-5 flex flex-col sm:flex-row xl:flex-col gap-4 sm:gap-5 justify-between">
                <ProgressWidget />
                <LeaderboardWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция возможностей и преимуществ: ИИ генератор + Тренировки + Лидерборд */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Все для идеального владения <span className="text-[#D97706]">слепой печатью</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Умная генерация текстов на любые темы, персональная статистика заездов и соревновательный рейтинг лидеров.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Карточка 1: ИИ */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/20 flex items-center justify-center text-[#D97706]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Умный AI-генератор</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Искусственный интеллект придумывает разнообразные и грамотные тексты на любые темы: программирование, наука, цитаты или юмор, с выбором длины и сложности.
            </p>
          </div>

          {/* Карточка 2: Библиотека текстов */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Keyboard size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Индивидуальная практика</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Широкий набор тренировочных текстов с поддержкой русского и английского языков, умной обработкой всех видов тире и знаков препинания.
            </p>
          </div>

          {/* Карточка 3: Рейтинг и лидерборд */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Рейтинг и статистика</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Замеряйте скорость в словах в минуту (WPM) и точность (%). Ваши лучшие заезды сохраняются в общий рейтинг лидеров.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
