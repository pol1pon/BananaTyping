import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  RefreshCw, 
  Zap, 
  Target, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Clock,
  Infinity as InfinityIcon,
  Square
} from "lucide-react";
import { Link } from "react-router";

import { useAuthStore } from "../stores/userStore";
import { useLeaderboardStore } from "../stores/leaderboardStore";
import { useTextStore } from "../stores/textStore";
import { leaderboardsControllerCreate } from "../../client/sdk.gen";

import { VirtualKeyboard } from "../components/training/VirtualKeyboard";
import { 
  AiGeneratorBar, 
  type TopicOption, 
  type TrainingMode, 
  type TimeLimit 
} from "../components/training/AiGeneratorBar";
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

// Пул предложений для непрерывного потока в бесконечном режиме и режиме на время
const STREAMING_SENTENCES: Record<'ru' | 'en', string[]> = {
  ru: [
    "бананы содержат много калия и витаминов для продуктивной работы мозга",
    "слепая печать позволяет быстро переносить любые мысли прямо на экран",
    "каждая минута практики приближает пальцы к автоматической печати без ошибок",
    "ритмичные движения и спокойствие помогают удерживать максимальную скорость",
    "красивый и чистый код пишется легче когда не нужно смотреть на клавиатуру",
    "современные технологии открывают безграничные возможности для каждого человека",
    "терпение и регулярные тренировки превращают сложные задачи в простую привычку",
    "свежий банановый коктейль заряжает энергией на весь продуктивный рабочий день",
    "в бесконечной вселенной сияют миллиарды далеких звезд и неизведанных миров",
    "высокая точность всегда важнее спешки потому что скорость приходит автоматически",
    "хороший программист ценит понятный код и элегантные архитектурные решения",
    "уверенность в каждом движении пальцев дает свободу полета творческой мысли"
  ],
  en: [
    "bananas are rich in potassium and nutrients that boost cognitive function",
    "touch typing allows your fingers to move automatically while you focus on ideas",
    "every minute of practice brings you closer to effortless error free typing",
    "rhythm and steady breathing are the real secrets of world class typing velocity",
    "writing clean code feels amazing when your fingers effortlessly hit every symbol",
    "modern technologies unlock unlimited potential for digital creators worldwide",
    "daily deliberate training turns challenging skills into your natural superpower",
    "a fresh smoothie in the morning provides clean natural fuel for productive days",
    "looking up at distant stars reminds us how wondrous the universe truly is",
    "accuracy always leads to speed because smooth rhythm beats rushing every time",
    "great software developers value clarity simplicity and maintainable architecture",
    "mastering touch typing saves hundreds of valuable hours every single year"
  ]
};

export function Training() {
  const { currentUser, fetchUserResults } = useAuthStore();
  const { fetchLeaderboard } = useLeaderboardStore();
  const { 
    currentText, 
    currentTopic, 
    isLoading, 
    isGenerating, 
    error,
    fetchRandomText, 
    generateAiText, 
    fetchHistory,
    clearError
  } = useTextStore();

  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [selectedTopic, setSelectedTopic] = useState<string>("бананы и юмор");
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');

  // Режимы тренировки: обычный текст, на время, бесконечный
  const [mode, setMode] = useState<TrainingMode>('text');
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Динамический поток текста
  const [activeText, setActiveText] = useState<string>("");
  const nextSentenceIndexRef = useRef(0);

  // Ссылки для автопрокрутки
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lastLineTopRef = useRef<number>(-1);

  // Состояние набора текста
  const [typedChars, setTypedChars] = useState("");
  const typedCharsRef = useRef("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<'idle' | 'typing' | 'finished'>('idle');
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  // Финальные сохраненные результаты после завершения теста
  const [finalResult, setFinalResult] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null);

  const sampleText = activeText || currentText || (lang === 'ru' ? 'Текст уже придумывается...' : 'Text is being generated...');
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
    setTimeLeft(timeLimit);
    nextSentenceIndexRef.current = 0;
    lastLineTopRef.current = -1;
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  }, [timeLimit]);

  // Первоначальная загрузка текста
  useEffect(() => {
    fetchRandomText(lang);
    fetchHistory(lang);
  }, [lang, fetchRandomText, fetchHistory]);

  // Синхронизация активного текста при изменении currentText
  useEffect(() => {
    setActiveText(currentText);
    reset();
  }, [currentText, reset]);

  // Сброс при смене режима или лимита времени
  const handleSelectMode = (newMode: TrainingMode) => {
    setMode(newMode);
    reset();
  };

  const handleSelectTimeLimit = (newLimit: TimeLimit) => {
    setTimeLimit(newLimit);
    setTimeLeft(newLimit);
    reset();
  };

  // Таймер обратного отсчета для режима НА ВРЕМЯ
  useEffect(() => {
    if (mode !== 'time' || status !== 'typing' || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setStatus('finished');
      }
    }, 250);

    return () => clearInterval(interval);
  }, [mode, status, startTime, timeLimit]);

  // Плавная автопрокрутка текста строго при переходе на новую строку (без рывков)
  useEffect(() => {
    if (activeCharRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const element = activeCharRef.current;
      const currentTop = element.offsetTop;

      if (lastLineTopRef.current === -1) {
        lastLineTopRef.current = currentTop;
        return;
      }

      // Прокручиваем только тогда, когда курсор действительно перешел на следующую строку
      if (currentTop !== lastLineTopRef.current) {
        lastLineTopRef.current = currentTop;
        const relativeTop = currentTop - container.offsetTop;
        if (relativeTop > 60) {
          container.scrollTo({
            top: Math.max(0, relativeTop - 36),
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentIndex]);

  // Расчет скорости (WPM)
  const calculateWPM = useCallback(() => {
    if (!startTime || currentIndex === 0) return 0;
    const timeElapsedSec = mode === 'time' && status === 'finished'
      ? timeLimit
      : Math.max(1, (Date.now() - startTime) / 1000);
    const timeElapsedMin = timeElapsedSec / 60;
    const wordsTyped = currentIndex / 5;
    return Math.round(wordsTyped / timeElapsedMin);
  }, [startTime, currentIndex, mode, status, timeLimit]);

  // Расчет точности (%)
  const calculateAccuracy = useCallback(() => {
    if (currentIndex === 0 && errors === 0) return 100;
    const totalKeystrokes = currentIndex + errors;
    if (totalKeystrokes === 0) return 100;
    return Math.round((currentIndex / totalKeystrokes) * 100);
  }, [currentIndex, errors]);

  // Расчет длительности (сек)
  const calculateDurationSec = useCallback(() => {
    if (!startTime) return 0;
    if (mode === 'time' && status === 'finished') return timeLimit;
    return Math.round((Date.now() - startTime) / 1000);
  }, [startTime, mode, status, timeLimit]);

  // Форматирование времени в мин:сек
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Обработка нажатий клавиш с поддержкой дефисов, непрерывного потока и автопродления
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

        // В режимах НА ВРЕМЯ и БЕСКОНЕЧНЫЙ: автопополнение текста при приближении к концу
        if (mode !== 'text' && typedCharsRef.current.length >= sampleText.length - 25) {
          const pool = STREAMING_SENTENCES[lang];
          const nextSentence = pool[nextSentenceIndexRef.current % pool.length];
          nextSentenceIndexRef.current += 1;
          setActiveText((prev) => (prev ? prev + " " + nextSentence : nextSentence));
        }

        // В стандартном режиме ТЕКСТ: проверка завершения
        if (mode === 'text' && typedCharsRef.current.length >= sampleText.length) {
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
  }, [status, sampleText, reset, mode, lang]);

  // Сохранение результатов в БД при завершении
  useEffect(() => {
    if (status !== "finished") return;

    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    const duration = calculateDurationSec();
    setFinalResult({ wpm, accuracy, duration });

    if (currentUser && wpm > 0) {
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

  // Запуск генерации через ИИ
  const handleGenerateAi = async () => {
    try {
      const text = await generateAiText({
        language: lang,
        topic: selectedTopic,
        length: selectedLength,
        difficulty: 'medium',
      });
      setActiveText(text);
      await fetchHistory(lang);
    } catch (err) {
      console.error(err);
    }
  };

  // Получение следующего случайного текста
  const handleNextRandom = async () => {
    const text = await fetchRandomText(lang);
    setActiveText(text);
  };

  // Отображение подсвеченного текста и курсора (стабильная ширина символов, без прыжков и скачков)
  const renderTextStream = () => {
    return sampleText.split("").map((char, index) => {
      const isTyped = index < currentIndex;
      const isActive = index === currentIndex;

      return (
        <span
          key={index}
          ref={isActive ? activeCharRef : undefined}
          className={`relative inline font-mono transition-colors duration-75 ${
            isTyped
              ? "text-gray-900 font-medium"
              : isActive
              ? "bg-[#FFD700] text-[#111111] font-medium rounded-xs shadow-xs"
              : "text-gray-300 font-medium"
          }`}
        >
          {char}
          {isActive && (
            <span className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[#D97706] rounded-full animate-pulse"></span>
          )}
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
              Практикуй слепую печать с умной генерацией текстов через ИИ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

      {/* Панель генератора текстов и выбора режимов тренировки */}
      <AiGeneratorBar
        mode={mode}
        onSelectMode={handleSelectMode}
        timeLimit={timeLimit}
        onSelectTimeLimit={handleSelectTimeLimit}
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

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-600">Внимание:</span>
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-amber-500 hover:text-amber-800 font-bold px-2 py-1 rounded-lg transition-colors text-xs"
          >
            ✕ Закрыть
          </button>
        </div>
      )}

      {/* Основная карточка тренажера */}
      <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-5 sm:p-8 md:p-12 flex flex-col gap-6 sm:gap-8 border border-gray-50">
        
        {/* Метки темы и текущего режима */}
        <div className="flex flex-wrap items-center justify-between gap-3 -mb-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-700">
              {mode === 'time' ? (
                <>
                  <Clock size={12} className="text-[#D97706]" />
                  <span>Режим: На время ({timeLimit}с)</span>
                </>
              ) : mode === 'endless' ? (
                <>
                  <InfinityIcon size={12} className="text-[#D97706]" />
                  <span>Режим: Бесконечный</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-[#D97706]" />
                  <span>Режим: Текст</span>
                </>
              )}
            </span>
            {currentTopic && (
              <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FFD700]/20 text-gray-900">
                Тема: {currentTopic}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {mode === 'endless' ? `Набрано: ${currentIndex} симв.` : `Символов: ${sampleText.length}`}
          </span>
        </div>

        {/* Панель статистики в реальном времени */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 sm:pb-6">
          <div className="flex gap-6 sm:gap-10">
            {/* Скорость WPM */}
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

            {/* Точность % */}
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

            {/* Время / Таймер обратного отсчета */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                {mode === 'time' ? (
                  <Clock size={20} className={timeLeft <= 5 && status === 'typing' ? "text-red-500 animate-bounce" : status === 'typing' ? "text-[#D97706]" : ""} />
                ) : mode === 'endless' ? (
                  <InfinityIcon size={20} className={status === 'typing' ? "text-[#D97706] animate-pulse" : ""} />
                ) : (
                  <Clock size={20} className={status === 'typing' ? "text-[#FFD700]" : ""} />
                )}
              </div>
              <div>
                <div className="text-gray-400 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  {mode === 'time' ? 'Осталось' : 'Время'}
                </div>
                <div className={`text-lg sm:text-2xl font-black ${mode === 'time' && timeLeft <= 5 && status === 'typing' ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                  {mode === 'time'
                    ? `${timeLeft}с`
                    : formatDuration(calculateDurationSec())}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Кнопка завершения сессии в бесконечном режиме */}
            {mode === 'endless' && status === 'typing' && (
              <button
                onClick={() => setStatus('finished')}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-xs sm:text-sm active:scale-95 shadow-sm"
                title="Зафиксировать результат и завершить"
              >
                <Square size={13} className="fill-current" />
                <span>Завершить</span>
              </button>
            )}

            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors text-xs sm:text-sm active:scale-95"
            >
              <RefreshCw size={16} />
              <span>Начать заново</span>
            </button>
          </div>
        </div>

        {/* Область набираемого текста со скроллом для бесконечных потоков */}
        <div
          ref={textContainerRef}
          className="text-xl sm:text-2xl md:text-3xl leading-[1.6] sm:leading-[1.7] font-mono select-none outline-none tracking-normal whitespace-pre-wrap break-words min-h-[72px] sm:min-h-[96px] max-h-[180px] sm:max-h-[220px] overflow-y-auto scroll-smooth pr-1"
          tabIndex={0}
          autoFocus
        >
          {isLoading || isGenerating ? (
            <div className="flex items-center gap-3 text-gray-700 text-base sm:text-lg font-medium animate-pulse">
              <Loader2 size={20} className="animate-spin text-[#FFD700]" />
              <span>Текст уже придумывается...</span>
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
                <h3 className="text-lg sm:text-xl font-bold">
                  {mode === 'time'
                    ? `Раунд на ${timeLimit} сек завершен! ⏱️`
                    : mode === 'endless'
                    ? `Бесконечная сессия завершена! ♾️`
                    : `Тренировка завершена! 🎉`}
                </h3>
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
    </div>
  );
}
