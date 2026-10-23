import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface Level4MatchingProps {
  words: WordEntry[];
  onBack: () => void;
  onFinish: (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => void;
}

const BATCH_SIZE = 4;

export const Level4Matching: React.FC<Level4MatchingProps> = ({ words, onBack, onFinish }) => {
  const [remainingWords, setRemainingWords] = useState<WordEntry[]>([]);
  const [currentBatch, setCurrentBatch] = useState<WordEntry[]>([]);
  const [matchedWords, setMatchedWords] = useState<WordEntry[]>([]);

  // Selection states
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);

  const [colKanji, setColKanji] = useState<string[]>([]);
  const [colKana, setColKana] = useState<string[]>([]);
  const [colMeaning, setColMeaning] = useState<string[]>([]);

  const [matchedItems, setMatchedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const shuffleAll = [...words].sort(() => Math.random() - 0.5);
    setRemainingWords(shuffleAll);
  }, [words]);

  useEffect(() => {
    if (remainingWords.length === 0 && currentBatch.length === 0) return;

    if (currentBatch.length === 0 && remainingWords.length > 0) {
      const batchCount = Math.min(BATCH_SIZE, remainingWords.length);
      const nextBatch = remainingWords.slice(0, batchCount);
      const rest = remainingWords.slice(batchCount);

      setRemainingWords(rest);
      setCurrentBatch(nextBatch);

      setColKanji(nextBatch.map((w) => w.word).sort(() => Math.random() - 0.5));
      setColKana(nextBatch.map((w) => w.kana || w.word).sort(() => Math.random() - 0.5));
      setColMeaning(nextBatch.map((w) => w.meaning).sort(() => Math.random() - 0.5));
      setMatchedItems(new Set());
    }
  }, [remainingWords, currentBatch]);

  useEffect(() => {
    if (selectedWord && selectedKana && selectedMeaning) {
      const target = currentBatch.find((w) => w.word === selectedWord);
      if (
        target &&
        (target.kana || target.word) === selectedKana &&
        target.meaning === selectedMeaning
      ) {
        // Matched correctly!
        speakJapanese(target.kana || target.word);
        setMatchedItems((prev) => {
          const next = new Set(prev);
          next.add(selectedWord);
          next.add(selectedKana);
          next.add(selectedMeaning);
          return next;
        });

        const newMatched = [...matchedWords, target];
        setMatchedWords(newMatched);

        setSelectedWord(null);
        setSelectedKana(null);
        setSelectedMeaning(null);

        // Check if current batch finished
        if (newMatched.length % BATCH_SIZE === 0 || newMatched.length === words.length) {
          if (remainingWords.length > 0) {
            setTimeout(() => {
              setCurrentBatch([]);
            }, 600);
          } else {
            setTimeout(() => {
              onFinish({
                correct: newMatched.length,
                mistakes: 0,
                missed: [],
              });
            }, 800);
          }
        }
      } else {
        // Wrong match
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedKana(null);
          setSelectedMeaning(null);
        }, 400);
      }
    }
  }, [selectedWord, selectedKana, selectedMeaning, currentBatch, matchedWords, words.length, remainingWords.length, onFinish]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161722] hover:bg-[#20222f] text-zinc-300 text-xs font-semibold border border-[#232533] transition-all"
        >
          <PixelIcon name="arrow-left" size={12} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Level 4: Ghép Nối Bộ Ba (Matching Grid)
        </h2>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] mb-6 text-xs font-bold">
        <span className="text-red-400">
          Đã ghép đúng: {matchedWords.length} / {words.length}
        </span>
        <span className="text-zinc-400">Chọn 3 mục tương ứng ở 3 cột để ghép đôi</span>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Kanji / Chữ */}
        <div className="p-4 rounded-3xl bg-[#121319] border border-[#232635]">
          <h3 className="text-xs font-extrabold text-red-400 mb-3 tracking-wider uppercase">
            1. KANJI / CHỮ
          </h3>
          <div className="space-y-2.5">
            {colKanji.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedWord === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedWord(item)}
                  disabled={isMatched}
                  className={`w-full p-3.5 rounded-2xl border font-extrabold text-base transition-all font-jp ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md'
                      : 'bg-[#181924] border-[#252837] text-white hover:border-red-500/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Kana */}
        <div className="p-4 rounded-3xl bg-[#121319] border border-[#232635]">
          <h3 className="text-xs font-extrabold text-zinc-300 mb-3 tracking-wider uppercase">
            2. KANA
          </h3>
          <div className="space-y-2.5">
            {colKana.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedKana === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedKana(item)}
                  disabled={isMatched}
                  className={`w-full p-3.5 rounded-2xl border font-bold text-sm transition-all font-jp ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md'
                      : 'bg-[#181924] border-[#252837] text-white hover:border-red-500/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 3: Meaning */}
        <div className="p-4 rounded-3xl bg-[#121319] border border-[#232635]">
          <h3 className="text-xs font-extrabold text-zinc-300 mb-3 tracking-wider uppercase">
            3. Ý NGHĨA TIẾNG VIỆT
          </h3>
          <div className="space-y-2.5">
            {colMeaning.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedMeaning === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedMeaning(item)}
                  disabled={isMatched}
                  className={`w-full p-3.5 rounded-2xl border font-bold text-xs transition-all ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md'
                      : 'bg-[#181924] border-[#252837] text-white hover:border-red-500/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
