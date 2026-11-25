import React, { useEffect, useRef, useState } from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  username?: string;
  durationSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({
  isOpen,
  username,
  durationSeconds = 5,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onConfirmRef = useRef(onConfirm);
  const onCancelRef = useRef(onCancel);

  onConfirmRef.current = onConfirm;
  onCancelRef.current = onCancel;

  // Сброс и запуск таймера обратного отсчёта при открытии модалки
  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(durationSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, durationSeconds]);

  // Вызываем onConfirm отдельно от updater-функции setState, чтобы не триггерить warning React
  useEffect(() => {
    if (isOpen && secondsLeft === 0) {
      onConfirmRef.current();
    }
  }, [isOpen, secondsLeft]);

  // Закрытие по клавише Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancelRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsLeft / durationSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#18181B] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Верхняя полоса прогресса таймера */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-[#FFD700] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Закрыть окно"
        >
          <X size={18} />
        </button>

        {/* Круговой таймер + иконка */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative w-20 h-20 flex items-center justify-center mb-4">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="5"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#EF4444"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white leading-none tabular-nums">
                {secondsLeft}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                сек
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold mb-3">
            <AlertTriangle size={12} />
            <span>Подтверждение выхода</span>
          </div>

          <h2 id="logout-modal-title" className="text-xl sm:text-2xl font-black text-white mb-2">
            Выйти из профиля?
          </h2>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xs mb-6">
            {username ? (
              <>
                Аккаунт <span className="text-white font-bold">@{username}</span> будет отключён.{" "}
              </>
            ) : null}
            Автоматический выход произойдёт через{" "}
            <span className="text-[#FFD700] font-bold tabular-nums">{secondsLeft}</span>{" "}
            {secondsLeft === 1 ? "секунду" : secondsLeft >= 2 && secondsLeft <= 4 ? "секунды" : "секунд"}.
          </p>

          {/* Кнопки действий */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="order-2 sm:order-1 w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-colors active:scale-95"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="order-1 sm:order-2 w-full py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              <LogOut size={16} />
              <span>Выйти сейчас</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
