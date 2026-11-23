import { HeroLeft } from "../components/HeroLeft";
import { TrainerCard } from "../components/TrainerCard";
import { ProgressWidget } from "../components/ProgressWidget";
import { LeaderboardWidget } from "../components/LeaderboardWidget";
import { Sparkles, Database, Trophy, Keyboard, CheckCircle2 } from "lucide-react";

export function Home() {
  return (
    <div className="w-full">
      {/* Темный Hero-блок со скруглением в стиле спецификации */}
      <section className="bg-[#111111] rounded-b-[36px] sm:rounded-b-[48px] lg:rounded-br-[120px] lg:rounded-bl-none text-white pt-4 pb-14 sm:pb-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <HeroLeft />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 xl:grid-cols-3 gap-6 lg:mt-6 xl:mt-8">
              <div className="xl:col-span-2">
                <TrainerCard />
              </div>
              <div className="xl:col-span-1 flex flex-col sm:flex-row xl:flex-col gap-6">
                <ProgressWidget />
                <LeaderboardWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция возможностей и преимуществ: ИИ генератор + SQLite + Тренажер */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Все для прокачки <span className="text-[#D97706]">слепой печати</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Умная генерация текстов, сохранение тренировок в SQLite и отслеживание скорости в реальном времени.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Карточка 1: ИИ */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/20 flex items-center justify-center text-[#D97706]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Бесплатный ИИ генератор</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Бесплатная нейросеть придумывает тексты на любые темы: бананы, программирование, наука или цитаты, с выбором длины и сложности.
            </p>
          </div>

          {/* Карточка 2: SQLite */}
          <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">База данных SQLite</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Каждый сгенерированный текст мгновенно сохраняется в локальную базу SQLite. Вы всегда можете открыть базу и выбрать любимый отрывок.
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
