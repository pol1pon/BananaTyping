import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, RotateCcw, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { areCharsEqual } from "../utils/charMatching";

const keyboardRows = [
  ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
  ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
  ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", ".", "-", "␣"]
];

const SAMPLE_TEXTS = [
  "скоропечатание развивает моторику и память",
  "бананы заряжают энергией для быстрой печати",
  "слепая печать экономит сотни часов работы каждый год",
];

export function TrainerCard() {
  const [textIndex, setTextIndex] = useState(0);
  const sampleText = SAMPLE_TEXTS[textIndex];

  const [typedChars, setTypedChars] = useState("");
  const typedCharsRef = useRef("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentIndex = typedChars.length;
  const expectedChar = sampleText[currentIndex] || "";

  // Таймер тренировки
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Расчет скорости (WPM)
  const calculateWPM = useCallback(() => {
    if (!startTime || elapsedSec === 0) return 0;
    const words = currentIndex / 5;
    const minutes = elapsedSec / 60;
    return Math.max(0, Math.round(words / minutes));
  }, [startTime, elapsedSec, currentIndex]);

  // Расчет точности (%)
  const calculateAccuracy = useCallback(() => {
    if (currentIndex === 0 && errors === 0) return 100;
    const total = currentIndex + errors;
    if (total === 0) return 100;
    return Math.max(0, Math.round((currentIndex / total) * 100));
  }, [currentIndex, errors]);

  // Сброс и переход к тексту
  const handleReset = (next = false) => {
    setTypedChars("");
    typedCharsRef.current = "";
    setStartTime(null);
    setElapsedSec(0);
    setErrors(0);
    setIsFinished(false);
    setPressedKey(null);
    if (next) {
      setTextIndex((prev) => (prev + 1) % SAMPLE_TEXTS.length);
    }
    inputRef.current?.focus();
  };

  // Обработка символа (для физической и мобильной клавиатуры)
  const processKey = (char: string) => {
    if (isFinished) return;
    if (char.length !== 1 && char !== " ") return;

    // Подсветка нажатой клавиши на виртуальной клавиатуре
    const upperKey = char === " " ? "␣" : char.toUpperCase();
    setPressedKey(upperKey);
    setTimeout(() => setPressedKey(null), 150);

    // Старт таймера при первом нажатии
    if (!startTime) {
      setStartTime(Date.now());
    }

    const expected = sampleText[typedCharsRef.current.length];
    if (!expected) return;

    if (areCharsEqual(char, expected)) {
      const nextTyped = typedCharsRef.current + expected;
      typedCharsRef.current = nextTyped;
      setTypedChars(nextTyped);

      if (nextTyped.length >= sampleText.length) {
        setIsFinished(true);
      }
    } else {
      setErrors((prev) => prev + 1);
    }
  };

  // Обработка ввода с физической клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === "Escape") {
      handleReset();
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
    }

    processKey(e.key);
  };

  // Обработка ввода с мобильной клавиатуры
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val.length > 0) {
      const char = val[val.length - 1];
      processKey(char);
    }
    e.target.value = "";
  };

  // Форматирование времени
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Получаем букву для подсветки на клавиатуре
  const currentExpectedUpper = expectedChar === " " ? "␣" : expectedChar.toUpperCase();

  return (
    <div
      ref={containerRef}
      onClick={() => {
        setIsFocused(true);
        inputRef.current?.focus();
      }}
      className="bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6 md:p-7 flex flex-col justify-between border border-gray-100 hover:border-yellow-200 transition-all cursor-text relative h-full min-h-[460px]"
    >
      {/* Невидимый инпут для поддержки мобильного ввода и клавиатуры */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        value=""
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="opacity-0 absolute inset-0 w-full h-full pointer-events-none cursor-text z-10"
        style={{ fontSize: "16px" }}
        aria-label="Ввод текста для тренажера"
      />

      {/* Шапка статистики в реальном времени */}
      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base border-b border-gray-100 pb-3 sm:pb-4">
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
            Скорость
          </span>
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {calculateWPM()}{" "}
            <span className="text-gray-500 text-[10px] sm:text-xs">СЛ/МИН</span>
          </span>
        </div>
        <div className="w-px h-6 sm:h-8 bg-gray-200"></div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
            Точность
          </span>
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {calculateAccuracy()}%
          </span>
        </div>
        <div className="w-px h-6 sm:h-8 bg-gray-200"></div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5">
            Время
          </span>
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {formatTime(elapsedSec)}
          </span>
        </div>

        {/* Кнопка сброса / смены текста */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset(true);
          }}
          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-2"
          title="Сменить фразу"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Область интерактивного текста */}
      <div className="text-lg sm:text-2xl md:text-3xl leading-relaxed font-medium text-gray-400 min-h-[50px] sm:min-h-[64px] select-none">
        {isFinished ? (
          <div className="flex flex-col items-center justify-center py-2 text-center text-gray-900 animate-fadeIn">
            <div className="flex items-center gap-2 text-[#D97706] font-bold text-base sm:text-lg mb-1">
              <CheckCircle2 size={20} className="text-[#FFD700]" />
              <span>Отличный заезд!</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Скорость: <strong>{calculateWPM()} СЛ/МИН</strong> | Точность:{" "}
              <strong>{calculateAccuracy()}%</strong>
            </p>
          </div>
        ) : (
          sampleText.split("").map((char, index) => {
            const isTyped = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <span
                key={index}
                className={`relative inline font-mono transition-colors duration-75 ${
                  isTyped
                    ? "text-gray-900 font-semibold"
                    : isActive
                    ? "bg-[#FFD700] text-[#111111] font-semibold rounded-xs"
                    : "text-gray-300 font-semibold"
                }`}
              >
                {char}
                {isActive && (
                  <span className="absolute bottom-[-2px] left-0 w-full h-[2.5px] bg-[#D97706] rounded-full animate-pulse"></span>
                )}
              </span>
            );
          })
        )}
      </div>

      {/* Интерактивная подсветка клавиатуры */}
      <div className="flex flex-col gap-1.5 sm:gap-2 items-center bg-gray-50/90 p-3 sm:p-5 rounded-2xl w-full overflow-hidden select-none">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 sm:gap-1.5 w-full justify-center">
            {row.map((key) => {
              const isExpected = !isFinished && key === currentExpectedUpper;
              const isCurrentlyPressed = key === pressedKey;

              let keyBg = "bg-white shadow-xs border border-gray-100 text-gray-600";

              if (isCurrentlyPressed) {
                keyBg = "bg-[#FFD700] scale-95 shadow-md border-[#FACC15] text-[#111111] font-black";
              } else if (isExpected) {
                keyBg = "bg-[#FFD700]/40 border-2 border-[#FFD700] text-gray-900 font-black animate-pulse shadow-sm";
              }

              return (
                <div
                  key={key}
                  className={`${keyBg} flex-1 max-w-[38px] sm:max-w-[46px] h-7 sm:h-9 md:h-11 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs md:text-sm select-none transition-all duration-100`}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
        {/* Пробел */}
        <div className="flex gap-2 mt-1 w-full justify-center">
          <div
            className={`shadow-xs border w-36 sm:w-56 md:w-64 h-7 sm:h-9 md:h-11 rounded-md sm:rounded-lg transition-all flex items-center justify-center text-xs ${
              pressedKey === "␣"
                ? "bg-[#FFD700] scale-98 border-[#FACC15]"
                : expectedChar === " " && !isFinished
                ? "bg-[#FFD700]/40 border-2 border-[#FFD700] animate-pulse"
                : "bg-white border-gray-100 text-gray-400"
            }`}
          >
            {expectedChar === " " && !isFinished && (
              <span className="text-[10px] text-gray-500 font-bold uppercase">Пробел</span>
            )}
          </div>
        </div>
      </div>

      {/* Подвал виджета с подсказкой и ссылкой на тренировку */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-gray-500 font-medium">
            {isFinished
              ? "Заезд завершен!"
              : isFocused
              ? "Печатайте на клавиатуре прямо сейчас..."
              : "Нажмите сюда и начните печатать"}
          </span>
        </div>

        <Link
          to="/training"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-bold text-gray-900 hover:text-[#D97706] transition-colors"
        >
          <span>Полный режим</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
