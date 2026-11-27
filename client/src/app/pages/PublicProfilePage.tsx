import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Crown,
  Flame,
  Home,
  Hourglass,
  Keyboard,
  Loader2,
  Lock,
  Shield,
  Target,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";
import { client } from "../stores/api-client";
import { useAuthStore, type TypingResult } from "../stores/userStore";
import { UserAvatar } from "../components/UserAvatar";
import { BananaLogo } from "../components/BananaLogo";
import { ProfileStatsSection } from "../components/profile/ProfileStatsSection";
import { calculateAdvancedStats } from "../utils/typingStats";
import { usePageMeta } from "../hooks/usePageMeta";

interface PublicProfileData {
  id: number;
  username: string;
  avatar?: string;
  role?: string;
  isPrivate: boolean;
  createdAt?: string;
  bio?: string | null;
  results: TypingResult[];
}

const MODE_LABELS: Record<string, string> = {
  text: "Текст",
  time: "На время",
  endless: "Бесконечный",
  quick: "Быстрый старт",
};

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageMeta({
    title: profile?.username
      ? `${profile.username} — Профиль игрока | BananaTyping`
      : "Профиль игрока — BananaTyping",
    description: profile?.bio || "Статистика и достижения игрока в тренажере слепой печати BananaTyping.",
    canonicalPath: id ? `/player/${id}` : undefined,
    noIndex: Boolean(profile?.isPrivate || notFound),
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setIsLoading(true);
    setNotFound(false);

    client
      .get<PublicProfileData>({ url: `/users/public/${id}` })
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.data) {
          setNotFound(true);
          setProfile(null);
        } else {
          setProfile(res.data as unknown as PublicProfileData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stats = useMemo(
    () => calculateAdvancedStats(profile?.results || []),
    [profile?.results]
  );

  const recentRuns = useMemo(() => {
    return [...(profile?.results || [])]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb !== ta ? tb - ta : Number(b.id) - Number(a.id);
      })
      .slice(0, 10);
  }, [profile?.results]);

  const isOwnProfile = Boolean(currentUser?.id && profile?.id && Number(currentUser.id) === Number(profile.id));
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white relative overflow-hidden">
      {/* Фоновое свечение */}
      <div className="absolute top-[-15%] left-[10%] w-[45%] h-[35%] bg-[#FFD700]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[30%] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 relative z-10 min-w-0">
        {/* Верхняя навигация */}
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
              to="/leaderboard"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-[#222227] text-gray-200 rounded-xl border border-white/10 transition-colors font-medium text-xs sm:text-sm"
            >
              <ArrowLeft size={15} className="text-[#FFD700]" />
              <span>К топу игроков</span>
            </Link>

            <Link
              to="/training"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] rounded-xl font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-sm"
            >
              <Keyboard size={15} />
              <span>Тренажёр</span>
            </Link>

            {currentUser && (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-[#222227] text-gray-200 rounded-xl border border-white/10 transition-colors font-medium text-xs sm:text-sm"
              >
                <UserCheck size={15} className="text-[#FFD700]" />
                <span>Мой профиль</span>
              </Link>
            )}

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-[#222227] text-gray-200 rounded-xl border border-white/10 transition-colors font-medium text-xs sm:text-sm"
            >
              <Home size={15} />
              <span className="hidden sm:inline">На главную</span>
            </Link>
          </div>
        </header>

        {/* Состояние загрузки */}
        {isLoading ? (
          <div className="bg-[#18181B] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#FFD700]" />
            <span className="text-sm font-medium">Загружаем профиль игрока...</span>
          </div>
        ) : notFound || !profile ? (
          /* Пользователь не найден */
          <div className="bg-[#18181B] border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Игрок не найден</h1>
            <p className="text-sm text-gray-400 mb-6">
              Возможно, этот профиль был удалён или указана неверная ссылка.
            </p>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-sm transition-transform active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Вернуться в топ игроков</span>
            </Link>
          </div>
        ) : profile.isPrivate ? (
          /* ПРИВАТНЫЙ ПРОФИЛЬ */
          <div className="bg-[#18181B] border border-white/10 rounded-[28px] sm:rounded-[32px] p-7 sm:p-10 text-center max-w-xl mx-auto my-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4">
                <UserAvatar
                  avatar={profile.avatar}
                  username={profile.username}
                  size={96}
                  isAdmin={isAdmin}
                  showAdminBadge={true}
                  className="border-4 border-white/15 shadow-xl"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {profile.username}
                </h1>
                {isAdmin && (
                  <span className="bg-[#FFD700] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Shield size={11} /> ADMIN
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-amber-300 text-xs font-bold mb-5">
                <Lock size={14} />
                <span>Приватный профиль</span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-6">
                Этот пользователь ограничил доступ к своему профилю. Описание «О себе», история тренировок и детальная статистика скрыты.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold text-sm transition-transform active:scale-95"
                >
                  <Trophy size={16} />
                  <span>В таблицу лидеров</span>
                </Link>

                {isOwnProfile && (
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-colors"
                  >
                    <span>Мой личный кабинет</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ОТКРЫТЫЙ ПУБЛИЧНЫЙ ПРОФИЛЬ */
          <div className="flex flex-col gap-6">
            {/* Hero-карточка игрока */}
            <section className="bg-gradient-to-br from-[#1B1B20] via-[#17171B] to-[#131317] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)] relative overflow-hidden">
              <div className="absolute -top-24 -left-16 w-80 h-80 bg-[#FFD700]/12 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 right-10 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#FFD700]/45 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-2 rounded-full bg-[#FFD700]/20 blur-xl opacity-75 pointer-events-none" />
                    <UserAvatar
                      avatar={profile.avatar}
                      username={profile.username}
                      size={100}
                      isAdmin={isAdmin}
                      showAdminBadge={true}
                      className="relative shadow-[0_0_32px_rgba(255,215,0,0.22)] border-2 border-[#FFD700] ring-4 ring-[#FFD700]/20"
                    />
                  </div>

                  <div className="flex flex-col items-center sm:items-start max-w-xl w-full min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5 max-w-full">
                      <h1 className="text-2xl sm:text-3xl font-black text-white break-words max-w-full">
                        {profile.username}
                      </h1>
                      {isAdmin && (
                        <span className="bg-[#FFD700] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                          <Shield size={11} /> ADMIN
                        </span>
                      )}
                      <span className="bg-white/10 text-amber-300 border border-white/10 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {stats.rank.emoji} {stats.rank.title}
                      </span>
                    </div>

                    {profile.createdAt && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <Calendar size={12} />
                        <span>
                          На BananaTyping с{" "}
                          {new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    {profile.bio ? (
                      <p className="text-sm text-gray-300 leading-relaxed bg-[#111111]/70 px-4 py-2.5 rounded-2xl border border-white/5 mb-3 max-w-lg">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 italic mb-3">
                        Игрок ещё не заполнил описание о себе
                      </p>
                    )}

                    {/* Прогресс-бар ранга */}
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

                {/* Быстрые показатели и кнопка в свой кабинет (если свой профиль) */}
                <div className="flex flex-col items-center lg:items-end gap-3 shrink-0 w-full lg:w-auto">
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

                  {isOwnProfile && (
                    <Link
                      to="/profile"
                      className="text-xs font-bold text-[#FFD700] hover:underline"
                    >
                      Редактировать в личном кабинете →
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Продвинутая аналитика игрока */}
            <ProfileStatsSection results={profile.results || []} />

            {/* Последние 10 заездов игрока */}
            {recentRuns.length > 0 && (
              <section className="bg-[#18181B] rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Trophy size={18} className="text-[#FFD700]" />
                    <span>Последние заезды игрока</span>
                  </h2>
                  <span className="text-xs text-gray-500">
                    Показано {recentRuns.length} из {profile.results.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {recentRuns.map((run) => {
                    const isBest = stats.bestResultId === run.id;
                    return (
                      <div
                        key={run.id}
                        className={`bg-[#111111] rounded-2xl p-3.5 sm:p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isBest ? "border-[#FFD700]/40" : "border-white/5"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            {isBest && (
                              <span className="w-6 h-6 rounded-lg bg-[#FFD700] text-black flex items-center justify-center shrink-0">
                                <Crown size={12} />
                              </span>
                            )}
                            {run.language && (
                              <span className="text-[11px] font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {run.language === "ru" ? "РУС" : "ENG"}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400">
                              {run.mode ? MODE_LABELS[run.mode] || run.mode : "Тренировка"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-black text-white">
                            <Zap size={13} className="text-[#FFD700]" />
                            <span>{run.wpm}</span>
                            <span className="text-[10px] font-medium text-gray-500">WPM</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
                            <Target size={13} />
                            <span>{run.accuracy}%</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Hourglass size={12} />
                            <span>{run.duration_sec} сек</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>
                            {run.createdAt
                              ? new Date(run.createdAt).toLocaleString("ru-RU", {
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
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
