import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../stores/userStore";
import { BananaLogo } from "../components/BananaLogo";
import { usePageMeta } from "../hooks/usePageMeta";

export function Login() {
  usePageMeta({
    title: "Вход — BananaTyping",
    noIndex: true,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate(redirectUrl);
    } catch (err) {
      console.error("Ошибка входа", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Фоновые декоративные свечения */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFD700]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 sm:mb-8 text-gray-900 hover:opacity-85 transition-opacity group">
          <div className="transition-transform group-hover:rotate-12 duration-200">
            <BananaLogo size={32} />
          </div>
          <span className="font-black text-xl sm:text-2xl tracking-wide text-[#111111]">BananaTyping</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] mb-2">С возвращением!</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          Войди в аккаунт, чтобы продолжить тренировки и сохранять прогресс.
        </p>

        {/* Блок ошибки */}
        {error && (
          <div className="mb-5 p-3.5 sm:p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError();
              }}
              placeholder="Email адрес"
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700] text-sm sm:text-base font-medium"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="Пароль"
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700] text-sm sm:text-base font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFD700] hover:bg-[#FACC15] disabled:bg-[#facc15]/50 disabled:cursor-not-allowed text-[#111111] font-black py-3.5 sm:py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_24px_rgba(255,215,0,0.5)] text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>ВХОД...</span>
              </>
            ) : (
              <>
                <span>ВОЙТИ</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 font-medium">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-[#111111] font-bold hover:text-[#D97706] transition-colors underline decoration-yellow-400">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
