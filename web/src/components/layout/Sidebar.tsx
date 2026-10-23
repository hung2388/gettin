import React from 'react';
import { PixelAppLogo } from '@/components/ui/PixelAppLogo';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: 'path' | 'vocab_packs') => void;
  onOpenStats: () => void;
  onOpenKanaChart: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenStats,
  onOpenKanaChart,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0d0e12] border-r border-[#1a1b22] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 px-4 border-b border-[#181920] flex items-center justify-between">
            <div
              onClick={() => {
                setActiveView('path');
                onCloseMobile();
              }}
              className="flex items-center gap-3 cursor-pointer group overflow-hidden"
            >
              <PixelAppLogo size={32} />
              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-200">
                  <span className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                    Kana Pro
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      VI
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle (desktop) */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#181922] transition-colors"
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              <PixelIcon name={isCollapsed ? 'expand' : 'collapse'} size={12} />
            </button>

            {/* Close toggle (mobile) */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <PixelIcon name="close" size={14} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
            {/* Lộ trình học (Roadmap) */}
            <button
              onClick={() => {
                setActiveView('path');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'path'
                  ? 'bg-[#1b1c25] text-white border border-[#2b2e3e] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14151c]'
              }`}
            >
              <PixelIcon
                name="map"
                size={16}
                className={activeView === 'path' ? 'text-red-400' : 'text-zinc-400'}
              />
              {!isCollapsed && <span>Lộ trình học</span>}
            </button>

            {/* Kho từ vựng (Vocab Packs) */}
            <button
              onClick={() => {
                setActiveView('vocab_packs');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'vocab_packs'
                  ? 'bg-[#1b1c25] text-white border border-[#2b2e3e] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14151c]'
              }`}
            >
              <PixelIcon
                name="book"
                size={16}
                className={activeView === 'vocab_packs' ? 'text-red-400' : 'text-zinc-400'}
              />
              {!isCollapsed && <span>Kho từ vựng</span>}
            </button>

            {/* Thống kê */}
            <button
              onClick={() => {
                onOpenStats();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-[#14151c] transition-all"
            >
              <PixelIcon name="stats" size={16} className="text-zinc-400" />
              {!isCollapsed && <span>Thống kê</span>}
            </button>

            {/* Bảng kana */}
            <button
              onClick={() => {
                onOpenKanaChart();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-[#14151c] transition-all"
            >
              <PixelIcon name="layers" size={16} className="text-zinc-400" />
              {!isCollapsed && <span>Bảng kana</span>}
            </button>

            <div className="pt-2 border-t border-[#181920] my-2" />

            {/* Nhận Premium */}
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-[#14151c] cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <PixelIcon name="trophy" size={16} />
                {!isCollapsed && <span>Nhận Premium</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  123.000 ₫
                </span>
              )}
            </div>

            {/* Giao diện: Tối */}
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-3">
                <PixelIcon name="palette" size={16} />
                {!isCollapsed && <span>Giao diện: Tối</span>}
              </div>
              {!isCollapsed && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>

            {/* Tiếng Việt */}
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="text-xs">🇻🇳</span>
                {!isCollapsed && <span>Tiếng Việt</span>}
              </div>
            </div>

            {/* My Profile */}
            <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400">
              <PixelIcon name="user" size={16} />
              {!isCollapsed && <span>Hồ sơ cá nhân</span>}
            </div>
          </nav>
        </div>

        {/* Bottom Card / License & Badges */}
        {!isCollapsed && (
          <div className="p-4 border-t border-[#181920] bg-[#0a0a0e]/60">
            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
              💡 Một giấy phép Premium cho tất cả thiết bị của bạn!
            </p>
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 rounded-lg bg-[#14151d] border border-[#20222f] text-[10px] text-zinc-300 flex items-center justify-between">
                <span>App Store</span>
                <span className="text-emerald-400">✓ Sẵn sàng</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#14151d] border border-[#20222f] text-[10px] text-zinc-300 flex items-center justify-between">
                <span>Google Play</span>
                <span className="text-emerald-400">✓ Sẵn sàng</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
