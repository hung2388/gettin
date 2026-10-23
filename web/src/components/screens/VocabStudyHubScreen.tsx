import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
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

  // Drag select state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'select' | 'deselect' | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

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

  const handleMouseDown = (idx: number) => {
    setIsDragging(true);
    const willSelect = !selectedIndices.has(idx);
    setDragAction(willSelect ? 'select' : 'deselect');

    const next = new Set(selectedIndices);
    if (willSelect) next.add(idx);
    else next.delete(idx);
    updateIndices(next);
  };

  const handleMouseEnter = (idx: number) => {
    if (isDragging && dragAction) {
      const next = new Set(selectedIndices);
      if (dragAction === 'select') next.add(idx);
      else next.delete(idx);
      updateIndices(next);
    }
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
    {
      num: 1,
      title: 'Level 1: Trắc Nghiệm Kép',
      desc: 'Học từ mới qua 2 câu hỏi đồng thời (chọn Kana & chọn Nghĩa tiếng Việt).',
    },
    {
      num: 2,
      title: 'Level 2: Active Recall',
      desc: 'Chủ động hồi tưởng từ vựng. Nhìn nghĩa tiếng Việt để gõ lại Kanji/Kana.',
    },
    {
      num: 3,
      title: 'Level 3: Luyện Nghe (Listening)',
      desc: 'Nghe phát âm liên tiếp, sau đó điền nghĩa tương ứng.',
    },
    {
      num: 4,
      title: 'Level 4: Ghép Bộ Ba (Matching Grid)',
      desc: 'Ghép nối bộ ba tương ứng: Kanji ↔️ Kana ↔️ Nghĩa tiếng Việt.',
    },
    {
      num: 5,
      title: 'Level 5: Phản Xạ Gõ Nhanh (Speed Typing)',
      desc: 'Trượt chuỗi từ liên tục và gõ Romaji luyện phản xạ tốc độ.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161722] hover:bg-[#20222f] text-zinc-300 text-xs font-semibold border border-[#232533] transition-all"
        >
          <PixelIcon name="arrow-left" size={12} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          {pack?.name || 'Gói Từ Vựng'}
        </h2>
      </div>

      {/* Tab Nav */}
      <div className="flex rounded-2xl bg-[#13141c] border border-[#212330] p-1.5 mb-6">
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'vocab'
              ? 'bg-zinc-100 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Danh sách Từ ({selectedWords.length}/{words.length})
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'flashcards'
              ? 'bg-zinc-100 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Flashcards ({selectedWords.length})
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'levels'
              ? 'bg-zinc-100 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          5 Level Active Recall
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-[#12131a] border border-[#20222d] rounded-3xl p-5 sm:p-6 shadow-xl">
        {activeTab === 'vocab' && (
          <div>
            {/* Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#171822] border border-[#242635] mb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <span>📌 Đã chọn: {selectedIndices.size} / {words.length} từ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202230] hover:bg-[#2b2e40] text-zinc-200 text-xs font-semibold"
                >
                  <PixelIcon name="check-square" size={12} />
                  <span>Chọn tất cả</span>
                </button>
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202230] hover:bg-[#2b2e40] text-zinc-200 text-xs font-semibold"
                >
                  <PixelIcon name="square" size={12} />
                  <span>Bỏ chọn</span>
                </button>
                <button
                  onClick={invertSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202230] hover:bg-[#2b2e40] text-zinc-200 text-xs font-semibold"
                >
                  <PixelIcon name="refresh" size={12} />
                  <span>Đảo chọn</span>
                </button>
              </div>
            </div>

            {/* Word List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2">
              {words.map((item, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(idx);
                    }}
                    onMouseEnter={() => handleMouseEnter(idx)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#1a1b26] border-[#34374b] text-white shadow-sm'
                        : 'bg-[#14151e]/50 border-[#1f202b] text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-red-500 border-red-400 text-white'
                            : 'border-zinc-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <PixelIcon name="check" size={10} color="#fff" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-white font-jp">
                          {item.word}{' '}
                          {item.kana && item.kana !== item.word && (
                            <span className="text-xs font-normal text-zinc-400">[{item.kana}]</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-300">{item.meaning}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakJapanese(item.kana || item.word);
                        }}
                        className="p-2 rounded-xl bg-[#202230] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                        title="Phát âm"
                      >
                        <PixelIcon name="volume" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="py-6 text-center max-w-lg mx-auto">
            {selectedWords.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                ⚠️ Chưa có từ vựng nào được chọn. Vui lòng quay lại tab "Danh sách Từ" và tích chọn ít nhất 1 từ!
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-4">
                  Thẻ {fcIndex + 1} / {selectedWords.length}
                </div>

                {/* Flip Card */}
                <div
                  onClick={() => setFcFlipped(!fcFlipped)}
                  className={`w-full h-72 rounded-3xl border cursor-pointer flex flex-col items-center justify-center p-6 transition-all duration-300 transform select-none ${
                    fcFlipped
                      ? 'bg-gradient-to-br from-[#1b1c28] to-[#12131a] border-emerald-500/50'
                      : 'bg-gradient-to-br from-[#161722] to-[#0f1017] border-[#292c3d] hover:border-red-500/40 hover:scale-[1.01]'
                  }`}
                >
                  {fcFlipped ? (
                    <div>
                      <div className="text-2xl font-extrabold text-emerald-400 mb-2 font-jp">
                        {currentFcWord?.meaning}
                      </div>
                      {currentFcWord?.kana && currentFcWord.kana !== currentFcWord.word && (
                        <div className="text-sm font-bold text-zinc-300 font-jp">
                          [{currentFcWord.kana}]
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl font-black text-white font-jp mb-4">
                        {currentFcWord?.word}
                      </div>
                      <div className="text-xs text-zinc-400">Bấm để lật thẻ</div>
                    </div>
                  )}
                </div>

                {/* Flashcard Nav Actions */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={prevCard}
                    className="px-5 py-2.5 rounded-xl bg-[#1c1d27] hover:bg-[#272937] text-white text-xs font-bold"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => speakJapanese(currentFcWord?.kana || currentFcWord?.word || '')}
                    className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold flex items-center gap-2"
                  >
                    <PixelIcon name="volume" size={14} />
                    <span>Phát âm</span>
                  </button>
                  <button
                    onClick={nextCard}
                    className="px-5 py-2.5 rounded-xl bg-[#1c1d27] hover:bg-[#272937] text-white text-xs font-bold"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-[#171822] border border-[#242635] flex items-center justify-between text-xs font-bold text-zinc-300">
              <span>🎯 Đã chọn: {selectedWords.length} / {words.length} từ vựng</span>
            </div>

            {/* Level Cards */}
            <div className="space-y-3">
              {levelsList.map((lvl) => (
                <div
                  key={lvl.num}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#161722] border border-[#242635] hover:border-red-500/40 transition-all"
                >
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white">{lvl.title}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{lvl.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedWords.length === 0) {
                        alert('Vui lòng chọn ít nhất 1 từ vựng trong tab "Danh sách Từ"!');
                        return;
                      }
                      onStartLevel(lvl.num, selectedWords);
                    }}
                    className="px-5 py-2 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all self-end sm:self-auto"
                  >
                    Bắt đầu ➔
                  </button>
                </div>
              ))}

              {/* Handwriting Practice Option */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#191522] border border-[#3b284c]">
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-purple-300 flex items-center gap-2">
                    <PixelIcon name="pen" size={14} className="text-purple-400" />
                    <span>Luyện viết nét Kanji & Kana (Handwriting)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tập vẽ nét chữ trực tiếp bằng chuột hoặc màn hình cảm ứng HTML5 Canvas.
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
                  className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all self-end sm:self-auto"
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
