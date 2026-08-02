import React from 'react';
import { CheckCircle2, Lock, Play, Star, Sparkles, BookOpen } from 'lucide-react';
import { UserProgress } from '@/data/types';

interface LearningPathScreenProps {
  progress: UserProgress;
  onSelectTopic: (topicKey: string, topicName: string) => void;
  onSelectPack: (packId: string) => void;
}

interface PathNode {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: 'topic' | 'pack';
  color: string;
}

export const PATH_NODES: PathNode[] = [
  { id: 'hiragana', title: 'Bảng chữ Hiragana', subtitle: '46 chữ cái cơ bản & Biến âm', icon: 'あ', type: 'topic', color: 'from-cyan-500 to-blue-600' },
  { id: 'katakana', title: 'Bảng chữ Katakana', subtitle: '46 chữ cái phiên âm từ ngoại nhập', icon: 'ア', type: 'topic', color: 'from-purple-500 to-indigo-600' },
  { id: 'numbers', title: 'Con số Tiếng Nhật', subtitle: 'Luyện đếm số từ 1 đến 99,999', icon: '123', type: 'topic', color: 'from-emerald-500 to-teal-600' },
  { id: 'pack_00', title: 'Gói từ vựng 00', subtitle: 'Thứ, Ngày, Tháng, Năm & Năm sinh', icon: '📅', type: 'pack', color: 'from-amber-500 to-orange-600' },
  { id: 'pack_01', title: 'Gói từ vựng 01', subtitle: 'Danh xưng, Xã hội & Nghề nghiệp', icon: '👤', type: 'pack', color: 'from-pink-500 to-rose-600' },
  { id: 'pack_02', title: 'Gói từ vựng 02', subtitle: 'Mua sắm, Đồ vật & Vật dụng', icon: '🛍️', type: 'pack', color: 'from-violet-500 to-purple-600' },
  { id: 'pack_03', title: 'Gói từ vựng 03', subtitle: 'Địa điểm, Đồ dùng & Mua sắm', icon: '🏫', type: 'pack', color: 'from-sky-500 to-cyan-600' },
  { id: 'review_all', title: 'Ôn tập Tổng hợp', subtitle: 'Tổng hợp tất cả từ vựng của các bài học', icon: '💡', type: 'pack', color: 'from-yellow-400 to-amber-600' },
];

export const LearningPathScreen: React.FC<LearningPathScreenProps> = ({
  progress,
  onSelectTopic,
  onSelectPack,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#131B2E] to-slate-900 border border-slate-800 p-6 sm:p-8 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Lộ trình học 5 bước Active Recall
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bản Đồ Học Tiếng Nhật 🎌
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Tích chọn từng từ vựng mong muốn, học qua Flashcards và luyện tập với 5 Level ghi nhớ chủ động.
            </p>
          </div>
          <button
            onClick={() => onSelectPack('review_all')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            <BookOpen className="w-4 h-4" />
            <span>Kho Ôn Tập Tổng Hop</span>
          </button>
        </div>
      </div>

      {/* Roadmap Node List */}
      <div className="relative space-y-6 before:absolute before:left-8 sm:before:left-1/2 before:top-4 before:bottom-4 before:w-1 before:bg-slate-800/80 before:-translate-x-1/2 z-0">
        {PATH_NODES.map((node, index) => {
          const p = progress[node.id] || 0;
          const isCompleted = p >= 100;
          const isInProgress = p > 0 && p < 100;

          const isEven = index % 2 === 0;

          return (
            <div
              key={node.id}
              className={`relative flex items-center gap-6 z-10 ${
                isEven ? 'sm:flex-row-reverse text-left' : 'sm:flex-row text-left'
              }`}
            >
              {/* Connector Dot */}
              <div className="absolute left-8 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-md">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>

              {/* Node Card */}
              <div className="ml-16 sm:ml-0 sm:w-[calc(50%-2.5rem)] w-full">
                <div
                  onClick={() => {
                    if (node.type === 'topic') {
                      onSelectTopic(node.id, node.title);
                    } else {
                      onSelectPack(node.id);
                    }
                  }}
                  className={`group relative overflow-hidden p-6 rounded-2xl bg-[#131B2E] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                        {node.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                          {node.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {node.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isInProgress
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isCompleted ? 'Hoàn thành 100%' : isInProgress ? `Đang học ${p}%` : 'Sẵn sàng'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                    <span>Mở bài học & Từ vựng ➔</span>
                    <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
