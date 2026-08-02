import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, CheckSquare, Square, RefreshCw, Sparkles, Play, Layers } from 'lucide-react';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';
import { loadSelectedIndices, saveSelectedIndices } from '@/data/storage';

interface TopicDetailsScreenProps {
  topicKey: string;
  topicName: string;
  words: WordEntry[];
  onBack: () => void;
  onStartQuiz: (selectedWords: WordEntry[]) => void;
}

export const TopicDetailsScreen: React.FC<TopicDetailsScreenProps> = ({
  topicKey,
  topicName,
  words,
  onBack,
  onStartQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'flashcards' | 'quiz'>('vocab');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Flashcards state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  useEffect(() => {
    const saved = loadSelectedIndices(topicKey, words.length);
    setSelectedIndices(new Set(saved));
  }, [topicKey, words]);

  const updateIndices = (newSet: Set<number>) => {
    setSelectedIndices(newSet);
    saveSelectedIndices(topicKey, Array.from(newSet));
  };

  const toggleWord = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    updateIndices(next);
  };

  const selectAll = () => updateIndices(new Set(words.map((_, i) => i)));
  const deselectAll = () => updateIndices(new Set());
  const invertSelection = () => {
    const next = new Set<number>();
    words.forEach((_, i) => {
      if (!selectedIndices.has(i)) next.add(i);
    });
    updateIndices(next);
  };

  const selectedWords = words.filter((_, i) => selectedIndices.has(i));

  // Flashcard controls
  const currentFcWord = selectedWords[fcIndex] || null;
  const nextCard = () => {
    if (selectedWords.length === 0) return;
    setFcIndex((prev) => (prev + 1) % selectedWords.length);
    setFcFlipped(false);
  };
  const prevCard = () => {
    if (selectedWords.length === 0) return;
    setFcIndex((prev) => (prev - 1 + selectedWords.length) % selectedWords.length);
    setFcFlipped(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bản đồ
        </button>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          {topicName} 🎌
        </h2>
      </div>

      {/* Tabs Selector */}
      <div className="flex p-1.5 rounded-2xl bg-[#131B2E] border border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'vocab'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📖 Danh sách Từ vựng
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'flashcards'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎴 Thẻ Ghi Nhớ (Flashcards)
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'quiz'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Luyện tập & Thử thách
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 shadow-xl">
        {activeTab === 'vocab' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <span>📌 Đã chọn: {selectedIndices.size} / {words.length} từ để học</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> Chọn tất cả
                </button>
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  <Square className="w-3.5 h-3.5 text-rose-400" /> Bỏ chọn tất cả
                </button>
                <button
                  onClick={invertSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Đảo chọn
                </button>
              </div>
            </div>

            {/* Word List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {words.map((item, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleWord(idx)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/60 border-cyan-500/40'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-extrabold text-xl text-white font-jp">
                          {item.word} {item.kana && item.kana !== item.word && <span className="text-sm font-normal text-slate-400">[{item.kana}]</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-cyan-300">{item.meaning}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakJapanese(item.word);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                        title="Phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="py-8 text-center max-w-xl mx-auto">
            {selectedWords.length === 0 ? (
              <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                ⚠️ Bạn chưa chọn từ vựng nào. Vui lòng quay lại tab "Danh sách Từ vựng" và tích chọn ít nhất 1 từ!
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-4">
                  Thẻ {fcIndex + 1} / {selectedWords.length}
                </div>

                {/* Flip Card */}
                <div
                  onClick={() => setFcFlipped(!fcFlipped)}
                  className={`w-full h-72 rounded-3xl border-2 cursor-pointer flex flex-col items-center justify-center p-6 transition-all duration-300 transform ${
                    fcFlipped
                      ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/60'
                      : 'bg-gradient-to-br from-slate-900 via-[#162035] to-slate-900 border-cyan-500/60 hover:scale-[1.02]'
                  }`}
                >
                  {fcFlipped ? (
                    <div>
                      <div className="text-3xl font-extrabold text-emerald-400 mb-2">{currentFcWord?.meaning}</div>
                      {currentFcWord?.kana && currentFcWord.kana !== currentFcWord.word && (
                        <div className="text-sm font-bold text-cyan-400 font-jp">[{currentFcWord.kana}]</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl font-black text-white font-jp mb-4">{currentFcWord?.word}</div>
                      <div className="text-xs text-slate-400">Bấm để lật thẻ</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={prevCard}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => speakJapanese(currentFcWord?.word || '')}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-bold flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" /> Phát âm
                  </button>
                  <button
                    onClick={nextCard}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="py-8 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Bắt đầu Bài Thi & Kiểm Tra</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bài thi bao gồm trắc nghiệm nhập Romaji và Luyện tốc độ gõ (Speed Typing) cho {selectedWords.length} từ đã chọn.
            </p>
            <button
              onClick={() => {
                if (selectedWords.length === 0) {
                  alert('Vui lòng chọn ít nhất 1 từ vựng để học!');
                  return;
                }
                onStartQuiz(selectedWords);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-lg shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
            >
              ⛩️ Bắt Đầu Bài Thi Ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
