import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  RefreshCw, 
  Zap, 
  Target, 
  ArrowLeft, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { Link } from "react-router";

import { useAuthStore } from "../stores/userStore";
import { useLeaderboardStore } from "../stores/leaderboardStore";
import { useTextStore } from "../stores/textStore";
import { leaderboardsControllerCreate } from "../../client/sdk.gen";

import { VirtualKeyboard } from "../components/training/VirtualKeyboard";
import { SavedTextsModal } from "../components/training/SavedTextsModal";
import { AiGeneratorBar, type TopicOption } from "../components/training/AiGeneratorBar";
import { areCharsEqual, isDashChar } from "../utils/charMatching";

const KEYBOARDS: Record<'ru' | 'en', string[][]> = {
  ru: [
    ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
    ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
    ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", ".", ",", "-"]
  ],
  en: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "-"]
  ]
};

const TOPICS: Record<'ru' | 'en', TopicOption[]> = {
  ru: [
    { id: "бананы и юмор", label: "🍌 Бананы" },
    { id: "программирование и IT", label: "💻 IT и код" },
    { id: "космос и наука", label: "🚀 Космос" },
    { id: "философия и цитаты", label: "💡 Цитаты" },
    { id: "случайная тема", label: "🎲 Любая" },
  ],
  en: [
    { id: "bananas and humor", label: "🍌 Bananas" },
    { id: "coding and technology", label: "💻 Coding" },
    { id: "space and science", label: "🚀 Science" },
    { id: "quotes and life", label: "💡 Quotes" },
    { id: "random topic", label: "🎲 Random" },
  ]
};

export function Training() {
  const { currentUser, fetchUserResults } = useAuthStore();
  const { fetchLeaderboard } = useLeaderboardStore();
  const { 
    currentText, 
    currentTopic, 
    currentSource, 
    isLoading, 
    isGenerating, 
    history,
    fetchRandomText, 
    generateAiText, 
    fetchHistory,
    selectTextFromHistory 
  } = useTextStore();

  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [selectedTopic, setSelectedTopic] = useState<string>("бананы и юмор");
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Состояние набора текста
  const [typedChars, setTypedChars] = useState("");
  const typedCharsRef = useRef("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<'idle' | 'typing' | 'finished'>('idle');
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  // Финальные сохраненные результаты после завершения теста
  const [finalResult, setFinalResult] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null);

  const sampleText = currentText || (lang === 'ru' ? 'Текст загружается...' : 'Loading text...');
  const currentIndex = typedChars.length;
  const expectedChar = sampleText[currentIndex] || "";

  // Сброс прогресса набора
  const reset = useCallback(() => {
    setTypedChars("");
    typedCharsRef.current = "";
    setStartTime(null);
    setErrors(0);
    setStatus("idle");
    setWrongKey(null);
    setFinalResult(null);
  }, []);

  // Первоначальная загрузка текста и истории из SQLite
  useEffect(() => {
    fetchRandomText(lang);
    fetchHistory(lang);
  }, [lang, fetchRandomText, fetchHistory]);

  // Сброс при изменении текущего текста
  useEffect(() => {
    reset();
  }, [currentText, reset]);

  // Расчет скорости (WPM)
  const calculateWPM = useCallback(() => {
    if (!startTime || currentIndex === 0) return 0;
    const timeElapsedMin = (Date.now() - startTime) / 60000;
    const wordsTyped = currentIndex / 5;
    return Math.round(wordsTyped / timeElapsedMin);
  }, [startTime, currentIndex]);

  // Расчет точности (%)
  const calculateAccuracy = useCallback(() => {
    if (currentIndex === 0 && errors === 0) return 100;
    const totalKeystrokes = currentIndex + errors;
    return Math.round((currentIndex / totalKeystrokes) * 100);
  }, [currentIndex, errors]);

  // Расчет длительности (сек)
  const calculateDurationSec = useCallback(() => {
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime) / 1000);
  }, [startTime]);

  // Обработка нажатий клавиш с умным отслеживанием дефисов/тире
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showHistoryModal) return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === " ") {
        e.preventDefault();
      }

      if (e.key === "Escape") {
        reset();
        return;
      }

      if (status === "finished") return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length > 1 && e.key !== "Backspace" && e.key !== " ") return;

      if (status === "idle" && e.key.length === 1) {
        setStatus("typing");
        setStartTime(Date.now());
      }

      if (e.key === "Backspace") return;
      if (typedCharsRef.current.length >= sampleText.length) return;

      const currentExpected = sampleText[typedCharsRef.current.length] || "";

      // Отслеживание равенства символов (включая дефис/тире — и -)
      if (areCharsEqual(e.key, currentExpected)) {
        typedCharsRef.current += currentExpected;
        setTypedChars(typedCharsRef.current);
        setWrongKey(null);

        // Проверка завершения текста
        if (typedCharsRef.current.length === sampleText.length) {
          setStatus("finished");
        }
      } else {
        setErrors((prev) => prev + 1);
        setWrongKey(isDashChar(e.key) ? "-" : e.key.toUpperCase());
        setTimeout(() => setWrongKey(null), 200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, sampleText, showHistoryModal, reset]);

  // Сохранение результатов в БД при завершении
  useEffect(() => {
    if (status !== "finished") return;

    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    const duration = calculateDurationSec();
    setFinalResult({ wpm, accuracy, duration });

    if (currentUser) {
      leaderboardsControllerCreate({
        body: {
          userId: Number(currentUser.id),
          wpm,
          accuracy,
          duration_sec: duration,
        },
      })
        .then(() => Promise.all([fetchUserResults(String(currentUser.id)), fetchLeaderboard()]))
        .catch((err) => console.error("Ошибка сохранения результата:", err));
    }
  }, [status, currentUser, calculateWPM, calculateAccuracy, calculateDurationSec, fetchUserResults, fetchLeaderboard]);

  // Смена языка
  const handleLangChange = (newLang: 'ru' | 'en') => {
    setLang(newLang);
    setSelectedTopic(newLang === 'ru' ? "бананы и юмор" : "bananas and humor");
    reset();
  };

  // Запуск генерации через бесплатную нейросеть
  const handleGenerateAi = async () => {
    try {
      await generateAiText({
        language: lang,
        topic: selectedTopic,
        length: selectedLength,
        difficulty: 'medium',
      });
      await fetchHistory(lang);
    } catch (err) {
      console.error(err);
    }
  };

  // Получение следующего случайного текста из SQLite
  const handleNextRandom = async () => {
    await fetchRandomText(lang);
  };

  // Отображение подсвеченного текста и курсора
  const renderTextStream = () => {
    return sampleText.split("").map((char, index) => {
      if (index < currentIndex) {
        return (
          <span key={index} className="text-gray-900 font-bold">
            {char}
          </span>
        );
      }

      if (index === currentIndex) {
        const isSpace = char === " ";
        return (
          <span key={index} className="bg-[#FFD700]/30 rounded-sm text-gray-900 relative font-bold">
            <span className="relative inline-block min-w-[0.4em]">
              {isSpace ? "␣" : char}
              <span className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[#FFD700] animate-pulse"></span>
            </span>
          </span>
        );
      }

      return (
        <span key={index} className="text-gray-400">
          {char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Навигационная панель страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Режим тренировки</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Практикуй слепую печать с текстами из SQLite и генерацией через ИИ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            title="Открыть сохраненные тексты в SQLite"
          >
            <Database size={15} className="text-[#FFD700]" />
            <span>База ({history.length})</span>
          </button>

          <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            <button
              onClick={() => handleLangChange('ru')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                lang === 'ru'
                  ? 'bg-[#FFD700] text-[#111111]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Русский
            </button>
            <button
              onClick={() => handleLangChange('en')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                lang === 'en'
                  ? 'bg-[#FFD700] text-[#111111]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Панель управления бесплатной нейросетью */}
      <AiGeneratorBar
        topics={TOPICS[lang]}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        selectedLength={selectedLength}
        onSelectLength={setSelectedLength}
        onGenerateAi={handleGenerateAi}
        onNextRandom={handleNextRandom}
        isGenerating={isGenerating}
        isLoading={isLoading}
      />

      {/* Основная карточка тренажера */}
      <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-5 sm:p-8 md:p-12 flex flex-col gap-6 sm:gap-8 border border-gray-50">
        
        {/* Метки источника и темы текста */}
        <div className="flex flex-wrap items-center justify-between gap-3 -mb-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-700">
              <Database size={12} className="text-gray-500" />
              SQLite: {currentSource || 'сохранен'}
            </span>
            {currentTopic && (
              <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FFD700]/20 text-gray-900">
                Тема: {currentTopic}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">Символов: {sampleText.length}</span>
        </div>

        {/* Панель статистики в реальном времени */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 sm:pb-6">
          <div className="flex gap-6 sm:gap-10">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                <Zap size={20} className={status === 'typing' ? "text-[#FFD700]" : ""} />
              </div>
              <div>
                <div className="text-gray-400 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  Скорость
                </div>
                <div className="text-lg sm:text-2xl font-black text-gray-900">
                  {finalResult ? finalResult.wpm : calculateWPM()}{" "}
                  <span className="text-gray-500 text-xs sm:text-sm font-medium">СЛ/МИН</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                <Target size={20} className={status === 'typing' ? "text-[#FFD700]" : ""} />
              </div>
              <div>
                <div className="text-gray-400 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  Точность
                </div>
                <div className="text-lg sm:text-2xl font-black text-gray-900">
                  {finalResult ? finalResult.accuracy : calculateAccuracy()}%
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors text-xs sm:text-sm active:scale-95"
          >
            <RefreshCw size={16} />
            <span>Начать заново</span>
          </button>
        </div>

        {/* Область набираемого текста */}
        <div
          className="text-xl sm:text-2xl md:text-3xl leading-relaxed font-mono select-none outline-none tracking-tight break-words min-h-[72px] sm:min-h-[96px]"
          tabIndex={0}
          autoFocus
        >
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-400 text-base sm:text-lg">
              <Loader2 size={20} className="animate-spin text-[#FFD700]" />
              <span>Загрузка текста из базы данных...</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center gap-3 text-gray-500 text-base sm:text-lg animate-pulse">
              <Sparkles size={20} className="text-[#FFD700]" />
              <span>Бесплатная нейросеть придумывает новый текст для тебя...</span>
            </div>
          ) : (
            renderTextStream()
          )}
        </div>

        {/* Поздравительная карточка окончания теста */}
        {status === "finished" && finalResult && (
          <div className="bg-green-50 border border-green-200 text-green-900 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in zoom-in duration-300">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={18} className="text-green-600" />
                <h3 className="text-lg sm:text-xl font-bold">Тренировка завершена! 🎉</h3>
              </div>
              <p className="text-green-700 text-xs sm:text-sm">
                Твоя скорость: <strong>{finalResult.wpm}</strong> сл/мин, точность:{" "}
                <strong>{finalResult.accuracy}%</strong>, время: <strong>{finalResult.duration}</strong> сек.
                {currentUser ? " Результат сохранен в лидерборд!" : " Авторизуйся, чтобы сохранять результаты в профиль."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={handleGenerateAi}
                disabled={isGenerating}
                className="bg-[#111111] hover:bg-gray-800 text-[#FFD700] font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={15} />
                <span>Сгенерировать с ИИ</span>
              </button>
              <button
                onClick={handleNextRandom}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors whitespace-nowrap shadow-sm text-xs sm:text-sm active:scale-95 text-center"
              >
                Следующий текст
              </button>
            </div>
          </div>
        )}

        {/* Виртуальная клавиатура */}
        <VirtualKeyboard
          keyboardRows={KEYBOARDS[lang]}
          expectedChar={expectedChar}
          wrongKey={wrongKey}
          isFinished={status === "finished"}
        />

        <div className="text-center text-gray-400 text-xs sm:text-sm font-medium -mt-2">
          Печатай текст на клавиатуре (дефис и тире распознаются клавишей <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 text-gray-700 font-mono">-</kbd>). 
          Нажми <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 text-gray-700 font-sans mx-1">Esc</kbd> для сброса.
        </div>
      </div>

      {/* Модальное окно базы сохраненных текстов в SQLite */}
      <SavedTextsModal
        isOpen={showHistoryModal}
        texts={history}
        onClose={() => setShowHistoryModal(false)}
        onSelectText={selectTextFromHistory}
      />
    </div>
  );
}
