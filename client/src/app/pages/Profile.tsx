import { useEffect } from "react";
import { Navigate, Link } from "react-router";
import { useAuthStore } from "../stores/userStore";
import { Trophy, Target, Zap, Clock, User as UserIcon, Hourglass, Home, LogOut } from "lucide-react";

export function Profile() {
  const { currentUser, recentResults, fetchUserResults, logout } = useAuthStore();

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserResults(currentUser.id);
    }
  }, [currentUser?.id, fetchUserResults]);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#111111] text-white p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Шапка профиля */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Личный <span className="text-[#FFD700]">кабинет</span>
          </h1>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#1A1A1A] hover:bg-[#222222] text-white rounded-xl border border-gray-800 transition-colors font-medium text-xs sm:text-sm md:text-base"
            >
              <Home size={16} />
              <span>На главную</span>
            </Link>
            
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-colors font-medium text-xs sm:text-sm md:text-base active:scale-95"
            >
              <LogOut size={16} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* Левая колонка: Карточка пользователя */}
          <div className="bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border border-gray-800/60 h-fit flex flex-col items-center text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-[#FFD700]/10 to-transparent pointer-events-none"></div>
            
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#111111] flex items-center justify-center border-4 border-[#FFD700] mb-4 sm:mb-6 shadow-[0_0_24px_rgba(255,215,0,0.15)] relative z-10">
              <UserIcon size={40} className="text-[#FFD700]" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-1 relative z-10">{currentUser.username}</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6 relative z-10">{currentUser.email}</p>
            
            <div className="w-full flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 bg-[#111111] rounded-2xl border border-gray-800">
              <span className="text-gray-400 text-xs sm:text-sm font-medium">Всего тренировок:</span>
              <span className="font-black text-lg sm:text-xl text-[#FFD700]">{recentResults.length}</span>
            </div>
          </div>

          {/* Правая колонка: Список последних результатов */}
          <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center gap-2.5 mb-1">
              <Trophy size={22} className="text-[#FFD700]" />
              <h2 className="text-xl sm:text-2xl font-bold">Последние результаты</h2>
            </div>
            
            {recentResults.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-[24px] sm:rounded-[32px] p-8 sm:p-12 border border-gray-800/50 text-center text-gray-500 font-medium shadow-md text-sm sm:text-base">
                История тренировок пока пуста. <br />Пройди свой первый тест, чтобы увидеть здесь статистику!
              </div>
            ) : (
              [...recentResults].reverse().map((result) => (
                <div 
                  key={result.id} 
                  className="bg-[#1A1A1A] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-7 border border-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:border-[#FFD700]/30 transition-all group shadow-md"
                >
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-4 sm:gap-8 md:gap-10">
                    {result.language && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Раскладка</span>
                        <span className="font-bold text-xs sm:text-sm bg-[#222222] px-2.5 py-1 rounded-lg text-center border border-gray-800">
                          {result.language === 'ru' ? 'РУС' : 'ENG'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Zap size={13} className="group-hover:text-[#FFD700] transition-colors" /> Скорость
                      </span>
                      <div className="font-black text-xl sm:text-2xl md:text-3xl text-white">
                        {result.wpm} <span className="text-xs font-medium text-gray-500">WPM</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Target size={13} className="group-hover:text-green-400 transition-colors" /> Точность
                      </span>
                      <div className="font-black text-xl sm:text-2xl md:text-3xl text-white">
                        {result.accuracy}%
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Hourglass size={13} className="group-hover:text-blue-400 transition-colors" /> Время
                      </span>
                      <div className="font-bold text-lg sm:text-xl text-white">
                        {result.duration_sec} <span className="text-xs font-medium text-gray-500">сек</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm font-medium bg-[#111111] px-3.5 py-2 rounded-xl border border-gray-800 self-start sm:self-center shrink-0">
                    <Clock size={14} />
                    <span>
                      {result.createdAt ? new Date(result.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "Недавно"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
