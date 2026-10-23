import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { UserProgress } from '@/data/types';

interface StatsModalProps {
  progress: UserProgress;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ progress, onClose }) => {
  const completedEntries = Object.entries(progress).filter(([, p]) => p >= 100);
  const inProgressEntries = Object.entries(progress).filter(([, p]) => p > 0 && p < 100);

  const totalCompleted = completedEntries.length;
  const totalInProgress = inProgressEntries.length;
  const totalScore = Object.values(progress).reduce((acc, cur) => acc + cur, 0);
  const avgPercent = Object.values(progress).length > 0
    ? Math.round(totalScore / Object.values(progress).length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121319] border border-[#232634] rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-[#20222f] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <PixelIcon name="stats" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Thống Kê Tiến Độ Học</h3>
              <p className="text-xs text-zinc-400">Dữ liệu ghi nhớ và hoàn thành bài</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c1d27] hover:bg-[#282b3a] text-zinc-400 hover:text-white transition-colors"
          >
            <PixelIcon name="close" size={14} />
          </button>
        </div>

        {/* Big Highlight Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-[#181922] border border-[#232533] text-center">
            <div className="text-2xl font-black text-emerald-400 font-mono mb-1">
              {totalCompleted}
            </div>
            <div className="text-xs text-zinc-400">Bài đã thuộc 100%</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#181922] border border-[#232533] text-center">
            <div className="text-2xl font-black text-red-400 font-mono mb-1">
              {totalInProgress}
            </div>
            <div className="text-xs text-zinc-400">Bài đang luyện tập</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#181922] border border-[#232533] mb-6">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-zinc-300">Tổng điểm tích lũy</span>
            <span className="text-red-400 font-mono font-bold">{avgPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#0e0f14] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, avgPercent)}%` }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#e53935] hover:bg-[#ff4747] text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-red-500/20"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
