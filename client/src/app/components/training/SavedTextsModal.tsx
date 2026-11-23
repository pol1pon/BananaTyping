import React, { useState } from "react";
import { Database, Search, X, Hash } from "lucide-react";
import type { Text } from "../../../client/types.gen";

interface SavedTextsModalProps {
  isOpen: boolean;
  texts: Text[];
  onClose: () => void;
  onSelectText: (text: Text) => void;
}

export function SavedTextsModal({
  isOpen,
  texts,
  onClose,
  onSelectText,
}: SavedTextsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredTexts = texts.filter((item) => {
    const content = (item.content || item.word || "").toLowerCase();
    const topic = (item.topic || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return content.includes(query) || topic.includes(query);
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[28px] p-6 md:p-8 max-h-[85vh] flex flex-col shadow-2xl">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-[#FFD700]" />
            <h2 className="text-xl font-bold text-gray-900">
              Библиотека текстов ({texts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Поиск */}
        <div className="relative my-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по теме или тексту..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
          />
        </div>

        {/* Список текстов */}
        <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1 my-2">
          {filteredTexts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {texts.length === 0
                ? "В библиотеке пока нет текстов. Сгенерируйте через ИИ!"
                : "Ничего не найдено по вашему запросу."}
            </div>
          ) : (
            filteredTexts.map((item) => {
              const content = item.content || item.word || "";
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectText(item);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50/40 cursor-pointer transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-bold text-gray-700 flex items-center gap-1">
                      <Hash size={12} />
                      {item.id} • {item.language?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.topic && (
                        <span className="bg-gray-100 group-hover:bg-yellow-200/60 px-2 py-0.5 rounded text-gray-600 font-medium">
                          {item.topic}
                        </span>
                      )}
                      <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-medium">
                        {item.source || "сохранен"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-3 font-mono leading-relaxed">
                    {content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Футер */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-sm text-gray-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
