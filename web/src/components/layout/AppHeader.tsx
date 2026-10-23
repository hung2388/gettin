import React from 'react';
import { PixelAppLogo } from '@/components/ui/PixelAppLogo';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { UserProgress } from '@/data/types';

interface AppHeaderProps {
  activeView: string;
  setActiveView: (view: 'path' | 'vocab_packs') => void;
  progress: UserProgress;
  onOpenMobileMenu: () => void;
  onOpenStats: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeView,
  setActiveView,
  progress,
  onOpenMobileMenu,
  onOpenStats,
}) => {
  const completedCount = Object.values(progress).filter((p) => p >= 100).length;

  return (
    <header className="sticky top-0 z-30 bg-[#0d0e12]/90 backdrop-blur-md border-b border-[#1b1c24] px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile Left: Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#171822] border border-[#242736] text-zinc-300 hover:text-white"
            title="Menu"
          >
            <PixelIcon name="layers" size={16} />
          </button>

          <div
            onClick={() => setActiveView('path')}
            className="flex items-center gap-2.5 cursor-pointer lg:hidden"
          >
            <PixelAppLogo size={28} />
            <span className="font-extrabold text-sm text-white tracking-tight">Kana Pro</span>
          </div>

          {/* Desktop Subtitle / Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs text-zinc-400">
              Học tiếng Nhật chuẩn khoa học Active Recall
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-[11px] text-zinc-400">Phiên bản Web 2.0</span>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Quick Stats Pill */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161720] border border-[#252837] hover:border-red-500/40 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            <PixelIcon name="trophy" size={14} className="text-amber-400" />
            <span>Đã thuộc: <strong className="text-amber-400">{completedCount}</strong> bài</span>
          </button>

          {/* Link to previous version / info */}
          <a
            href="https://kana.pro/vi"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:underline transition-colors"
          >
            <span>Phiên bản gốc</span>
            <PixelIcon name="chevron-right" size={10} />
          </a>
        </div>
      </div>
    </header>
  );
};
