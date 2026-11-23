import React from "react";
import { Sparkles, RefreshCw, Loader2, Clock, FileText, Infinity as InfinityIcon } from "lucide-react";

export type TrainingMode = "text" | "time" | "endless";
export type TimeLimit = 15 | 30 | 60 | 120;

export interface TopicOption {
  id: string;
  label: string;
}

interface AiGeneratorBarProps {
  mode: TrainingMode;
  onSelectMode: (mode: TrainingMode) => void;
  timeLimit: TimeLimit;
  onSelectTimeLimit: (limit: TimeLimit) => void;
  selectedLength: "short" | "medium" | "long";
  onSelectLength: (length: "short" | "medium" | "long") => void;
  topics: TopicOption[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  onGenerateAi: () => void;
  onNextRandom: () => void;
  isGenerating: boolean;
  isLoading: boolean;
}

export function AiGeneratorBar({
  mode,
  onSelectMode,
  timeLimit,
  onSelectTimeLimit,
  selectedLength,
  onSelectLength,
  topics,
  selectedTopic,
  onSelectTopic,
  onGenerateAi,
  onNextRandom,
  isGenerating,
  isLoading,
}: AiGeneratorBarProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-amber-300/10 border border-yellow-200/60 rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 mb-6 shadow-sm flex flex-col gap-3.5">
      {/* 1. Верхний ряд: Переключатель режимов тренировки */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yellow-200/50 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Режим:
          </span>

          {/* Режим: Текст */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onSelectMode("text");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              mode === "text"
                ? "bg-[#111111] text-[#FFD700] shadow-sm"
                : "bg-white/80 hover:bg-white text-gray-700 border border-yellow-100"
            }`}
          >
            <FileText size={13} />
            <span>Текст</span>
          </button>

          {/* Режим: На время */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onSelectMode("time");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              mode === "time"
                ? "bg-[#111111] text-[#FFD700] shadow-sm"
                : "bg-white/80 hover:bg-white text-gray-700 border border-yellow-100"
            }`}
          >
            <Clock size={13} />
            <span>На время</span>
          </button>

          {/* Режим: Бесконечный */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onSelectMode("endless");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              mode === "endless"
                ? "bg-[#111111] text-[#FFD700] shadow-sm"
                : "bg-white/80 hover:bg-white text-gray-700 border border-yellow-100"
            }`}
          >
            <InfinityIcon size={14} />
            <span>Бесконечный</span>
          </button>
        </div>

        {/* Подсказка текущего режима */}
        <div className="text-[11px] font-medium text-gray-500 hidden md:block">
          {mode === "text" && "Отработка цельного текста выбранной длины"}
          {mode === "time" && `Тест на скорость с таймером на ${timeLimit} сек`}
          {mode === "endless" && "Непрерывный поток текста без ограничения по времени"}
        </div>
      </div>

      {/* 2. Нижний ряд: Тематика, параметры режима и кнопка генерации */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Выбор тематики текста */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-gray-500 mr-1">Тема:</span>
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectTopic(topic.id);
                }}
                className={`text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  selectedTopic === topic.id
                    ? "bg-[#111111] text-[#FFD700] shadow-sm"
                    : "bg-white/80 hover:bg-white text-gray-700 border border-yellow-100"
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Настройки режима и кнопки генерации */}
        <div className="flex flex-wrap items-center gap-2 sm:self-end lg:self-center w-full sm:w-auto">
          {/* В режиме ТЕКСТ: переключатель длины */}
          {mode === "text" && (
            <div className="flex items-center bg-white/90 rounded-xl p-1 border border-yellow-200 text-xs">
              {(["short", "medium", "long"] as const).map((len) => {
                const labels = { short: "Короткий", medium: "Средний", long: "Длинный" };
                return (
                  <button
                    key={len}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSelectLength(len);
                    }}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedLength === len
                        ? "bg-[#FFD700] text-black font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {labels[len]}
                  </button>
                );
              })}
            </div>
          )}

          {/* В режиме НА ВРЕМЯ: выбор лимита секунд */}
          {mode === "time" && (
            <div className="flex items-center bg-white/90 rounded-xl p-1 border border-yellow-200 text-xs">
              {([15, 30, 60, 120] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectTimeLimit(sec);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    timeLimit === sec
                      ? "bg-[#FFD700] text-black font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {sec}с
                </button>
              ))}
            </div>
          )}

          {/* В режиме БЕСКОНЕЧНЫЙ: бейдж непрерывности */}
          {mode === "endless" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-yellow-200 text-xs font-bold text-gray-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Поток без остановок</span>
            </div>
          )}

          {/* Кнопка генерации нейросетью */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onGenerateAi();
            }}
            disabled={isGenerating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#111111] hover:bg-gray-800 text-[#FFD700] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin text-[#FFD700]" />
                <span>ИИ пишет...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Сгенерировать с ИИ</span>
              </>
            )}
          </button>

          {/* Кнопка получения следующего случайного текста */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onNextRandom();
            }}
            disabled={isLoading || isGenerating}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Получить другой готовый текст"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Случайный</span>
          </button>
        </div>
      </div>
    </div>
  );
}
