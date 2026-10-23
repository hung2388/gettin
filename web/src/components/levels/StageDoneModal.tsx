import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';

interface StageDoneModalProps {
  stats: {
    correct: number;
    mistakes: number;
    missed: WordEntry[];
  };
  onRepeat: () => void;
  onNext: () => void;
}

export const StageDoneModal: React.FC<StageDoneModalProps> = ({ stats, onRepeat, onNext }) => {
  const total = stats.correct + stats.mistakes;
  const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121319] border border-[#232635] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center">
        {/* Pixel Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#1c1d29] border border-[#2d3043] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
          <PixelIcon name="trophy" size={32} />
        </div>

        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Hoàn Thành Xuất Sắc!</h2>
        <p className="text-xs text-zinc-400 mb-6">Bạn đã kết thúc lượt luyện tập Active Recall</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#171822] border border-[#232534] mb-6">
          <div>
            <div className="text-[11px] text-zinc-400">Độ chính xác</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Số câu đúng</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{stats.correct}</div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Số câu sai</div>
            <div className="text-lg font-black text-red-400 font-mono mt-0.5">{stats.mistakes}</div>
          </div>
        </div>

        {/* Missed Words List */}
        {stats.missed.length > 0 && (
          <div className="mb-6 text-left">
            <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
              <PixelIcon name="help" size={12} />
              <span>Các từ cần xem lại:</span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-[#171822] border border-[#232534]">
              {stats.missed.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-jp font-bold text-white">
                    {w.word} {w.romaji && `(${w.romaji})`}
                  </span>
                  <span className="text-red-400">{w.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRepeat}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1b26] hover:bg-[#252837] text-white font-bold text-xs border border-[#292c3d] transition-all"
          >
            <PixelIcon name="refresh" size={12} />
            <span>Luyện lại</span>
          </button>

          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] text-white font-extrabold text-xs shadow-lg shadow-red-500/25 transition-all"
          >
            <span>Tiếp tục</span>
            <PixelIcon name="chevron-right" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
