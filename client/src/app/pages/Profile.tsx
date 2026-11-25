import React, { useEffect, useState, useRef, useMemo } from "react";
import { Navigate, Link } from "react-router";
import { useAuthStore } from "../stores/userStore";
import {
  Trophy,
  Target,
  Zap,
  Clock,
  Hourglass,
  Home,
  LogOut,
  Edit3,
  ShieldCheck,
  Check,
  Key,
  Copy,
  Upload,
  X,
  Shield,
  BarChart3,
  History,
  Settings,
  Keyboard,
  Crown,
  Flame,
  Camera,
  Calendar,
  Lock,
  Globe,
} from "lucide-react";
import { UserAvatar, AVATAR_PRESETS } from "../components/UserAvatar";
import { BananaLogo } from "../components/BananaLogo";
import { ProfileStatsSection } from "../components/profile/ProfileStatsSection";
import { LogoutConfirmModal } from "../components/profile/LogoutConfirmModal";
import { calculateAdvancedStats } from "../utils/typingStats";

type ProfileTab = "analytics" | "history" | "settings";
type HistoryLangFilter = "all" | "ru" | "en";
type HistorySort = "newest" | "wpm" | "accuracy";

const MODE_LABELS: Record<string, string> = {
  text: "Текст",
  time: "На время",
  endless: "Бесконечный",
  quick: "Быстрый старт",
};

export function Profile() {
  const {
    currentUser,
    recentResults,
    fetchUserResults,
    fetchCurrentUser,
    updateProfile,
    claimAdmin,
    logout,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>("analytics");

  // Редактирование профиля
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Фильтры истории заездов
  const [langFilter, setLangFilter] = useState<HistoryLangFilter>("all");
  const [historySort, setHistorySort] = useState<HistorySort>("newest");
  const [visibleCount, setVisibleCount] = useState(12);

  // Секретный ключ администратора
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [adminClaimMsg, setAdminClaimMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCurrentUser();
      fetchUserResults(currentUser.id);
    }
  }, [currentUser?.id, fetchCurrentUser, fetchUserResults]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setSelectedAvatar(currentUser.avatar || "banana-classic");
    }
  }, [currentUser?.id, currentUser?.username, currentUser?.bio, currentUser?.avatar]);

  const stats = useMemo(() => calculateAdvancedStats(recentResults), [recentResults]);

  const filteredHistory = useMemo(() => {
    let list = [...(recentResults || [])];

    if (langFilter !== "all") {
      list = list.filter((r) => r.language === langFilter);
    }

    if (historySort === "wpm") {
      list.sort((a, b) => b.wpm - a.wpm);
    } else if (historySort === "accuracy") {
      list.sort((a, b) => b.accuracy - a.accuracy || b.wpm - a.wpm);
    } else {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb !== ta ? tb - ta : Number(b.id) - Number(a.id);
      });
    }

    return list;
  }, [recentResults, langFilter, historySort]);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = currentUser.role === "admin";
  const secretAdminUrl = `${window.location.origin}/admin/claim/banana_secret_admin_2026`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Размер файла не должен превышать 5 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Сжимаем аватар до 256x256, чтобы он быстро грузился в топе и не перегружал ответы API
      const img = new Image();
      img.onload = () => {
        try {
          const targetSize = 256;
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setSelectedAvatar(compressed);
            setSaveError(null);
            return;
          }
        } catch {
          // fallback к оригиналу
        }
        setSelectedAvatar(dataUrl);
        setSaveError(null);
      };
      img.onerror = () => {
        setSelectedAvatar(dataUrl);
        setSaveError(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar || undefined,
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });

      setSaveSuccess(true);
      setNewPassword("");
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err?.message || "Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKeyInput.trim()) return;

    setIsClaimingAdmin(true);
    setAdminClaimMsg(null);

    try {
      await claimAdmin(secretKeyInput.trim());
      setAdminClaimMsg({ text: "Права Администратора успешно активированы! 👑", success: true });
      setSecretKeyInput("");
    } catch (err: any) {
      setAdminClaimMsg({
        text: err?.message || "Неверный секретный ключ администратора",
        success: false,
      });
    } finally {
      setIsClaimingAdmin(false);
    }
  };

  const copyAdminLink = () => {
    navigator.clipboard.writeText(secretAdminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTogglePrivacy = async () => {
    setIsUpdatingPrivacy(true);
    setPrivacyMsg(null);
    const nextValue = !Boolean(currentUser.isPrivate);
    try {
      await updateProfile({ isPrivate: nextValue });
      setPrivacyMsg(
        nextValue
          ? "Профиль теперь приватный — другие игроки не увидят вашу статистику"
          : "Профиль открыт — другие игроки могут просматривать вашу статистику"
      );
      setTimeout(() => setPrivacyMsg(null), 4000);
    } catch (err: any) {
      setPrivacyMsg(err?.message || "Не удалось обновить приватность");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white relative overflow-hidden">
      {/* Фоновое свечение */}
      <div className="absolute top-[-15%] left-[10%] w-[45%] h-[35%] bg-[#FFD700]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[30%] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 relative z-10 min-w-0">
        {/* Верхняя навигационная панель */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="transition-transform group-hover:scale-105 group-hover:-rotate-3 duration-200">
              <BananaLogo size={32} />
            </div>
            <span className="font-extrabold text-xl tracking-wide text-white group-hover:text-[#FFD700] transition-colors">
              BananaTyping
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Link
              to="/training"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] rounded-xl font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-sm"
            >
              <Keyboard size={15} />
              <span>Тренажёр</span>
            </Link>

            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-[#222227] text-gray-200 rounded-xl border border-white/10 transition-colors font-medium text-xs sm:text-sm"
            >
              <Trophy size={15} className="text-[#FFD700]" />
              <span className="hidden sm:inline">Топ игроков</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] rounded-xl border border-[#FFD700]/30 transition-colors font-bold text-xs sm:text-sm"
              >
                <Shield size={15} />
                <span>Админ</span>
              </Link>
            )}

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-[#222227] text-gray-200 rounded-xl border border-white/10 transition-colors font-medium text-xs sm:text-sm"
            >
              <Home size={15} />
              <span className="hidden sm:inline">На главную</span>
            </Link>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors font-medium text-xs sm:text-sm active:scale-95"
              title="Выйти из аккаунта"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </header>

        {/* Hero-карточка профиля пользователя */}
        <section className="bg-gradient-to-br from-[#1B1B20] via-[#17171B] to-[#131317] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)] relative overflow-hidden mb-6">
          {/* Мягкое бесшовное свечение вместо резкой полосы */}
          <div className="absolute -top-24 -left-16 w-80 h-80 bg-[#FFD700]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-10 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#FFD700]/45 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Левая часть: Аватар + имя + ранг + био */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="relative group shrink-0 rounded-full focus:outline-none"
                title="Изменить аватар"
              >
                <div className="absolute -inset-2 rounded-full bg-[#FFD700]/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <UserAvatar
                  avatar={currentUser.avatar}
                  username={currentUser.username}
                  size={104}
                  isAdmin={isAdmin}
                  showAdminBadge={true}
                  className="relative shadow-[0_0_32px_rgba(255,215,0,0.22)] border-2 border-[#FFD700] ring-4 ring-[#FFD700]/20"
                />
                <div className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={22} className="text-[#FFD700]" />
                </div>
              </button>

              <div className="flex flex-col items-center sm:items-start max-w-xl w-full min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5 max-w-full">
                  <h1 className="text-2xl sm:text-3xl font-black text-white break-words max-w-full">
                    {currentUser.username}
                  </h1>
                  {isAdmin && (
                    <span className="bg-[#FFD700] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                      <Shield size={11} /> ADMIN
                    </span>
                  )}
                  <span className="bg-white/10 text-amber-300 border border-white/10 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {stats.rank.emoji} {stats.rank.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 transition-colors ${
                      currentUser.isPrivate
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                    }`}
                    title="Изменить настройки приватности"
                  >
                    {currentUser.isPrivate ? <Lock size={11} /> : <Globe size={11} />}
                    <span>{currentUser.isPrivate ? "Приватный" : "Публичный"}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400 mb-3 max-w-full">
                  <span className="break-all">{currentUser.email}</span>
                  {currentUser.createdAt && (
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Calendar size={12} />
                      С нами с{" "}
                      {new Date(currentUser.createdAt).toLocaleDateString("ru-RU", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {currentUser.bio ? (
                  <p className="text-sm text-gray-300 leading-relaxed bg-[#111111]/70 px-4 py-2.5 rounded-2xl border border-white/5 mb-3 max-w-lg w-full break-words">
                    {currentUser.bio}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="text-xs text-gray-500 hover:text-[#FFD700] italic mb-3 transition-colors"
                  >
                    + Добавить описание профиля...
                  </button>
                )}

                {/* Прогресс-бар до следующего ранга */}
                <div className="w-full max-w-sm">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-400 font-medium">
                      {stats.rank.nextTitle
                        ? `До ранга «${stats.rank.nextTitle}»`
                        : "Максимальный ранг достигнут!"}
                    </span>
                    <span className="text-[#FFD700] font-bold">
                      {stats.rank.nextWpm
                        ? `${stats.bestWpm} / ${stats.rank.nextWpm} WPM`
                        : `${stats.bestWpm} WPM`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#FFD700] rounded-full transition-all duration-500"
                      style={{ width: `${stats.rank.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Правая часть: Быстрые метрики и кнопка редактирования */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3.5 shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full sm:w-auto">
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl px-2.5 sm:px-3.5 py-2.5 text-center min-w-0 sm:min-w-[84px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Заездов</div>
                  <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">{stats.totalRuns}</div>
                </div>
                <div className="bg-gradient-to-b from-[#FFD700]/15 to-white/[0.03] backdrop-blur-sm border border-[#FFD700]/30 rounded-2xl px-2.5 sm:px-3.5 py-2.5 text-center min-w-0 sm:min-w-[84px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Рекорд</div>
                  <div className="text-lg sm:text-xl font-black text-[#FFD700] mt-0.5 tabular-nums">{stats.bestWpm}</div>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl px-2.5 sm:px-3.5 py-2.5 text-center min-w-0 sm:min-w-[84px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1">
                    <Flame size={10} className="text-amber-400" /> Серия
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5 tabular-nums">{stats.streakDays}д</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "settings" ? "analytics" : "settings")}
                className="flex items-center justify-center gap-2 py-2.5 px-5 bg-white/[0.08] hover:bg-[#FFD700] hover:text-[#111111] text-white rounded-2xl text-xs sm:text-sm font-bold border border-white/15 hover:border-[#FFD700] transition-all active:scale-95 shadow-sm"
              >
                <Edit3 size={15} />
                <span>
                  {activeTab === "settings" ? "К статистике" : "Редактировать профиль"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Навигация по вкладкам профиля + быстрая ссылка на публичный вид */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#18181B]/90 p-1.5 rounded-2xl border border-white/10 w-full sm:w-fit shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "analytics"
                  ? "bg-[#FFD700] text-[#111111] shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 size={16} />
              <span>Статистика</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-[#FFD700] text-[#111111] shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <History size={16} />
              <span>История ({recentResults.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-[#FFD700] text-[#111111] shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={16} />
              <span>Настройки</span>
            </button>
          </div>

          <Link
            to={`/player/${currentUser.id}`}
            className="inline-flex items-center justify-center sm:justify-end gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#FFD700] transition-colors px-2 py-1"
          >
            <span>Как меня видят другие игроки</span>
            <span>→</span>
          </Link>
        </div>

        {/* ВКЛАДКА 1: ПРОДВИНУТАЯ СТАТИСТИКА И АНАЛИТИКА */}
        {activeTab === "analytics" && <ProfileStatsSection results={recentResults} />}

        {/* ВКЛАДКА 2: ИСТОРИЯ ЗАЕЗДОВ */}
        {activeTab === "history" && (
          <section className="flex flex-col gap-4">
            <div className="bg-[#18181B] rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Язык:
                </span>
                <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 text-xs font-bold">
                  {(["all", "ru", "en"] as HistoryLangFilter[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLangFilter(l)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        langFilter === l
                          ? "bg-[#FFD700] text-[#111111]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {l === "all" ? "Все" : l === "ru" ? "РУС" : "ENG"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Сортировка:
                </span>
                <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setHistorySort("newest")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      historySort === "newest"
                        ? "bg-white/15 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Сначала новые
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySort("wpm")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      historySort === "wpm"
                        ? "bg-white/15 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Лучшая скорость
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySort("accuracy")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      historySort === "accuracy"
                        ? "bg-white/15 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Точность
                  </button>
                </div>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="bg-[#18181B] rounded-3xl p-10 border border-white/10 text-center text-gray-400 text-sm">
                Нет заездов по выбранному фильтру.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {filteredHistory.slice(0, visibleCount).map((result) => {
                    const isPersonalBest = stats.bestResultId === result.id;
                    return (
                      <div
                        key={result.id}
                        className={`bg-[#18181B] rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group ${
                          isPersonalBest
                            ? "border-[#FFD700]/50 shadow-[0_0_24px_rgba(255,215,0,0.08)]"
                            : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-4 sm:gap-7">
                          <div className="flex items-center gap-2 min-w-[115px]">
                            {isPersonalBest && (
                              <span
                                className="w-7 h-7 rounded-xl bg-[#FFD700] text-black flex items-center justify-center shrink-0 shadow-sm"
                                title="Личный рекорд скорости!"
                              >
                                <Crown size={14} />
                              </span>
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                {result.language && (
                                  <span className="font-bold text-[11px] bg-[#111111] px-2 py-0.5 rounded-md border border-white/10 text-gray-200">
                                    {result.language === "ru" ? "РУС" : "ENG"}
                                  </span>
                                )}
                                <span className="text-[11px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                                  {result.mode ? MODE_LABELS[result.mode] || result.mode : "Тренировка"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Zap size={11} className="text-[#FFD700]" /> Скорость
                            </span>
                            <div className="font-black text-xl sm:text-2xl text-white">
                              {result.wpm}{" "}
                              <span className="text-xs font-medium text-gray-500">WPM</span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Target size={11} className="text-emerald-400" /> Точность
                            </span>
                            <div
                              className={`font-black text-xl sm:text-2xl ${
                                result.accuracy >= 96
                                  ? "text-emerald-400"
                                  : result.accuracy >= 90
                                  ? "text-[#FFD700]"
                                  : "text-rose-400"
                              }`}
                            >
                              {result.accuracy}%
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Hourglass size={11} className="text-blue-400" /> Время
                            </span>
                            <div className="font-bold text-base sm:text-lg text-gray-200">
                              {result.duration_sec}{" "}
                              <span className="text-xs font-medium text-gray-500">сек</span>
                            </div>
                          </div>

                          {typeof result.characters === "number" && result.characters > 0 && (
                            <div className="hidden md:flex flex-col">
                              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                Символы / Ошибки
                              </span>
                              <div className="text-sm font-semibold text-gray-300">
                                {result.characters} /{" "}
                                <span className="text-rose-400">{result.errors ?? 0}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium bg-[#111111] px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-center shrink-0">
                          <Clock size={13} />
                          <span>
                            {result.createdAt
                              ? new Date(result.createdAt).toLocaleString("ru-RU", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Недавно"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleCount < filteredHistory.length && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="px-6 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#222227] border border-white/10 text-xs sm:text-sm font-bold text-[#FFD700] transition-colors"
                    >
                      Показать ещё ({filteredHistory.length - visibleCount})
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ВКЛАДКА 3: РЕДАКТИРОВАНИЕ ПРОФИЛЯ И СЕКРЕТНЫЙ ДОСТУП */}
        {activeTab === "settings" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Форма редактирования профиля */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#1B1B20] to-[#141418] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between gap-2.5 mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Edit3 size={20} className="text-[#FFD700]" />
                  <h2 className="text-xl font-bold">Редактирование профиля</h2>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
                  Изменения применяются сразу
                </span>
              </div>

              {/* Живое предпросмотр-превью профиля */}
              <div className="mb-6 p-4 rounded-2xl bg-[#111114] border border-white/10 flex items-center gap-4">
                <UserAvatar
                  avatar={selectedAvatar}
                  username={username || currentUser.username}
                  size={56}
                  isAdmin={isAdmin}
                  showAdminBadge={true}
                  className="border-2 border-[#FFD700]/70 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white truncate">
                      {username.trim() || currentUser.username}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300">
                      Предпросмотр
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {bio.trim() || "Ваше описание профиля появится здесь..."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                {/* Выбор аватара */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Выберите аватар
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = selectedAvatar === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedAvatar(preset.id)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                            isSelected
                              ? "border-[#FFD700] bg-[#FFD700]/10 scale-[1.03] shadow-md"
                              : "border-white/10 bg-[#111111] hover:border-white/25"
                          }`}
                        >
                          <UserAvatar avatar={preset.id} size={42} />
                          <span className="text-[11px] text-gray-300 font-medium truncate w-full text-center">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Загрузка своей картинки */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/15 transition-colors"
                    >
                      <Upload size={14} className="text-[#FFD700]" />
                      <span>Загрузить своё фото (до 5 МБ)</span>
                    </button>

                    {selectedAvatar && selectedAvatar.startsWith("data:image") && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <Check size={14} />
                        <span>Своя картинка выбрана</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Имя пользователя */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={2}
                    maxLength={32}
                    className="w-full bg-[#111111] text-white text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-[#FFD700] focus:outline-none transition-colors"
                    placeholder="Ваш никнейм"
                  />
                </div>

                {/* Описание / Био */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>О себе (описание профиля)</span>
                    <span className="text-gray-500 font-normal">{bio.length}/250</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 250))}
                    rows={3}
                    className="w-full bg-[#111111] text-white text-sm p-4 rounded-xl border border-white/10 focus:border-[#FFD700] focus:outline-none transition-colors resize-none leading-relaxed"
                    placeholder="Расскажите о себе, любимой клавиатуре или вашей цели скорости..."
                  />
                </div>

                {/* Смена пароля */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Новый пароль (оставьте пустым, если не меняете)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    className="w-full bg-[#111111] text-white text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-[#FFD700] focus:outline-none transition-colors"
                    placeholder="Минимум 6 символов"
                  />
                </div>

                {saveError && (
                  <div className="bg-red-500/10 text-red-400 text-xs p-3.5 rounded-xl border border-red-500/30">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="bg-emerald-500/10 text-emerald-400 text-xs p-3.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                    <Check size={16} />
                    <span>Профиль успешно сохранён!</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !username.trim()}
                    className="bg-[#FFD700] hover:bg-[#FACC15] disabled:opacity-50 text-[#111111] font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    {isSaving ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </div>
              </form>
            </div>

            {/* Боковая колонка: Приватность + Секретный доступ администратора */}
            <div className="flex flex-col gap-6">
              {/* Карточка приватности профиля */}
              <div className="bg-[#18181B] rounded-3xl p-6 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {currentUser.isPrivate ? (
                      <Lock size={18} className="text-[#FFD700]" />
                    ) : (
                      <Globe size={18} className="text-emerald-400" />
                    )}
                    <h3 className="font-bold text-base text-white">Приватность профиля</h3>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(currentUser.isPrivate)}
                    disabled={isUpdatingPrivacy}
                    onClick={handleTogglePrivacy}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      currentUser.isPrivate ? "bg-[#FFD700]" : "bg-white/15"
                    }`}
                    aria-label="Переключить приватность профиля"
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#111111] shadow-md transition duration-200 ease-in-out ${
                        currentUser.isPrivate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {currentUser.isPrivate
                    ? "Сейчас ваш профиль скрыт. При переходе по вашему нику или аватарке из топа игроков статистика, история заездов и описание будут недоступны другим пользователям."
                    : "Сейчас ваш профиль открыт. Игроки из таблицы лидеров могут нажать на вашу аватарку или имя и посмотреть вашу статистику и достижения."}
                </p>

                <div className="flex items-center justify-between text-[11px] bg-[#111111] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-gray-400">Статус:</span>
                  <span
                    className={`font-bold ${
                      currentUser.isPrivate ? "text-[#FFD700]" : "text-emerald-400"
                    }`}
                  >
                    {isUpdatingPrivacy
                      ? "Сохранение..."
                      : currentUser.isPrivate
                      ? "Приватный профиль 🔒"
                      : "Публичный профиль 🌐"}
                  </span>
                </div>

                {privacyMsg && (
                  <p className="mt-2.5 text-[11px] text-[#FFD700] leading-snug">
                    {privacyMsg}
                  </p>
                )}
              </div>

              {/* Карточка: Секретный доступ администратора */}
              <div className="bg-[#18181B] rounded-3xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Key size={18} className="text-[#FFD700]" />
                <h3 className="font-bold text-base text-white">
                  {isAdmin ? "Доступ администратора" : "Права администратора"}
                </h3>
              </div>

              {isAdmin ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-3 text-xs text-[#FFD700] flex items-center gap-2">
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>У вас активны полные права администратора сайта.</span>
                  </div>

                  <p className="text-gray-400 text-xs leading-relaxed">
                    Секретная ссылка для передачи прав другим доверенным администраторам:
                  </p>

                  <div className="flex items-center gap-2 bg-[#111111] p-2 rounded-xl border border-white/10">
                    <input
                      type="text"
                      readOnly
                      value={secretAdminUrl}
                      className="bg-transparent text-gray-300 text-xs w-full focus:outline-none select-all truncate px-1"
                    />
                    <button
                      type="button"
                      onClick={copyAdminLink}
                      className="shrink-0 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="Скопировать секретную ссылку"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  {copiedLink && (
                    <span className="text-emerald-400 text-[11px]">
                      Ссылка скопирована в буфер обмена!
                    </span>
                  )}

                  <Link
                    to="/admin"
                    className="w-full text-center mt-1 py-2.5 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-xs rounded-xl transition-all"
                  >
                    Открыть админ-панель
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleClaimAdmin} className="flex flex-col gap-3">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Введите секретный ключ или перейдите по секретной ссылке администратора:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Секретный ключ..."
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      className="bg-[#111111] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:border-[#FFD700] focus:outline-none w-full font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isClaimingAdmin || !secretKeyInput.trim()}
                      className="shrink-0 bg-[#FFD700] hover:bg-[#FACC15] disabled:opacity-50 text-[#111111] font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {isClaimingAdmin ? "..." : "Активировать"}
                    </button>
                  </div>

                  {adminClaimMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        adminClaimMsg.success
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {adminClaimMsg.success ? <Check size={14} /> : <X size={14} />}
                      <span>{adminClaimMsg.text}</span>
                    </div>
                  )}
                </form>
              )}
              </div>
            </div>
          </section>
        )}
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        username={currentUser.username}
        durationSeconds={5}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
