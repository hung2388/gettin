import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, HelpCircle, ArrowRight } from 'lucide-react';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface Level2RecallProps {
  words: WordEntry[];
  onBack: () => void;
  onFinish: (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => void;
}

export const Level2Recall: React.FC<Level2RecallProps> = ({ words, onBack, onFinish }) => {
  const [pool, setPool] = useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedWords, setFailedWords] = useState<WordEntry[]>([]);

  const [inputVal, setInputVal] = useState('');
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [missedList, setMissedList] = useState<WordEntry[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const initialPool = [...words].sort(() => Math.random() - 0.5);
    setPool(initialPool);
    setCurrentIndex(0);
  }, [words]);

  const currentWord = pool[currentIndex];

  useEffect(() => {
    setInputVal('');
    setIsEvaluated(false);
    setIsCorrect(null);
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex, currentWord]);

  const handleNextQuestion = () => {
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex((prev) => prev + 1);
    } else if (failedWords.length > 0) {
      setPool([...failedWords].sort(() => Math.random() - 0.5));
      setFailedWords([]);
      setCurrentIndex(0);
    } else {
      onFinish({ correct: correctCount + (isCorrect ? 1 : 0), mistakes: mistakeCount, missed: missedList });
    }
  };

  const handleForgot = () => {
    if (!currentWord || isEvaluated) return;
    setIsEvaluated(true);
    setIsCorrect(false);
    setMistakeCount((prev) => prev + 1);

    if (!missedList.some((w) => w.word === currentWord.word)) {
      setMissedList((prev) => [...prev, currentWord]);
    }
    setFailedWords((prev) => [...prev, currentWord]);
    // User must press Enter again to advance!
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    if (isEvaluated) {
      handleNextQuestion();
      return;
    }

    if (!inputVal.trim()) {
      handleForgot();
      return;
    }

    const val = inputVal.trim().toLowerCase();
    const targetWord = currentWord.word.toLowerCase();
    const targetKana = (currentWord.kana || '').toLowerCase();
    const targetRomaji = (currentWord.romaji || '').toLowerCase();

    const matches = val === targetWord || val === targetKana || val === targetRomaji;
    setIsEvaluated(true);
    setIsCorrect(matches);

    if (matches) {
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
      // User presses Enter again to advance!
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isEvaluated) {
        e.preventDefault();
        handleNextQuestion();
      } else if (!inputVal.trim()) {
        e.preventDefault();
        handleForgot();
      }
    }
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-xl font-extrabold text-white">Level 2: Active Recall 🧠</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131B2E] border border-slate-800 mb-6 text-xs font-bold">
        <span className="text-teal-400">Từ: {currentIndex + 1} / {pool.length}</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-rose-400">✗ Sai/Quên: {mistakeCount}</span>
        </div>
      </div>

      {/* Card Prompt */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#131B2E] to-slate-900 border border-slate-800 text-center mb-6 shadow-2xl">
        <div className="text-xs text-slate-400 font-bold mb-2">NHÌN NGHĨA TIẾNG VIỆT ĐỂ GÕ TIẾNG NHẬT:</div>
        <div className="text-3xl font-extrabold text-teal-300 mb-4">{currentWord.meaning}</div>

        {isEvaluated && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs font-bold text-rose-400 mb-1">
              {isCorrect ? '✓ CHÍNH XÁC!' : '❌ BỎ QUA / XÁC NHẬN QUÊN TỪ - ĐÁP ÁN ĐÚNG:'}
            </div>
            <div className="text-3xl font-black text-white font-jp mb-1">{currentWord.word}</div>
            {currentWord.kana && currentWord.kana !== currentWord.word && (
              <div className="text-sm font-bold text-cyan-400 font-jp">Cách đọc: [{currentWord.kana}]</div>
            )}
            <div className="text-xs text-slate-400 font-mono mt-1">Romaji: {currentWord.romaji}</div>

            {!isCorrect && (
              <div className="mt-3 text-xs font-bold text-cyan-300 animate-pulse">
                ⌨️ Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEvaluated}
          placeholder={isEvaluated ? 'Nhấn [Enter] để chuyển tiếp...' : 'Gõ Romaji hoặc tiếng Nhật...'}
          autoFocus
          className={`w-full px-6 py-4 rounded-2xl bg-[#131B2E] border-2 text-center text-xl font-bold text-white outline-none transition-all ${
            isEvaluated
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500 bg-rose-950/20 text-rose-300'
              : 'border-slate-800 focus:border-teal-500'
          }`}
        />

        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>💡 Bấm Enter khi để trống để thừa nhận quên từ</span>
          {isEvaluated ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs shadow-md hover:bg-teal-400"
            >
              <span>Chuyển câu tiếp (Enter)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleForgot}
              className="flex items-center gap-1 text-rose-400 hover:underline font-bold"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Nhấn [Enter] để bỏ qua
            </button>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-base shadow-lg shadow-teal-500/20 transition-all"
        >
          {isEvaluated
            ? isCorrect
              ? '✓ Chính xác! (Đang chuyển câu...)'
              : 'Chuyển sang câu tiếp theo (Nhấn Enter) ➔'
            : 'Kiểm Tra Answer ↵'}
        </button>
      </form>
    </div>
  );
};
