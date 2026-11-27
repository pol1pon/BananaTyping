import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthStore, User } from "../stores/userStore";
import { client } from "../stores/api-client";
import { UserAvatar } from "../components/UserAvatar";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  Shield,
  Users,
  FileText,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Home,
  UserCheck,
  UserX,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface TextItem {
  id: number;
  content: string;
  language: string;
  topic?: string;
  difficulty?: string;
  source: string;
  createdAt: string;
}

export function AdminDashboard() {
  usePageMeta({
    title: "Панель администратора — BananaTyping",
    noIndex: true,
  });

  const { currentUser, claimAdmin } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryKey = searchParams.get("key");

  const [activeTab, setActiveTab] = useState<"users" | "texts" | "secret">("users");
  const [usersList, setUsersList] = useState<User[]>([]);
  const [textsList, setTextsList] = useState<TextItem[]>([]);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; totalAdmins: number; adminSecretKey: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState(queryKey || "");
  const [claimError, setClaimError] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // Состояние создания текста
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextLanguage, setNewTextLanguage] = useState<"ru" | "en">("ru");
  const [newTextTopic, setNewTextTopic] = useState("Общее");

  // Автопроверка queryKey при первом рендере
  useEffect(() => {
    if (queryKey && currentUser && currentUser.role !== "admin") {
      claimAdmin(queryKey)
        .then(() => {
          loadData();
        })
        .catch((err) => {
          setClaimError(err.message || "Неверный секретный ключ");
        });
    }
  }, [queryKey, currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Загрузка статистики и ключа
      const statsRes = await client.get<{ totalUsers: number; totalAdmins: number; adminSecretKey: string }>({
        url: "/users/admin/stats",
      });
      if (statsRes.data) {
        setAdminStats(statsRes.data as unknown as { totalUsers: number; totalAdmins: number; adminSecretKey: string });
      }

      // Загрузка пользователей
      const usersRes = await client.get<User[]>({
        url: "/users",
      });
      if (usersRes.data) {
        setUsersList(usersRes.data);
      }

      // Загрузка текстов
      const textsRes = await client.get<TextItem[]>({
        url: "/texts",
      });
      if (textsRes.data) {
        setTextsList(textsRes.data);
      }
    } catch (err) {
      console.error("Ошибка загрузки данных админки:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadData();
    }
  }, [currentUser?.role]);

  // Активация ключа вручную
  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKeyInput.trim()) return;

    setIsPromoting(true);
    setClaimError("");
    try {
      await claimAdmin(secretKeyInput.trim());
      await loadData();
    } catch (err: any) {
      setClaimError(err.message || "Неверный секретный ключ администратора");
    } finally {
      setIsPromoting(false);
    }
  };

  // Смена роли пользователя
  const handleToggleUserRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (user.id === currentUser?.id && newRole === "user") {
      if (!confirm("Вы уверены, что хотите снять права администратора с себя?")) {
        return;
      }
    }

    try {
      await client.put({
        url: `/users/${user.id}`,
        body: { role: newRole },
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      if (user.id === currentUser?.id) {
        useAuthStore.setState({ currentUser: { ...currentUser!, role: newRole } });
      }
    } catch (err) {
      alert("Не удалось изменить роль пользователя");
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Удалить пользователя "${username}"?`)) return;

    try {
      await client.delete({ url: `/users/${userId}` });
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Не удалось удалить пользователя");
    }
  };

  // Создание текста
  const handleCreateText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextContent.trim()) return;

    try {
      const res = await client.post<TextItem>({
        url: "/texts",
        body: {
          content: newTextContent.trim(),
          language: newTextLanguage,
          topic: newTextTopic.trim(),
          source: "manual",
        },
      });
      if (res.data) {
        setTextsList((prev) => [res.data as TextItem, ...prev]);
        setNewTextContent("");
        setIsCreatingText(false);
      }
    } catch (err) {
      alert("Не удалось сохранить текст");
    }
  };

  // Удаление текста
  const handleDeleteText = async (id: number) => {
    if (!confirm("Удалить этот текст из базы тренировок?")) return;

    try {
      await client.delete({ url: `/texts/${id}` });
      setTextsList((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Не удалось удалить текст");
    }
  };

  // Копирование секретной ссылки
  const secretLink = typeof window !== "undefined"
    ? `${window.location.origin}/admin/claim/${adminStats?.adminSecretKey || "banana_secret_admin_2026"}`
    : "";

  const handleCopySecretLink = () => {
    navigator.clipboard.writeText(secretLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Если пользователь не залогинен
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#18181B] rounded-3xl p-8 border border-gray-800 text-center shadow-2xl">
          <Shield size={44} className="text-[#FFD700] mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Требуется вход</h1>
          <p className="text-gray-400 text-sm mb-6">
            Для доступа к панели администратора войдите в аккаунт.
          </p>
          <Link
            to="/login"
            className="w-full py-3 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold rounded-xl text-sm inline-block"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  // Если пользователь не администратор — форма ввода секретного ключа
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-4 relative">
        <div className="max-w-md w-full bg-[#18181B] rounded-[28px] p-6 sm:p-8 border border-gray-800 text-center shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mx-auto mb-5 shadow-md">
            <Shield size={32} />
          </div>

          <h1 className="text-2xl font-black mb-2">Панель администратора</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Доступ ограничен. Введите секретный ключ администратора или воспользуйтесь специальной ссылкой для активации прав.
          </p>

          {claimError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{claimError}</span>
            </div>
          )}

          <form onSubmit={handleActivateKey} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Введите секретный ключ..."
              value={secretKeyInput}
              onChange={(e) => setSecretKeyInput(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
            />
            <button
              type="submit"
              disabled={isPromoting || !secretKeyInput.trim()}
              className="w-full py-3 bg-[#FFD700] hover:bg-[#FACC15] disabled:opacity-50 text-[#111111] font-extrabold rounded-xl text-sm transition-transform active:scale-95 shadow-md"
            >
              {isPromoting ? "Проверка ключа..." : "Активировать доступ"}
            </button>
          </form>

          <Link
            to="/profile"
            className="mt-6 inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            <Home size={14} />
            <span>Вернуться в профиль</span>
          </Link>
        </div>
      </div>
    );
  }

  // Основная панель администратора
  return (
    <div className="min-h-screen bg-[#111111] text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Шапка админ-панели */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] shadow-md">
              <Shield size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black">Панель управления</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700] text-[#111111] font-black text-xs uppercase tracking-wide">
                  Admin
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">
                Управление пользователями, текстами тренировок и секретными ссылками
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 rounded-xl border border-gray-800 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              <span>Обновить</span>
            </button>
            <Link
              to="/profile"
              className="px-4 py-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
            >
              <Home size={15} />
              <span>В профиль</span>
            </Link>
          </div>
        </div>

        {/* Карточки быстрой статистики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#18181B] p-5 rounded-2xl border border-gray-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Всего пользователей</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {adminStats?.totalUsers ?? usersList.length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-[#18181B] p-5 rounded-2xl border border-gray-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Администраторы</span>
              <div className="text-2xl sm:text-3xl font-black text-[#FFD700] mt-1">
                {adminStats?.totalAdmins ?? usersList.filter((u) => u.role === "admin").length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-[#FFD700] flex items-center justify-center border border-amber-500/20">
              <Shield size={22} />
            </div>
          </div>

          <div className="bg-[#18181B] p-5 rounded-2xl border border-gray-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Текстов в базе</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {textsList.length}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <BookOpen size={22} />
            </div>
          </div>
        </div>

        {/* Навигационные вкладки */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-800 pb-3">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${
              activeTab === "users"
                ? "bg-[#FFD700] text-[#111111] shadow-sm"
                : "text-gray-400 hover:text-white bg-[#1A1A1A] border border-gray-800"
            }`}
          >
            <Users size={16} />
            <span>Пользователи ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("texts")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${
              activeTab === "texts"
                ? "bg-[#FFD700] text-[#111111] shadow-sm"
                : "text-gray-400 hover:text-white bg-[#1A1A1A] border border-gray-800"
            }`}
          >
            <FileText size={16} />
            <span>Тексты тренировок ({textsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("secret")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${
              activeTab === "secret"
                ? "bg-[#FFD700] text-[#111111] shadow-sm"
                : "text-gray-400 hover:text-white bg-[#1A1A1A] border border-gray-800"
            }`}
          >
            <Shield size={16} />
            <span>Секретная ссылка</span>
          </button>
        </div>

        {/* ВКЛАДКА 1: ПОЛЬЗОВАТЕЛИ */}
        {activeTab === "users" && (
          <div className="bg-[#18181B] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-extrabold text-base sm:text-lg">Зарегистрированные пользователи</h2>
              <span className="text-gray-500 text-xs">Всего: {usersList.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#121214] text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Пользователь</th>
                    <th className="py-3 px-4 hidden md:table-cell">Email</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Описание</th>
                    <th className="py-3 px-4">Роль</th>
                    <th className="py-3 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatar={user.avatar} username={user.username} size={36} isAdmin={user.role === "admin"} showAdminBadge />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{user.username}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">Вы</span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[11px] md:hidden">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 hidden md:table-cell text-gray-300">
                        {user.email}
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell text-gray-400 max-w-[200px] truncate">
                        {user.bio || <span className="text-gray-600 italic">Нет описания</span>}
                      </td>

                      <td className="py-3 px-4">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#FFD700] text-xs font-bold">
                            <span>👑</span>
                            <span>Админ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">
                            Пользователь
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleUserRole(user)}
                            className={`p-2 rounded-lg transition-colors border ${
                              user.role === "admin"
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-[#FFD700] border-amber-500/30"
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                            }`}
                            title={user.role === "admin" ? "Снять права админа" : "Сделать админом"}
                          >
                            {user.role === "admin" ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                              title="Удалить пользователя"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 2: ТЕКСТЫ ТРЕНИРОВОК */}
        {activeTab === "texts" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg">Библиотека текстов для тренировок</h2>
              <button
                onClick={() => setIsCreatingText(!isCreatingText)}
                className="px-4 py-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              >
                <Plus size={16} />
                <span>{isCreatingText ? "Закрыть форму" : "Добавить свой текст"}</span>
              </button>
            </div>

            {/* Форма создания текста */}
            {isCreatingText && (
              <form onSubmit={handleCreateText} className="bg-[#18181B] p-5 rounded-2xl border border-gray-800 flex flex-col gap-4 shadow-md">
                <h3 className="font-bold text-sm text-[#FFD700]">Новый текст для печати</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1">Язык текста</label>
                    <select
                      value={newTextLanguage}
                      onChange={(e) => setNewTextLanguage(e.target.value as "ru" | "en")}
                      className="w-full px-3 py-2 bg-[#111111] border border-gray-700 rounded-xl text-xs sm:text-sm text-white"
                    >
                      <option value="ru">Русский (RU)</option>
                      <option value="en">Английский (EN)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1">Тема / Категория</label>
                    <input
                      type="text"
                      value={newTextTopic}
                      onChange={(e) => setNewTextTopic(e.target.value)}
                      placeholder="Например: IT, Литература, Космос"
                      className="w-full px-3 py-2 bg-[#111111] border border-gray-700 rounded-xl text-xs sm:text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1">Содержимое текста</label>
                  <textarea
                    rows={4}
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                    placeholder="Введите текст для скоропечатания..."
                    required
                    className="w-full px-3 py-2 bg-[#111111] border border-gray-700 rounded-xl text-xs sm:text-sm text-white leading-relaxed resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingText(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold rounded-xl text-xs shadow-md"
                  >
                    Сохранить в базу
                  </button>
                </div>
              </form>
            )}

            {/* Список текстов */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {textsList.map((text) => (
                <div key={text.id} className="bg-[#18181B] p-5 rounded-2xl border border-gray-800 flex flex-col justify-between gap-4 shadow-sm group hover:border-gray-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {text.language === "ru" ? "Русский" : "English"}
                        </span>
                        {text.topic && (
                          <span className="text-[11px] text-gray-400 bg-[#111111] px-2 py-0.5 rounded border border-gray-800">
                            {text.topic}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 uppercase">
                          {text.source}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteText(text.id)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Удалить текст"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-4">
                      {text.content}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-500 flex justify-between items-center border-t border-gray-800/80 pt-2.5">
                    <span>Символов: {text.content.length}</span>
                    <span>Слов: {text.content.split(/\s+/).filter(Boolean).length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 3: СЕКРЕТНАЯ ССЫЛКА АДМИНИСТРАТОРА */}
        {activeTab === "secret" && (
          <div className="bg-[#18181B] rounded-3xl p-6 sm:p-8 border border-gray-800 max-w-2xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mb-5 shadow-md">
              <Shield size={32} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black mb-2">Секретная ссылка администратора</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed">
              Любой пользователь, перешедший по этой ссылке, автоматически получит роль <span className="text-[#FFD700] font-bold">Администратора</span>. 
              Делитесь ею только с доверенными лицами. Ключ также можно изменить в конфигурационном файле <code className="text-[#FFD700] bg-[#111111] px-1.5 py-0.5 rounded">.env</code> на сервере.
            </p>

            <div className="bg-[#111111] p-4 rounded-2xl border border-gray-800 mb-6 flex flex-col gap-2">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Прямая ссылка для активации
              </span>
              <div className="flex items-center gap-2 bg-[#18181B] p-2.5 rounded-xl border border-gray-800 text-xs sm:text-sm font-mono text-[#FFD700] break-all">
                <span className="truncate flex-1">{secretLink}</span>
                <button
                  onClick={handleCopySecretLink}
                  className="px-3 py-1.5 bg-[#FFD700] hover:bg-[#FACC15] text-[#111111] font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Скопировано!" : "Копировать"}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#111111] border border-gray-800/80 text-xs text-gray-400 flex flex-col gap-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Секретный ключ (ENV):</span>
                <span className="font-mono text-[#FFD700] bg-gray-800 px-2 py-0.5 rounded">
                  {adminStats?.adminSecretKey || "banana_secret_admin_2026"}
                </span>
              </div>
              <p>
                Для изменения ключа задайте переменную <code className="text-white">ADMIN_SECRET_KEY</code> в файле <code className="text-white">server/.env</code>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
