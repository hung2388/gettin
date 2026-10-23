import React, { useState, useEffect, useRef } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface Level5SpeedTypingProps {
  words: WordEntry[];
  onBack: () => void;
  onFinish: (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => void;
}

export const Level5SpeedTyping: React.FC<Level5SpeedTypingProps> = ({ words, onBack, onFinish }) => {
  const [sequence, setSequence] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedWords, setFailedWords] = useState<WordEntry[]>([]);

  const [step, setStep] = useState<'romaji' | 'meaning'>('romaji');
  const [typedInput, setTypedInput] = useState('');

  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [missedList, setMissedList] = useState<WordEntry[]>([]);

  const [startTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const shuffle = [...words].sort(() => Math.random() - 0.5);
    setSequence(shuffle);
    setCurrentIndex(0);
  }, [words]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const currentWord = sequence[currentIndex];

  useEffect(() => {
    setStep('romaji');
    setTypedInput('');
    setIsEvaluated(false);
    setIsForgot(false);
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex, currentWord]);

  const handleNextQuestion = () => {
    if (currentIndex + 1 < sequence.length) {
      setCurrentIndex((prev) => prev + 1);
    } else if (failedWords.length > 0) {
      setSequence([...failedWords].sort(() => Math.random() - 0.5));
      setFailedWords([]);
      setCurrentIndex(0);
    } else {
      onFinish({
        correct: correctCount,
        mistakes: mistakeCount,
        missed: missedList,
      });
    }
  };

  const handleForgot = () => {
    if (!currentWord || isEvaluated) return;
    setIsEvaluated(true);
    setIsForgot(true);
    speakJapanese(currentWord.kana || currentWord.word);
    setMistakeCount((prev) => prev + 1);
    setMissedList((prev) => [...prev, currentWord]);
    setFailedWords((prev) => [...prev, currentWord]);
  };

  // Real-time check for Step 1 (Romaji)
  useEffect(() => {
    if (!currentWord || isEvaluated || step !== 'romaji') return;

    const val = typedInput.trim().toLowerCase();
    const targetRomaji = (currentWord.romaji || '').toLowerCase().trim();
    const targetWord = currentWord.word.toLowerCase().trim();
    const targetKana = (currentWord.kana || '').toLowerCase().trim();

    if (val && (val === targetRomaji || val === targetWord || val === targetKana)) {
      speakJapanese(currentWord.kana || currentWord.word);
      setStep('meaning');
      setTypedInput('');
    }
  }, [typedInput, currentWord, isEvaluated, step]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isEvaluated) {
        e.preventDefault();
        handleNextQuestion();
        return;
      }

      if (!typedInput.trim()) {
        e.preventDefault();
        handleForgot();
        return;
      }

      if (step === 'meaning') {
        e.preventDefault();
        const val = typedInput.trim().toLowerCase();
        const targetMeaning = currentWord.meaning.toLowerCase().trim();

        if (targetMeaning.includes(val) || val.includes(targetMeaning)) {
          setCorrectCount((prev) => prev + 1);
          handleNextQuestion();
        } else {
          handleForgot();
        }
      }
    }
  };

  if (!currentWord) return null;

  const wpm =
    elapsedSec > 0 && correctCount > 0
      ? Math.round((correctCount / elapsedSec) * 60)
      : 0;

  const remainingQueue = sequence.slice(currentIndex);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161722] hover:bg-[#20222f] text-zinc-300 text-xs font-semibold border border-[#232533] transition-all"
        >
          <PixelIcon name="arrow-left" size={12} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Level 5: Tốc Độ Gõ (Speed Typing)
        </h2>
      </div>

      {/* Progress & Speed Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] mb-6 text-xs font-bold">
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-red-400">✗ Sai/Quên: {mistakeCount}</span>
          <span className="text-amber-400 font-mono">⚡ {wpm} WPM</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300 font-mono">
          <PixelIcon name="timer" size={14} className="text-red-400" />
          <span>{elapsedSec}s</span>
        </div>
      </div>

      {/* Dynamic Queue Stream Bar */}
      <div className="p-3 rounded-2xl bg-[#0e0f15] border border-[#222432] mb-6 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {remainingQueue.map((w, idx) => {
          const isCurrent = idx === 0;
          return (
            <span
              key={idx}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-jp whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-red-500 text-white scale-105 shadow-md shadow-red-500/30 font-extrabold'
                  : 'bg-[#181924] text-zinc-400 opacity-60'
              }`}
            >
              {w.word}
            </span>
          );
        })}
      </div>

      {/* Main Kanji/Kana Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#121319] border border-[#232635] text-center mb-6 shadow-2xl relative">
        <div className="text-6xl sm:text-7xl font-black text-white font-jp mb-3">
          {currentWord.word}
        </div>

        {/* Step Indicator */}
        {!isEvaluated && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#181924] border border-[#252837] text-red-400">
            {step === 'romaji' ? '1️⃣ Gõ Romaji cách đọc' : '2️⃣ Gõ Nghĩa Tiếng Việt'}
          </div>
        )}

        {/* Answer Revealed when Forgot */}
        {isEvaluated && isForgot && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-300">
            <div className="text-xs font-bold uppercase tracking-wider mb-1 text-red-400">
              ĐÃ BỎ QUA / XÁC NHẬN QUÊN TỪ:
            </div>
            <div className="text-lg font-black text-white font-jp mb-1">
              {currentWord.word} {currentWord.kana && `[${currentWord.kana}]`}
            </div>
            <div className="text-xs font-bold text-emerald-400 mb-2">
              Romaji: <span className="font-mono">{currentWord.romaji}</span> | Nghĩa: {currentWord.meaning}
            </div>
            <div className="text-xs font-bold text-red-400 animate-pulse">
              Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="relative space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEvaluated}
          placeholder={
            isEvaluated
              ? 'Nhấn [Enter] để chuyển câu tiếp theo...'
              : step === 'romaji'
              ? 'Bước 1: Gõ Romaji...'
              : 'Bước 2: Gõ nghĩa Tiếng Việt...'
          }
          autoFocus
          className={`w-full px-6 py-4 rounded-2xl bg-[#14151e] border-2 text-center text-xl font-bold text-white outline-none shadow-xl transition-all ${
            isEvaluated
              ? 'border-red-500 bg-red-950/20 text-red-300'
              : 'border-[#242635] focus:border-red-500'
          }`}
        />

        <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
          <span>💡 Gõ đúng Romaji ➔ Tự động nhảy sang gõ Nghĩa</span>
          {isEvaluated ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c93b3b] text-white font-extrabold text-xs shadow-md hover:bg-[#e74c3c]"
            >
              <span>Chuyển câu tiếp (Enter)</span>
              <PixelIcon name="chevron-right" size={10} />
            </button>
          ) : (
            <button
              onClick={handleForgot}
              className="flex items-center gap-1 text-red-400 hover:underline font-bold"
            >
              <PixelIcon name="help" size={12} />
              <span>Nhấn [Enter] nếu quên</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
