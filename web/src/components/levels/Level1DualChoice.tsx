import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, ArrowRight } from 'lucide-react';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface Level1DualChoiceProps {
  words: WordEntry[];
  allPackWords: WordEntry[];
  onBack: () => void;
  onFinish: (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => void;
}

export const Level1DualChoice: React.FC<Level1DualChoiceProps> = ({
  words,
  allPackWords,
  onBack,
  onFinish,
}) => {
  const [pool, setPool] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedWords, setFailedWords] = useState<WordEntry[]>([]);

  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isBothCorrectState, setIsBothCorrectState] = useState<boolean | null>(null);

  const [kanaChoices, setKanaChoices] = useState<string[]>([]);
  const [meaningChoices, setMeaningChoices] = useState<string[]>([]);

  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [missedList, setMissedList] = useState<WordEntry[]>([]);

  useEffect(() => {
    const initialPool = [...words].sort(() => Math.random() - 0.5);
    setPool(initialPool);
    setCurrentIndex(0);
  }, [words]);

  const currentWord = pool[currentIndex];

  useEffect(() => {
    if (!currentWord) return;

    // Reset choices & selections
    setSelectedKana(null);
    setSelectedMeaning(null);
    setIsEvaluated(false);
    setIsBothCorrectState(null);

    const distractorSource = allPackWords.length >= 4 ? allPackWords : words;

    // Kana choices
    const correctKana = currentWord.kana || currentWord.word;
    const kanaSet = new Set<string>([correctKana]);
    const shuffleDist = [...distractorSource].sort(() => Math.random() - 0.5);
    for (const item of shuffleDist) {
      const k = item.kana || item.word;
      if (k !== correctKana) kanaSet.add(k);
      if (kanaSet.size >= 4) break;
    }
    setKanaChoices(Array.from(kanaSet).sort(() => Math.random() - 0.5));

    // Meaning choices
    const correctMeaning = currentWord.meaning;
    const meaningSet = new Set<string>([correctMeaning]);
    for (const item of shuffleDist) {
      if (item.meaning !== correctMeaning) meaningSet.add(item.meaning);
      if (meaningSet.size >= 4) break;
    }
    setMeaningChoices(Array.from(meaningSet).sort(() => Math.random() - 0.5));
  }, [currentIndex, currentWord]);

  const handleNextQuestion = () => {
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex((prev) => prev + 1);
    } else if (failedWords.length > 0) {
      setPool([...failedWords].sort(() => Math.random() - 0.5));
      setFailedWords([]);
      setCurrentIndex(0);
    } else {
      onFinish({ correct: correctCount + (isBothCorrectState ? 1 : 0), mistakes: mistakeCount, missed: missedList });
    }
  };

  const handleForgot = () => {
    if (!currentWord || isEvaluated) return;
    setIsEvaluated(true);
    setIsBothCorrectState(false);
    setMistakeCount((prev) => prev + 1);

    if (!missedList.some((w) => w.word === currentWord.word)) {
      setMissedList((prev) => [...prev, currentWord]);
    }
    setFailedWords((prev) => [...prev, currentWord]);
    // User must press Enter again to advance!
  };

  // Keyboard shortcut: Press Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isEvaluated) {
          handleNextQuestion();
        } else {
          handleForgot();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEvaluated, currentWord]);

  const evaluateAnswer = (kanaVal: string | null, meaningVal: string | null) => {
    if (!currentWord || isEvaluated || !kanaVal || !meaningVal) return;

    const targetKana = currentWord.kana || currentWord.word;
    const isKanaCorrect = kanaVal === targetKana;
    const isMeaningCorrect = meaningVal === currentWord.meaning;
    const isBothCorrect = isKanaCorrect && isMeaningCorrect;

    setIsEvaluated(true);
    setIsBothCorrectState(isBothCorrect);

    if (isBothCorrect) {
      speakJapanese(currentWord.word);
      setCorrectCount((prev) => prev + 1);

      setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    } else {
      setMistakeCount((prev) => prev + 1);
      if (!missedList.some((w) => w.word === currentWord.word)) {
        setMissedList((prev) => [...prev, currentWord]);
      }
      setFailedWords((prev) => [...prev, currentWord]);
      // User must press Enter again to advance!
    }
  };

  const handleSelectKana = (val: string) => {
    if (isEvaluated) return;
    setSelectedKana(val);
    if (selectedMeaning) evaluateAnswer(val, selectedMeaning);
  };

  const handleSelectMeaning = (val: string) => {
    if (isEvaluated) return;
    setSelectedMeaning(val);
    if (selectedKana) evaluateAnswer(selectedKana, val);
  };

  if (!currentWord) return null;

  const targetKana = currentWord.kana || currentWord.word;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-xl font-extrabold text-white">Level 1: Học từ mới & Trắc nghiệm Kép 🎯</h2>
      </div>

      {/* Progress & Stats Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131B2E] border border-slate-800 mb-6 text-xs font-bold">
        <span className="text-cyan-400">Từ vựng: {currentIndex + 1} / {pool.length}</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-rose-400">✗ Sai/Quên: {mistakeCount}</span>
        </div>
      </div>

      {/* Word Card Display */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#131B2E] to-slate-900 border border-cyan-500/30 text-center mb-6 shadow-2xl relative">
        <div className="text-6xl font-black text-white font-jp mb-3">{currentWord.word}</div>
        <div className="text-xs text-slate-400">Vui lòng chọn đồng thời Kana & Nghĩa Tiếng Việt tương ứng:</div>

        {isEvaluated && !isBothCorrectState && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 animate-fadeIn">
            <div className="text-xs font-bold uppercase mb-1">❌ ĐÃ XÁC NHẬN QUÊN / CHỌN SAI - ĐÁP ÁN ĐÚNG ĐƯỢC TÔ XANH BÊN DƯỚI</div>
            <div className="text-xs font-bold text-cyan-300 animate-pulse mt-1">
              ⌨️ Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
            </div>
          </div>
        )}

        {!isEvaluated && (
          <button
            onClick={handleForgot}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Bấm [Enter] nếu quên
          </button>
        )}
      </div>

      {/* Dual Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Kana Options */}
        <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800">
          <h3 className="text-sm font-extrabold text-cyan-400 mb-4 flex items-center gap-2">
            <span>1. Chọn cách đọc KANA</span>
          </h3>
          <div className="space-y-3">
            {kanaChoices.map((choice, i) => {
              const isSelected = selectedKana === choice;
              const isCorrect = choice === targetKana;
              let btnStyle = 'bg-slate-900 border-slate-800 text-white hover:border-cyan-500/40';

              if (isEvaluated) {
                if (isCorrect) btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20';
                else if (isSelected && !isCorrect) btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
              } else if (isSelected) {
                btnStyle = 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectKana(choice)}
                  disabled={isEvaluated}
                  className={`w-full p-4 rounded-2xl border text-base font-extrabold transition-all ${btnStyle}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Meaning Options */}
        <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800">
          <h3 className="text-sm font-extrabold text-purple-400 mb-4 flex items-center gap-2">
            <span>2. Chọn NGHĨA Tiếng Việt</span>
          </h3>
          <div className="space-y-3">
            {meaningChoices.map((choice, i) => {
              const isSelected = selectedMeaning === choice;
              const isCorrect = choice === currentWord.meaning;
              let btnStyle = 'bg-slate-900 border-slate-800 text-white hover:border-purple-500/40';

              if (isEvaluated) {
                if (isCorrect) btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20';
                else if (isSelected && !isCorrect) btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
              } else if (isSelected) {
                btnStyle = 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectMeaning(choice)}
                  disabled={isEvaluated}
                  className={`w-full p-4 rounded-2xl border text-sm font-bold transition-all ${btnStyle}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isEvaluated && !isBothCorrectState && (
        <div className="mt-6 text-center">
          <button
            onClick={handleNextQuestion}
            className="px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all inline-flex items-center gap-2"
          >
            <span>Chuyển câu tiếp theo (Nhấn Enter)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
