import React from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

export interface TopicOption {
  id: string;
  label: string;
}

interface AiGeneratorBarProps {
  topics: TopicOption[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  selectedLength: "short" | "medium" | "long";
  onSelectLength: (length: "short" | "medium" | "long") => void;
  onGenerateAi: () => void;
  onNextRandom: () => void;
  isGenerating: boolean;
  isLoading: boolean;
}

export function AiGeneratorBar({
  topics,
  selectedTopic,
  onSelectTopic,
  selectedLength,
  onSelectLength,
  onGenerateAi,
  onNextRandom,
  isGenerating,
  isLoading,
}: AiGeneratorBarProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-amber-300/10 border border-yellow-200/60 rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Выбор тематики */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xs sm:text-sm">
            <Sparkles size={16} className="text-[#D97706] shrink-0" />
            <span>Генератор текстов через бесплатную нейросеть (AI)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs text-gray-500 mr-1">Тема:</span>
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
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

        {/* Длина и кнопки действий */}
        <div className="flex flex-wrap items-center gap-2 sm:self-end lg:self-center w-full sm:w-auto">
          {/* Переключатель длины текста */}
          <div className="flex items-center bg-white/90 rounded-xl p-1 border border-yellow-200 text-xs">
            {(["short", "medium", "long"] as const).map((len) => {
              const labels = { short: "Короткий", medium: "Средний", long: "Длинный" };
              return (
                <button
                  key={len}
                  onClick={() => onSelectLength(len)}
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

          {/* Кнопка генерации нейросетью */}
          <button
            onClick={onGenerateAi}
            disabled={isGenerating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#111111] hover:bg-gray-800 text-[#FFD700] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin text-[#FFD700]" />
                <span>Нейросеть пишет...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Сгенерировать с ИИ</span>
              </>
            )}
          </button>

          {/* Кнопка получения случайного текста из SQLite */}
          <button
            onClick={onNextRandom}
            disabled={isLoading || isGenerating}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Взять случайный сохраненный текст из базы SQLite"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Из базы</span>
          </button>
        </div>

      </div>
    </div>
  );
}
