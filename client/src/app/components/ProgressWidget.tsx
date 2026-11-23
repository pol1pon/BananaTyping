import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { name: "Пн", wpm: 45 },
  { name: "Вт", wpm: 52 },
  { name: "Ср", wpm: 50 },
  { name: "Чт", wpm: 65 },
  { name: "Пт", wpm: 72 },
  { name: "Сб", wpm: 70 },
  { name: "Вс", wpm: 75 },
];

export function ProgressWidget() {
  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-6">
      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-4 sm:mb-6 uppercase tracking-wider">Ваш прогресс</h3>
      <div className="h-32 w-full min-h-[128px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={128}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#111111', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="wpm" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
