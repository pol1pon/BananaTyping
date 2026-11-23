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
  Square,
  Trophy,
  Smartphone,
  Keyboard
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
    "Бананы содержат много калия и витаминов для продуктивной работы мозга.",
    "Слепая печать позволяет быстро переносить любые мысли прямо на экран.",
    "Каждая минута практики приближает пальцы к автоматической печати без ошибок.",
    "Ритмичные движения и спокойствие помогают удерживать максимальную скорость.",
    "Красивый и чистый код пишется легче, когда не нужно смотреть на клавиатуру.",
    "Современные технологии открывают безграничные возможности для каждого человека.",
    "Терпение и регулярные тренировки превращают сложные задачи в простую привычку.",
    "Свежий банановый коктейль заряжает энергией на весь продуктивный рабочий день.",
    "В бесконечной Вселенной сияют миллиарды далеких звезд и неизведанных миров.",
    "Высокая точность всегда важнее спешки, потому что скорость приходит автоматически.",
    "Хороший программист ценит понятный код и элегантные архитектурные решения.",
    "Уверенность в каждом движении пальцев дает свободу полета творческой мысли.",
    "Искусственный интеллект помогает автоматизировать рутину и создавать смелые проекты.",
    "Глубокая концентрация и расслабленные плечи сохраняют силы при долгой работе.",
    "Мастерство слепого набора экономит сотни часов драгоценного времени каждый год."
  ],
  en: [
    "Bananas are rich in potassium and nutrients that boost cognitive function.",
    "Touch typing allows your fingers to move automatically while you focus on ideas.",
    "Every minute of practice brings you closer to effortless, error-free typing.",
    "Rhythm and steady breathing are the real secrets of world-class typing velocity.",
    "Writing clean code feels amazing when your fingers effortlessly hit every symbol.",
    "Modern technologies unlock unlimited potential for digital creators worldwide.",
    "Daily deliberate training turns challenging skills into your natural superpower.",
    "A fresh smoothie in the morning provides clean natural fuel for productive days.",
    "Looking up at distant stars reminds us how wondrous the universe truly is.",
    "Accuracy always leads to speed because smooth rhythm beats rushing every time.",
    "Great software developers value clarity, simplicity, and maintainable architecture.",
    "Mastering touch typing saves hundreds of valuable hours every single year."
  ]
};

export function Training() {
  const { currentUser, fetchUserResults } = useAuthStore();
  const { fetchLeaderboard } = useLeaderboardStore();
  const { 
    currentText, 
    currentTextId,
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

  // Ссылки для автопрокрутки и фокуса
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const trainerCardRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const lastLineTopRef = useRef<number>(-1);
  const hasAutoScrolledRef = useRef<boolean>(false);
  const [showMobileKeyboard, setShowMobileKeyboard] = useState<boolean>(false);
  const lastProcessedCharRef = useRef<{ char: string; time: number }>({ char: "", time: 0 });

  // Состояние набора текста
  const [typedChars, setTypedChars] = useState("");
  const typedCharsRef = useRef("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<'idle' | 'typing' | 'finished'>('idle');
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  // Финальные сохраненные результаты после завершения теста
  const [finalResult, setFinalResult] = useState<{ wpm: number; accuracy: number; duration: number } | null>(null);

  const sampleText = activeText || currentText || "";
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
    hasAutoScrolledRef.current = false;
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  }, [timeLimit]);

  // Первоначальная загрузка уникального текста
  useEffect(() => {
    fetchRandomText(lang, currentTextId || undefined);
    fetchHistory(lang);
  }, [lang, fetchRandomText, fetchHistory]);

  // Синхронизация активного текста при изменении currentText
  useEffect(() => {
    if (currentText) {
      setActiveText(currentText);
      reset();
    }
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

  // Функция плавного и точного переноса экрана к карточке тренажера
  const scrollToTrainer = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!trainerCardRef.current) return;
    const cardRect = trainerCardRef.current.getBoundingClientRect();
    const cardTop = cardRect.top + window.pageYOffset;
    // Позиционируем карточку с комфортным отступом 16px сверху:
    // статистика, набираемый текст и вся виртуальная клавиатура полностью помещаются в экран
    const targetScroll = Math.max(0, cardTop - 16);

    if (Math.abs(window.pageYOffset - targetScroll) > 16) {
      window.scrollTo({
        top: targetScroll,
        behavior
      });
    }
  }, []);

  // Перенос экрана к карточке тренажера при старте тренировки (ровно 1 раз за сессию, без рывков)
  useEffect(() => {
    if (status === 'typing') {
      if (!hasAutoScrolledRef.current) {
        hasAutoScrolledRef.current = true;
        scrollToTrainer("smooth");
      }
    } else if (status === 'idle') {
      hasAutoScrolledRef.current = false;
    }
  }, [status, scrollToTrainer]);

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

  // Обработка каждого введенного символа (работает идентично для десктопа и смартфонов)
  const processChar = useCallback((char: string) => {
    if (status === "finished" || isLoading || isGenerating || !sampleText) return;
    if (typedCharsRef.current.length >= sampleText.length) return;

    const now = Date.now();
    // Защита от дублирования ввода на некоторых мобильных браузерах (в пределах 30мс)
    if (
      lastProcessedCharRef.current.char === char &&
      now - lastProcessedCharRef.current.time < 30
    ) {
      return;
    }
    lastProcessedCharRef.current = { char, time: now };

    if (status === "idle") {
      setStatus("typing");
      setStartTime(now);
    }

    const currentExpected = sampleText[typedCharsRef.current.length] || "";

    // Отслеживание равенства символов (включая дефис/тире — и -)
    if (areCharsEqual(char, currentExpected)) {
      typedCharsRef.current += currentExpected;
      setTypedChars(typedCharsRef.current);
      setWrongKey(null);

      // В режимах НА ВРЕМЯ и БЕСКОНЕЧНЫЙ: автопополнение текста при приближении к концу
      if (mode !== 'text' && typedCharsRef.current.length >= sampleText.length - 25) {
        const pool = STREAMING_SENTENCES[lang];
        const nextSentence = pool[nextSentenceIndexRef.current % pool.length];
        nextSentenceIndexRef.current += 1;
        setActiveText((prev) => {
          if (!prev) return nextSentence;
          const trimmed = prev.trim();
          const separator = trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?') ? ' ' : '. ';
          return trimmed + separator + nextSentence;
        });
      }

      // В стандартном режиме ТЕКСТ: проверка завершения
      if (mode === 'text' && typedCharsRef.current.length >= sampleText.length) {
        setStatus("finished");
      }
    } else {
      setErrors((prev) => prev + 1);
      setWrongKey(isDashChar(char) ? "-" : char.toUpperCase());
      setTimeout(() => setWrongKey(null), 200);
    }
  }, [status, isLoading, isGenerating, sampleText, mode, lang]);

  // Слушатель физической клавиатуры компьютера
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем ввод, если фокус в реальном текстовом поле ввода (кроме нашего мобильного скрытого инпута)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.target !== mobileInputRef.current) return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        reset();
        return;
      }

      // Если нажат пробел:
      // Предотвращаем стандартное поведение браузера:
      // 1) скролл страницы вниз;
      // 2) вызов click на сфокусированной в DOM кнопке (например, «Начать заново», «Сгенерировать», «Случайный» и т.д.)
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
      }

      if (status === "finished" || isLoading || isGenerating || !sampleText) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Снимаем фокус с любых кнопок интерфейса при наборе текста, чтобы повторные клавиши не активировали их
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== mobileInputRef.current &&
        document.activeElement !== document.body
      ) {
        document.activeElement.blur();
      }

      if (e.key.length === 1) {
        processChar(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, sampleText, reset, processChar, isLoading, isGenerating]);

  // Обработка ввода с экранной клавиатуры мобильного устройства
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val.length > 0) {
      const char = val[val.length - 1];
      processChar(char);
    }
    e.target.value = "";
  };

  // Вызов нативной клавиатуры телефона по клику на область текста или тренажер
  const focusMobileInput = useCallback(() => {
    scrollToTrainer("smooth");
    if (mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [scrollToTrainer]);

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
        length: mode === 'endless' ? 'long' : selectedLength,
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
    try {
      const text = await fetchRandomText(lang, currentTextId || undefined);
      setActiveText(text);
    } catch (err) {
      console.error(err);
    }
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
      {/* Навигационная панель страницы (плавно затухает при наборе текста) */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 transition-opacity duration-300 ${
        status === 'typing' 
          ? 'opacity-25 hover:opacity-100' 
          : 'opacity-100'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 shrink-0"
            title="На главную"
          >
            <ArrowLeft size={18} />
          </Link>
          <Link
            to="/leaderboard"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-yellow-50 transition-colors text-[#D97706] shrink-0"
            title="Топ игроков по WPM"
          >
            <Trophy size={18} />
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

      {/* Панель генератора текстов и выбора режимов тренировки (плавно затухает во время печати) */}
      <div className={`transition-opacity duration-300 mb-6 ${
        status === 'typing' 
          ? 'opacity-25 hover:opacity-100' 
          : 'opacity-100'
      }`}>
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
      </div>

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
      <div
        ref={trainerCardRef}
        onClick={() => scrollToTrainer("smooth")}
        className={`bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-7 md:p-9 flex flex-col gap-5 sm:gap-7 transition-all duration-300 border ${
          status === 'typing'
            ? 'shadow-[0_16px_48px_rgba(255,215,0,0.22)] border-amber-300 ring-4 ring-[#FFD700]/30'
            : 'shadow-[0_8px_32px_rgba(0,0,0,0.06)] border-gray-100'
        }`}
      >
        
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
            {status === 'typing' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#FFD700] text-[#111111] animate-pulse shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>
                <span>Фокус</span>
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
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStatus('finished');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-xs sm:text-sm active:scale-95 shadow-sm"
                title="Зафиксировать результат и завершить"
              >
                <Square size={13} className="fill-current" />
                <span>Завершить</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                reset();
              }}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors text-xs sm:text-sm active:scale-95"
            >
              <RefreshCw size={16} />
              <span>Начать заново</span>
            </button>
          </div>
        </div>

        {/* Мобильная подсказка для вызова экранной клавиатуры */}
        {status === 'idle' && (
          <div 
            onClick={focusMobileInput}
            className="md:hidden flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[#D97706] text-xs font-bold cursor-pointer active:scale-95 transition-transform -mt-1 shadow-2xs"
          >
            <Smartphone size={14} />
            <span>Нажми сюда, чтобы открыть клавиатуру телефона</span>
          </div>
        )}

        {/* Область набираемого текста */}
        <div
          ref={textContainerRef}
          onClick={focusMobileInput}
          className={`relative text-xl sm:text-2xl md:text-3xl leading-[1.6] sm:leading-[1.7] font-mono select-none outline-none tracking-normal whitespace-pre-wrap break-words min-h-[76px] sm:min-h-[96px] max-h-[170px] sm:max-h-[210px] overflow-y-auto scroll-smooth pr-1.5 transition-all duration-300 rounded-2xl p-2.5 sm:p-3.5 -mx-2.5 sm:-mx-3.5 cursor-text ${
            status === 'typing'
              ? 'bg-amber-50/40 ring-1 ring-amber-200/60'
              : 'hover:bg-gray-50/60'
          }`}
          tabIndex={0}
        >
          {/* Скрытый инпут для вызова нативной клавиатуры на мобильных устройствах */}
          <input
            ref={mobileInputRef}
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            tabIndex={-1}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-text z-10"
            style={{ fontSize: "16px" }}
            value=""
            onChange={handleMobileInputChange}
          />

          {isLoading || isGenerating || !sampleText ? (
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
                {currentUser ? (
                  <span> Результат сохранен в <Link to="/leaderboard" className="underline font-bold text-green-800 hover:text-green-950">лидерборд</Link>!</span>
                ) : (
                  <span> <Link to="/login" className="underline font-bold text-green-800 hover:text-green-950">Авторизуйся</Link>, чтобы сохранять результаты в профиль.</span>
                )}
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

        {/* Кнопка переключения клавиатуры-подсказки для мобильных экранов */}
        <div className="md:hidden flex justify-center -my-1">
          <button
            type="button"
            onClick={() => setShowMobileKeyboard(!showMobileKeyboard)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shadow-2xs"
          >
            <Keyboard size={13} className="text-[#D97706]" />
            <span>{showMobileKeyboard ? "Скрыть подсказку клавиш" : "Показать подсказку клавиш"}</span>
          </button>
        </div>

        {/* Виртуальная клавиатура: на смартфонах скрыта по умолчанию, на десктопе всегда видна */}
        <div className={`${showMobileKeyboard ? "block" : "hidden md:block"} w-full transition-all`}>
          <VirtualKeyboard
            keyboardRows={KEYBOARDS[lang]}
            expectedChar={expectedChar}
            wrongKey={wrongKey}
            isFinished={status === "finished"}
          />
        </div>

        <div className="text-center text-gray-400 text-xs sm:text-sm font-medium -mt-2">
          Печатай текст на клавиатуре (дефис и тире распознаются клавишей <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 text-gray-700 font-mono">-</kbd>). 
          Нажми <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 text-gray-700 font-sans mx-1">Esc</kbd> для сброса.
        </div>
      </div>
    </div>
  );
}
