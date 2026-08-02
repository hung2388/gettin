import React from 'react';
import { Trophy, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#131B2E] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 mx-auto mb-6 shadow-lg shadow-amber-500/30">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-white mb-2">Chúc Mừng Bạn! 🎉</h2>
        <p className="text-sm text-slate-400 mb-6">Bạn đã hoàn thành xuất sắc lượt luyện tập!</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <div>
            <div className="text-xs text-slate-400">Độ chính xác</div>
            <div className="text-xl font-black text-amber-400">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Số câu đúng</div>
            <div className="text-xl font-black text-emerald-400">{stats.correct}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Số câu sai</div>
            <div className="text-xl font-black text-rose-400">{stats.mistakes}</div>
          </div>
        </div>

        {/* Missed Words List */}
        {stats.missed.length > 0 && (
          <div className="mb-6 text-left">
            <div className="text-xs font-bold text-rose-400 mb-2">Các từ cần xem lại:</div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              {stats.missed.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-jp font-bold text-white">{w.word} ({w.romaji})</span>
                  <span className="text-rose-400">{w.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRepeat}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Luyện lại
          </button>

          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <span>Tiếp tục Bản đồ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
