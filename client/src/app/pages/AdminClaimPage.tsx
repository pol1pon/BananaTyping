import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import { useAuthStore } from "../stores/userStore";
import { BananaLogo } from "../components/BananaLogo";
import { UserAvatar } from "../components/UserAvatar";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Home,
  CheckCircle2,
  Key,
  LogIn,
  UserPlus,
  AlertTriangle,
} from "lucide-react";

export function AdminClaimPage() {
  const { secretKey } = useParams<{ secretKey: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, claimAdmin, isLoading } = useAuthStore();

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string>(secretKey || "");

  const effectiveKey = secretKey || manualKey;

  const handleClaim = async (keyToUse = effectiveKey) => {
    if (!keyToUse?.trim()) {
      setErrorMessage("Секретный ключ не указан");
      setStatus("error");
      return;
    }

    if (!currentUser) {
      return;
    }

    setStatus("processing");
    setErrorMessage(null);

    try {
      await claimAdmin(keyToUse.trim());
      setStatus("success");
    } catch (err: any) {
      console.error("Ошибка при подтверждении прав администратора:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Неверный секретный ключ или доступ заблокирован";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  // Автоматическая попытка активации при открытии ссылки авторизованным пользователем
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        setStatus("success");
      } else if (secretKey && status === "idle") {
        handleClaim(secretKey);
      }
    }
  }, [currentUser?.id, currentUser?.role, secretKey]);

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Фоновые градиенты */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFD700]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Верхняя навигация */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between z-10 py-2">
        <Link to="/" className="flex items-center gap-2 group">
          <BananaLogo size={32} />
          <span className="font-extrabold text-xl tracking-wide group-hover:text-[#FFD700] transition-colors">
            BananaTyping
          </span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Home size={16} />
          <span>На главную</span>
        </Link>
      </div>

      {/* Центральный блок */}
      <div className="max-w-xl mx-auto w-full my-auto z-10 py-8">
        <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Декоративная полоса сверху */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#FFD700] to-yellow-400" />

          {/* 1. Если пользователь не авторизован */}
          {!currentUser ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Key size={32} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black mb-3">
                Секретная ссылка доступа
              </h1>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-md mx-auto">
                Вы перешли по ссылке активации прав администратора BananaTyping. Для
                привязки роли администратора войдите в свой аккаунт или
                зарегистрируйтесь.
              </p>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl mb-8 flex items-center justify-center gap-2 text-xs font-mono text-gray-400 break-all">
                <Shield size={14} className="text-[#FFD700] shrink-0" />
                <span>Ключ: {secretKey || "Не указан"}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  className="flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold py-3 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-95"
                >
                  <LogIn size={16} />
                  <span>Войти в аккаунт</span>
                </Link>
                <Link
                  to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-6 rounded-2xl text-sm transition-all border border-white/10 active:scale-95"
                >
                  <UserPlus size={16} />
                  <span>Регистрация</span>
                </Link>
              </div>
            </div>
          ) : /* 2. Успешная активация или пользователь уже админ */
          currentUser.role === "admin" || status === "success" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <CheckCircle2 size={36} />
              </div>

              <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-4">
                <ShieldCheck size={14} />
                <span>Права подтверждены</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black mb-3">
                Вы — администратор!
              </h1>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Аккаунт{" "}
                <span className="font-bold text-white">@{currentUser.username}</span>{" "}
                обладает полными правами администратора BananaTyping.
              </p>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-8 flex items-center gap-3.5 text-left">
                <UserAvatar
                  avatar={currentUser.avatar}
                  username={currentUser.username}
                  size={46}
                  isAdmin
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                    {currentUser.username}
                    <span className="text-[10px] bg-[#FFD700] text-black px-1.5 py-0.5 rounded font-black">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/admin"
                  className="flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold py-3 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-95"
                >
                  <Shield size={16} />
                  <span>Панель администратора</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-6 rounded-2xl text-sm transition-all border border-white/10"
                >
                  <span>В профиль</span>
                </Link>
              </div>
            </div>
          ) : /* 3. Загрузка / процесс активации */
          status === "processing" || isLoading ? (
            <div className="text-center py-10">
              <Loader2
                size={40}
                className="animate-spin text-[#FFD700] mx-auto mb-4"
              />
              <h2 className="text-xl font-bold mb-2">Проверка секретного ключа...</h2>
              <p className="text-xs text-gray-400">
                Применяем права администратора к вашему аккаунту
              </p>
            </div>
          ) : (
            /* 4. Ошибка или ручной ввод ключа */
            <div className="py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} />
              </div>

              <h1 className="text-2xl font-black text-center mb-2">
                Активация прав администратора
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 text-center mb-6">
                Примените секретный ключ для аккаунта{" "}
                <span className="text-white font-semibold">@{currentUser.username}</span>
              </p>

              {errorMessage && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Секретный ключ администратора
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                      placeholder="Введите секретный ключ..."
                      className="w-full bg-white/5 border border-white/15 focus:border-[#FFD700] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors font-mono"
                    />
                    <Key
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!manualKey.trim() || isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-[#FACC15] disabled:opacity-50 text-[#111111] font-bold py-3 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>Активировать статус</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <Link
                  to="/profile"
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Вернуться в личный кабинет
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Футер */}
      <div className="max-w-2xl mx-auto w-full text-center text-xs text-gray-600 z-10 py-2">
        BananaTyping &copy; {new Date().getFullYear()} &bull; Безопасный доступ
      </div>
    </div>
  );
}
