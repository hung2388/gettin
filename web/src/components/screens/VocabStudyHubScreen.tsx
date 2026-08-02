import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, CheckSquare, Square, RefreshCw, Sparkles, Play, PenTool } from 'lucide-react';
import { VocabPack, WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';
import { getVocabPack, loadSelectedIndices, saveSelectedIndices } from '@/data/storage';

interface VocabStudyHubScreenProps {
  packId: string;
  onBack: () => void;
  onStartLevel: (levelNum: number, selectedWords: WordEntry[]) => void;
  onStartHandwriting: (selectedWords: WordEntry[]) => void;
}

export const VocabStudyHubScreen: React.FC<VocabStudyHubScreenProps> = ({
  packId,
  onBack,
  onStartLevel,
  onStartHandwriting,
}) => {
  const pack = getVocabPack(packId);
  const words = pack ? pack.words : [];

  const [activeTab, setActiveTab] = useState<'vocab' | 'flashcards' | 'levels'>('vocab');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Flashcard state
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  useEffect(() => {
    if (words.length > 0) {
      const saved = loadSelectedIndices(packId, words.length);
      setSelectedIndices(new Set(saved));
    }
  }, [packId, words.length]);

  const updateIndices = (newSet: Set<number>) => {
    setSelectedIndices(newSet);
    saveSelectedIndices(packId, Array.from(newSet));
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

  // Flashcards navigation
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

  const levelsList = [
    { num: 1, title: '🎯 Level 1: Learn & Multiple Choice', desc: 'Học từ mới qua 2 câu hỏi trắc nghiệm đồng thời (chọn Kana & Nghĩa).' },
    { num: 2, title: '🤔 Level 2: Active Recall', desc: 'Chủ động hồi tưởng từ vựng. Nhìn nghĩa tiếng Việt để gõ lại Kanji/Kana.' },
    { num: 3, title: '🎧 Level 3: Listening Test', desc: 'Nghe hệ thống phát âm 10 từ liên tiếp, sau đó có 25s để điền nghĩa tiếng Việt.' },
    { num: 4, title: '🧩 Level 4: Word Matching Grid', desc: 'Ghép nối bộ ba tương ứng: Kanji ↔️ Kana ↔️ Nghĩa tiếng Việt.' },
    { num: 5, title: '⚡ Level 5: Speed Typing Stream', desc: 'Tự động trượt chuỗi từ và gõ Romaji luyện phản xạ tốc độ.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Kho từ vựng
        </button>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          {pack?.name || 'Gói Từ Vựng'} 🎌
        </h2>
      </div>

      {/* Tab Nav */}
      <div className="flex p-1.5 rounded-2xl bg-[#131B2E] border border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'vocab'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📖 Danh sách Từ vựng
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'flashcards'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎴 Flashcards ({selectedWords.length})
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'levels'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Luyện tập Active Recall (5 Level)
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 shadow-xl">
        {activeTab === 'vocab' && (
          <div>
            {/* Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-400">
                <span>📌 Đã chọn: {selectedIndices.size} / {words.length} từ để học</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-teal-400" /> Chọn tất cả
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

            {/* List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {words.map((item, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleWord(idx)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/60 border-teal-500/40'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 rounded accent-teal-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-extrabold text-xl text-white font-jp">
                          {item.word} {item.kana && item.kana !== item.word && <span className="text-sm font-normal text-slate-400">[{item.kana}]</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-teal-300">{item.meaning}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakJapanese(item.word);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-400 transition-colors"
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
                ⚠️ Chưa có từ vựng nào được chọn. Vui lòng quay lại tab "Danh sách Từ vựng" và tích chọn các từ bạn muốn học!
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
                      ? 'bg-gradient-to-br from-purple-950/60 to-slate-900 border-purple-500/60'
                      : 'bg-gradient-to-br from-slate-900 via-[#162035] to-slate-900 border-teal-500/60 hover:scale-[1.02]'
                  }`}
                >
                  {fcFlipped ? (
                    <div>
                      <div className="text-3xl font-extrabold text-purple-300 mb-2">{currentFcWord?.meaning}</div>
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
                    className="px-5 py-2.5 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 text-sm font-bold flex items-center gap-2"
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

        {activeTab === 'levels' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-bold text-teal-400">
              <span>🎯 Phạm vi luyện tập: Đã chọn {selectedWords.length} / {words.length} từ vựng</span>
            </div>

            {/* Level Options */}
            <div className="space-y-3">
              {levelsList.map((lvl) => (
                <div
                  key={lvl.num}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all"
                >
                  <div>
                    <h4 className="font-extrabold text-base text-white">{lvl.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{lvl.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedWords.length === 0) {
                        alert('Vui lòng chọn ít nhất 1 từ vựng trong tab "Danh sách Từ vựng"!');
                        return;
                      }
                      onStartLevel(lvl.num, selectedWords);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 transition-all self-end sm:self-auto"
                  >
                    Bắt đầu ⛩️
                  </button>
                </div>
              ))}

              {/* Handwriting Practice Option */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30">
                <div>
                  <h4 className="font-extrabold text-base text-purple-300 flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> ✍️ Luyện viết Kanji & Kana (Handwriting Practice)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Luyện vẽ nét trực tiếp bằng chuột hoặc màn hình cảm ứng HTML5 Canvas.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (selectedWords.length === 0) {
                      alert('Vui lòng chọn ít nhất 1 từ vựng!');
                      return;
                    }
                    onStartHandwriting(selectedWords);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition-all self-end sm:self-auto"
                >
                  Luyện viết ✍️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
