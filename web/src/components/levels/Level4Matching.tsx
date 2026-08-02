import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
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

  // Check matching triplet when selections change
  useEffect(() => {
    if (selectedWord && selectedKana && selectedMeaning) {
      const target = currentBatch.find((w) => w.word === selectedWord);
      if (
        target &&
        (target.kana || target.word) === selectedKana &&
        target.meaning === selectedMeaning
      ) {
        speakJapanese(target.word);
        const newMatched = new Set(matchedItems);
        newMatched.add(selectedWord);
        newMatched.add(selectedKana);
        newMatched.add(selectedMeaning);
        setMatchedItems(newMatched);
        setMatchedWords((prev) => [...prev, target]);

        // Clear choices
        setSelectedWord(null);
        setSelectedKana(null);
        setSelectedMeaning(null);

        // Check if batch is completed
        if (newMatched.size === currentBatch.length * 3) {
          setTimeout(() => {
            if (remainingWords.length === 0) {
              onFinish({ correct: words.length, mistakes: 0, missed: [] });
            } else {
              setCurrentBatch([]);
            }
          }, 800);
        }
      } else {
        // Reset selections on mismatch
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedKana(null);
          setSelectedMeaning(null);
        }, 400);
      }
    }
  }, [selectedWord, selectedKana, selectedMeaning]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-xl font-extrabold text-white">Level 4: Ghép Bộ Ba Tương Ứng 🧩</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131B2E] border border-slate-800 mb-6 text-xs font-bold">
        <span className="text-cyan-400">Đã ghép: {matchedWords.length} / {words.length} từ</span>
        <span className="text-purple-400">Chọn 3 mục tương ứng ở 3 cột để ghép đôi</span>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Kanji / Chữ */}
        <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800">
          <h3 className="text-xs font-extrabold text-cyan-400 mb-4 tracking-wider uppercase">
            1. KANJI / CHỮ
          </h3>
          <div className="space-y-3">
            {colKanji.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedWord === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedWord(item)}
                  disabled={isMatched}
                  className={`w-full p-4 rounded-2xl border font-extrabold text-lg transition-all font-jp ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-cyan-500/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Kana */}
        <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800">
          <h3 className="text-xs font-extrabold text-teal-400 mb-4 tracking-wider uppercase">
            2. KANA
          </h3>
          <div className="space-y-3">
            {colKana.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedKana === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedKana(item)}
                  disabled={isMatched}
                  className={`w-full p-4 rounded-2xl border font-bold text-base transition-all font-jp ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-teal-500/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 3: Meaning */}
        <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800">
          <h3 className="text-xs font-extrabold text-purple-400 mb-4 tracking-wider uppercase">
            3. Ý NGHĨA TIẾNG VIỆT
          </h3>
          <div className="space-y-3">
            {colMeaning.map((item, idx) => {
              const isMatched = matchedItems.has(item);
              const isSelected = selectedMeaning === item;
              return (
                <button
                  key={idx}
                  onClick={() => !isMatched && setSelectedMeaning(item)}
                  disabled={isMatched}
                  className={`w-full p-4 rounded-2xl border font-bold text-xs transition-all ${
                    isMatched
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 line-through opacity-40'
                      : isSelected
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-purple-500/40'
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
