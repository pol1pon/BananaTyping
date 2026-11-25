import React from "react";
import { User as UserIcon, ShieldAlert } from "lucide-react";

export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'banana-classic', name: 'Классический', emoji: '🍌', bgGradient: 'from-amber-400 to-yellow-500' },
  { id: 'banana-angel', name: 'Ангельский', emoji: '🪽', bgGradient: 'from-yellow-200 to-amber-300' },
  { id: 'banana-agent', name: 'Кибер-Агент', emoji: '🕶️', bgGradient: 'from-gray-800 to-neutral-900' },
  { id: 'banana-king', name: 'Король', emoji: '👑', bgGradient: 'from-yellow-500 to-amber-600' },
  { id: 'banana-lightning', name: 'Молния', emoji: '⚡', bgGradient: 'from-yellow-400 to-orange-500' },
  { id: 'banana-ninja', name: 'Ниндзя', emoji: '🥷', bgGradient: 'from-zinc-700 to-zinc-900' },
  { id: 'banana-gamer', name: 'Геймер', emoji: '🎧', bgGradient: 'from-purple-600 to-indigo-700' },
  { id: 'banana-space', name: 'Космонавт', emoji: '🚀', bgGradient: 'from-blue-600 to-cyan-600' },
  { id: 'banana-fire', name: 'Огненный', emoji: '🔥', bgGradient: 'from-red-500 to-amber-500' },
  { id: 'banana-magic', name: 'Магический', emoji: '✨', bgGradient: 'from-emerald-500 to-teal-700' },
];

interface UserAvatarProps {
  avatar?: string | null;
  username?: string;
  size?: number; // width/height in px
  className?: string;
  isAdmin?: boolean;
  showAdminBadge?: boolean;
}

export function UserAvatar({
  avatar,
  username,
  size = 40,
  className = '',
  isAdmin = false,
  showAdminBadge = false,
}: UserAvatarProps) {
  const preset = AVATAR_PRESETS.find((p) => p.id === avatar);
  const isCustomImage = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http://') || avatar.startsWith('https://'));

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Кастомная загруженная картинка / ссылка */}
      {isCustomImage ? (
        <img
          src={avatar}
          alt={username || 'Avatar'}
          className="w-full h-full object-cover rounded-full border border-white/10 shadow-sm"
        />
      ) : preset ? (
        /* 2. Пресет-аватар с эмодзи и сочным градиентом */
        <div
          className={`w-full h-full rounded-full bg-gradient-to-br ${preset.bgGradient} flex items-center justify-center shadow-sm text-center border border-white/10`}
          style={{ fontSize: Math.max(14, Math.floor(size * 0.52)) }}
        >
          <span className="leading-none drop-shadow-sm">{preset.emoji}</span>
        </div>
      ) : (
        /* 3. Дефолтный аватар (первая буква или иконка) */
        <div className="w-full h-full rounded-full bg-[#222226] border border-gray-700 flex items-center justify-center text-[#FFD700] font-bold">
          {username ? (
            <span style={{ fontSize: Math.max(12, Math.floor(size * 0.45)) }} className="uppercase font-black">
              {username.slice(0, 1)}
            </span>
          ) : (
            <UserIcon size={Math.floor(size * 0.55)} className="text-gray-400" />
          )}
        </div>
      )}

      {/* Бейдж администратора */}
      {showAdminBadge && isAdmin && (
        <div
          className="absolute -bottom-1 -right-1 bg-[#FFD700] text-black rounded-full p-0.5 shadow-md border border-[#111111] flex items-center justify-center"
          style={{ width: Math.max(14, Math.floor(size * 0.38)), height: Math.max(14, Math.floor(size * 0.38)) }}
          title="Администратор"
        >
          <span style={{ fontSize: Math.max(9, Math.floor(size * 0.24)) }}>👑</span>
        </div>
      )}
    </div>
  );
}
