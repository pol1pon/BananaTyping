import React from "react";

interface BananaLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  showHalo?: boolean;
}

/**
 * Фирменный логотип BananaTyping:
 * Детальный спелый банан с идеально симметричными ангельскими крыльями 🍌🪽
 * Геометрия крыльев математически выверена по размаху, горизонту и ярусам перьев,
 * а основание крыльев заведено под тело банана для монолитного силуэта.
 */
export function BananaLogo({
  size = 30,
  className = "",
  showHalo = false,
  ...props
}: BananaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <defs>
        {/* Градиент левого ангельского крыла */}
        <linearGradient id="wing-left-grad" x1="26" y1="18" x2="4" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E4E4E7" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F4F4F5" />
        </linearGradient>

        {/* Градиент правого ангельского крыла */}
        <linearGradient id="wing-right-grad" x1="26" y1="18" x2="48" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E4E4E7" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F4F4F5" />
        </linearGradient>

        {/* Градиенты банана */}
        <linearGradient id="b-top-grad" x1="16" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF385" />
          <stop offset="45%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="b-bot-grad" x1="12" y1="22" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="b-stem-grad" x1="28" y1="4" x2="31" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="60%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>

        {/* Мягкое золотистое свечение крыльев */}
        <filter id="divine-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#FFD700" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Опциональный нимб (центрирован строго по черенку X=30) */}
      {showHalo && (
        <g>
          <ellipse cx="30" cy="4" rx="7" ry="2" stroke="#FFD700" strokeWidth="1.3" fill="none" />
          <ellipse cx="30" cy="4" rx="7" ry="2" fill="#FFD700" opacity="0.15" />
        </g>
      )}

      {/* 1. ЛЕВОЕ АНГЕЛЬСКОЕ КРЫЛО (строго симметрично правому) */}
      <g filter="url(#divine-shadow)">
        <path
          d="M 28 19
             C 22 15 12 11 4 8
             C 3.5 12 5 16 7.5 18
             C 6 20 8 23 11.5 24
             C 10 25.5 13 27 16.5 26
             C 20 25 25 24 28 23 Z"
          fill="url(#wing-left-grad)"
          stroke="#D4D4D8"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Прожилки перьев */}
        <path d="M 8 13 C 13 15 19 18 25 19.5" stroke="#E4E4E7" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 11.5 19 C 16 20.5 21 21.5 25 22" stroke="#E4E4E7" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* 2. ПРАВОЕ АНГЕЛЬСКОЕ КРЫЛО (строго симметрично левому) */}
      <g filter="url(#divine-shadow)">
        <path
          d="M 30 19
             C 36 15 44 11 48 8
             C 48.5 12 47 16 44.5 18
             C 46 20 44 23 40.5 24
             C 42 25.5 39 27 35.5 26
             C 32 25 29 24 28 23 Z"
          fill="url(#wing-right-grad)"
          stroke="#D4D4D8"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Прожилки перьев */}
        <path d="M 44 13 C 39 15 33 18 27 19.5" stroke="#E4E4E7" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 40.5 19 C 36 20.5 31 21.5 27 22" stroke="#E4E4E7" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* 3. ДЕТАЛИЗИРОВАННЫЙ БАНАН ПО ЦЕНТРУ */}
      {/* Нижняя грань (брюшко) */}
      <path
        d="M 28 7.5
           C 35 13 41 21 41 30
           C 41 39 33 45 20 45
           C 12 45 7.5 41.5 8 38
           C 8.5 35 13 35 18 33.5
           C 27 31 32 22 30 14.5
           C 29.5 12 28.5 9.5 28 7.5 Z"
        fill="url(#b-bot-grad)"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Верхняя освещенная грань (спинка) */}
      <path
        d="M 28 7.5
           C 33 11.5 37.5 18 37.5 26.5
           C 37.5 35 30 40 19 40.5
           C 13 40.8 9 38.5 8 38
           C 8.5 35 13 35 18 33.5
           C 27 31 32 22 30 14.5
           C 29.5 12 28.5 9.5 28 7.5 Z"
        fill="url(#b-top-grad)"
        stroke="#B45309"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Продольное ребро */}
      <path
        d="M 28 7.5
           C 34 12.5 38 19 38 27
           C 38 35.5 31 40 19 40.5"
        stroke="#D97706"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Глянцевый блик */}
      <path
        d="M 30 11
           C 35 16 38.5 22.5 38.5 29.5
           C 38.5 34.5 35 38.5 27 41"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Черенок со срезом */}
      <path
        d="M 28 7.5
           L 29 4.2
           C 29.3 3.4 30.5 3.4 31 4
           C 31.6 4.8 31.8 6 31 7.2
           L 29.5 8"
        fill="url(#b-stem-grad)"
        stroke="#15803D"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <ellipse cx="30.2" cy="4" rx="1.1" ry="0.6" fill="#86EFAC" stroke="#15803D" strokeWidth="0.5" />

      {/* Носик банана */}
      <path
        d="M 8 38
           C 7 38.8 6.5 40 7.2 41
           C 7.8 41.8 9 41.8 10 41
           L 8 38 Z"
        fill="#78350F"
        stroke="#451A03"
        strokeWidth="0.6"
      />

      {/* Точки спелости */}
      <circle cx="36" cy="33" r="0.6" fill="#92400E" opacity="0.6" />
      <circle cx="33" cy="37" r="0.5" fill="#92400E" opacity="0.6" />
    </svg>
  );
}
