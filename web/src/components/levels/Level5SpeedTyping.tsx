import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Timer, HelpCircle, ArrowRight } from 'lucide-react';
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

  // Step state: 'romaji' (Step 1) -> 'meaning' (Step 2)
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
      onFinish({ correct: correctCount + 1, mistakes: mistakeCount, missed: missedList });
    }
  };

  const handleForgot = () => {
    if (!currentWord || isEvaluated) return;
    setIsEvaluated(true);
    setIsForgot(true);
    setMistakeCount((prev) => prev + 1);

    if (!missedList.some((w) => w.word === currentWord.word)) {
      setMissedList((prev) => [...prev, currentWord]);
    }
    setFailedWords((prev) => [...prev, currentWord]);
    // Note: User must press Enter again to advance!
  };

  // Input change handler for Step 1 & Step 2
  useEffect(() => {
    if (!currentWord || isEvaluated) return;

    const val = typedInput.trim().toLowerCase();
    if (!val) return;

    const targetRomaji = currentWord.romaji.toLowerCase().replace(/\s+/g, '');
    const targetWord = currentWord.word.toLowerCase();
    const targetKana = (currentWord.kana || '').toLowerCase();
    const targetMeaning = currentWord.meaning.toLowerCase();

    // Step 1: Type Romaji
    if (step === 'romaji') {
      if (val === targetRomaji || val === targetWord || val === targetKana) {
        setStep('meaning');
        setTypedInput('');
      }
    }
    // Step 2: Type Vietnamese Meaning
    else if (step === 'meaning') {
      if (val === targetMeaning || targetMeaning.includes(val)) {
        setIsEvaluated(true);
        speakJapanese(currentWord.word);
        setCorrectCount((prev) => prev + 1);

        setTimeout(() => {
          handleNextQuestion();
        }, 800);
      }
    }
  }, [typedInput, step, currentWord, isEvaluated]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If already evaluated (admitted forgot or wrong), pressing Enter advances to next question!
      if (isEvaluated) {
        handleNextQuestion();
        return;
      }

      // First Enter press: admit forgetting!
      handleForgot();
    }
  };

  if (!currentWord) return null;

  const wpm = elapsedSec > 0 ? Math.round((correctCount / elapsedSec) * 60) : 0;

  // Stream Queue: Render remaining words starting from current word (index 0)
  const remainingQueue = sequence.slice(currentIndex);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-xl font-extrabold text-white">Level 5: Speed Typing Stream ⚡</h2>
      </div>

      {/* Realtime Stats Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131B2E] border border-slate-800 mb-6 text-xs font-bold">
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-rose-400">✗ Sai/Quên: {mistakeCount}</span>
          <span className="text-amber-400 font-mono">⚡ Tốc độ: {wpm} WPM</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400">
          <Timer className="w-4 h-4" />
          <span>Thời gian: {elapsedSec}s</span>
        </div>
      </div>

      {/* Dynamic Queue Stream Bar: Current word is at index 0, finished words disappear */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 overflow-x-auto flex items-center gap-3 no-scrollbar">
        {remainingQueue.map((w, idx) => {
          const isCurrent = idx === 0;
          return (
            <span
              key={idx}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-jp whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-cyan-500 text-slate-950 scale-110 shadow-lg shadow-cyan-500/30 font-extrabold ring-2 ring-cyan-400'
                  : 'bg-slate-800 text-slate-400 opacity-60'
              }`}
            >
              {w.word}
            </span>
          );
        })}
      </div>

      {/* Main Kanji/Kana Card (NO Vietnamese meaning displayed under it!) */}
      <div className="p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-[#131B2E] to-slate-900 border border-cyan-500/40 text-center mb-6 shadow-2xl relative">
        <div className="text-7xl font-black text-white font-jp mb-4">{currentWord.word}</div>

        {/* Step Indicator */}
        {!isEvaluated && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-cyan-400">
            {step === 'romaji' ? '1️⃣ Bước 1: Gõ Romaji cách đọc' : '2️⃣ Bước 2: Gõ Nghĩa Tiếng Việt'}
          </div>
        )}

        {/* Answer Revealed when Forgot */}
        {isEvaluated && isForgot && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 animate-fadeIn">
            <div className="text-xs font-bold uppercase tracking-wider mb-1 text-rose-400">❌ ĐÃ BỎ QUA / XÁC NHẬN QUÊN TỪ:</div>
            <div className="text-xl font-black text-white font-jp mb-1">
              {currentWord.word} {currentWord.kana && `[${currentWord.kana}]`}
            </div>
            <div className="text-sm font-bold text-emerald-400 mb-2">
              Romaji: <span className="font-mono">{currentWord.romaji}</span> | Nghĩa: {currentWord.meaning}
            </div>
            <div className="text-xs font-bold text-cyan-300 animate-pulse">
              ⌨️ Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
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
              ? 'Bước 1: Gõ Romaji cách đọc...'
              : 'Bước 2: Gõ nghĩa Tiếng Việt...'
          }
          autoFocus
          className={`w-full px-6 py-5 rounded-2xl bg-[#131B2E] border-2 text-center text-2xl font-bold text-white outline-none shadow-xl transition-all ${
            isEvaluated
              ? 'border-rose-500 bg-rose-950/20 text-rose-300'
              : step === 'meaning'
              ? 'border-purple-500 focus:border-purple-400 shadow-purple-500/10'
              : 'border-cyan-500/60 focus:border-cyan-400 shadow-cyan-500/10'
          }`}
        />

        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>💡 Gõ đúng Romaji ➔ Tự động nhảy sang gõ Nghĩa Tiếng Việt</span>
          {isEvaluated ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs shadow-md hover:bg-cyan-400"
            >
              <span>Chuyển câu tiếp (Enter)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleForgot}
              className="flex items-center gap-1 text-rose-400 hover:underline font-bold"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Nhấn [Enter] nếu quên từ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
