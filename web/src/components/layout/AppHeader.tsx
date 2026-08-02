import React from 'react';
import { BookOpen, MapPin, Sparkles, Trophy } from 'lucide-react';
import { UserProgress } from '@/data/types';

interface AppHeaderProps {
  activeView: 'path' | 'topic' | 'vocab_packs' | 'study_hub' | 'level';
  setActiveView: (view: 'path' | 'vocab_packs') => void;
  progress: UserProgress;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ activeView, setActiveView, progress }) => {
  const completedCount = Object.values(progress).filter((p) => p >= 100).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveView('path')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            🎌
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              KanaLearner
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO WEB
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Học Tiếng Nhật Thông Minh & Luyện Nhớ Chủ Động</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setActiveView('path')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'path'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Lộ trình Map</span>
          </button>

          <button
            onClick={() => setActiveView('vocab_packs')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'vocab_packs'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Kho Từ Vựng</span>
          </button>

          {/* Progress Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Đã thuộc: {completedCount} bài</span>
          </div>
        </div>
      </div>
    </header>
  );
};
