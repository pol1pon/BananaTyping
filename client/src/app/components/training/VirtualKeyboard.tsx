import React from "react";
import { getKeyboardKeyForChar, isDashChar } from "../../utils/charMatching";

interface VirtualKeyboardProps {
  keyboardRows: string[][];
  expectedChar: string;
  wrongKey: string | null;
  isFinished: boolean;
}

export function VirtualKeyboard({
  keyboardRows,
  expectedChar,
  wrongKey,
  isFinished,
}: VirtualKeyboardProps) {
  // Нормализуем ожидаемый символ к раскладке клавиатуры (например, '—' -> '-')
  const activeKeyName = isFinished ? "" : getKeyboardKeyForChar(expectedChar);
  const isSpaceExpected = expectedChar === " " && !isFinished;

  // Нормализуем ошибочно нажатую клавишу (если нажат дефис/тире — подсвечиваем '-')
  const normalizedWrongKey = wrongKey && isDashChar(wrongKey) ? "-" : wrongKey;

  return (
    <div
      data-keyboard-container
      className="w-full flex flex-col gap-1 sm:gap-2 md:gap-2.5 items-center bg-gray-50/90 border border-gray-100 p-2.5 sm:p-5 md:p-7 rounded-[20px] sm:rounded-[24px] max-w-full overflow-x-auto"
    >
      {/* Ряды букв, цифр и знаков */}
      {keyboardRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5 sm:gap-1.5 md:gap-2 w-full justify-center max-w-full">
          {row.map((key) => {
            const isExpected = activeKeyName === key;
            const isWrong = normalizedWrongKey === key;

            let keyStyle =
              "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-gray-100 text-gray-500 font-medium";

            if (isExpected) {
              keyStyle =
                "bg-[#FFD700] shadow-[0_4px_12px_rgba(255,215,0,0.35)] border-[#FACC15] scale-[1.05] z-10 text-[#111111] font-black";
            } else if (isWrong) {
              keyStyle =
                "bg-red-500 shadow-md border-red-600 scale-95 z-10 text-white font-black animate-shake";
            }

            return (
              <div
                key={key}
                className={`${keyStyle} flex-1 min-w-[20px] max-w-[42px] sm:max-w-[50px] md:max-w-[56px] h-7 sm:h-9 md:h-12 rounded-md sm:rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs md:text-base select-none transition-all duration-150 ease-out`}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}

      {/* Клавиша пробела (Spacebar) */}
      <div className="flex gap-2 mt-0.5 sm:mt-1 w-full justify-center">
        <div
          className={`h-7 sm:h-9 md:h-12 w-32 sm:w-56 md:w-80 rounded-md sm:rounded-xl md:rounded-2xl transition-all duration-150 ease-out select-none border ${
            isSpaceExpected
              ? "bg-[#FFD700] border-[#FACC15] shadow-[0_4px_12px_rgba(255,215,0,0.35)] scale-[1.02]"
              : "bg-white border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
          }`}
        />
      </div>
    </div>
  );
}
