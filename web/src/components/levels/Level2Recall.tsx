import React, { useState, useEffect, useRef } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
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
      onFinish({
        correct: correctCount + (isCorrect ? 1 : 0),
        mistakes: mistakeCount,
        missed: missedList,
      });
    }
  };

  const handleForgot = () => {
    if (!currentWord || isEvaluated) return;
    setIsEvaluated(true);
    setIsCorrect(false);
    speakJapanese(currentWord.kana || currentWord.word);
    setMistakeCount((prev) => prev + 1);
    setMissedList((prev) => [...prev, currentWord]);
    setFailedWords((prev) => [...prev, currentWord]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    if (isEvaluated) {
      handleNextQuestion();
      return;
    }

    const cleanInput = inputVal.trim().toLowerCase();
    if (!cleanInput) {
      handleForgot();
      return;
    }

    const cleanWord = currentWord.word.trim().toLowerCase();
    const cleanKana = (currentWord.kana || '').trim().toLowerCase();
    const cleanRomaji = (currentWord.romaji || '').trim().toLowerCase();

    const ok =
      cleanInput === cleanWord ||
      cleanInput === cleanKana ||
      cleanInput === cleanRomaji;

    setIsEvaluated(true);
    setIsCorrect(ok);

    if (ok) {
      setCorrectCount((prev) => prev + 1);
      speakJapanese(currentWord.kana || currentWord.word);
      setTimeout(() => {
        handleNextQuestion();
      }, 700);
    } else {
      setMistakeCount((prev) => prev + 1);
      setMissedList((prev) => [...prev, currentWord]);
      setFailedWords((prev) => [...prev, currentWord]);
      speakJapanese(currentWord.kana || currentWord.word);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isEvaluated && !inputVal.trim()) {
        e.preventDefault();
        handleForgot();
      }
    }
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
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
          Level 2: Active Recall
        </h2>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] mb-6 text-xs font-bold">
        <span className="text-red-400">
          Câu: {currentIndex + 1} / {pool.length}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-red-400">✗ Sai/Quên: {mistakeCount}</span>
        </div>
      </div>

      {/* Card Prompt */}
      <div className="p-8 rounded-3xl bg-[#121319] border border-[#232635] text-center mb-6 shadow-2xl">
        <div className="text-xs text-zinc-400 font-bold mb-2 uppercase tracking-wider">
          Nhìn nghĩa tiếng Việt để gõ tiếng Nhật:
        </div>
        <div className="text-3xl font-extrabold text-white mb-4">{currentWord.meaning}</div>

        {isEvaluated && (
          <div className="mt-4 p-4 rounded-2xl bg-[#171824] border border-[#26283b] text-center">
            <div className="text-xs font-bold text-red-400 mb-1">
              {isCorrect ? '✓ CHÍNH XÁC!' : '❌ XÁC NHẬN QUÊN TỪ - ĐÁP ÁN ĐÚNG:'}
            </div>
            <div className="text-3xl font-black text-white font-jp mb-1">{currentWord.word}</div>
            {currentWord.kana && currentWord.kana !== currentWord.word && (
              <div className="text-sm font-bold text-zinc-300 font-jp">
                Cách đọc: [{currentWord.kana}]
              </div>
            )}
            <div className="text-xs text-zinc-400 font-mono mt-1">
              Romaji: {currentWord.romaji}
            </div>

            {!isCorrect && (
              <div className="mt-3 text-xs font-bold text-red-400 animate-pulse">
                Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
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
          placeholder={
            isEvaluated ? 'Nhấn [Enter] để chuyển tiếp...' : 'Gõ Romaji hoặc tiếng Nhật...'
          }
          autoFocus
          className={`w-full px-6 py-4 rounded-2xl bg-[#14151e] border-2 text-center text-lg font-bold text-white outline-none transition-all ${
            isEvaluated
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                : 'border-red-500 bg-red-950/20 text-red-300'
              : 'border-[#242635] focus:border-red-500'
          }`}
        />

        <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
          <span>💡 Bấm Enter khi để trống nếu quên từ</span>
          {isEvaluated ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c93b3b] text-white font-bold text-xs shadow-md hover:bg-[#e74c3c]"
            >
              <span>Chuyển câu tiếp (Enter)</span>
              <PixelIcon name="chevron-right" size={10} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleForgot}
              className="flex items-center gap-1 text-red-400 hover:underline font-bold"
            >
              <PixelIcon name="help" size={12} />
              <span>Nhấn [Enter] để bỏ qua</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] text-white font-extrabold text-sm shadow-xl shadow-red-500/25 transition-all"
        >
          {isEvaluated
            ? isCorrect
              ? '✓ Chính xác! (Đang chuyển câu...)'
              : 'Chuyển sang câu tiếp theo (Nhấn Enter) ➔'
            : 'Kiểm Tra Đáp Án ↵'}
        </button>
      </form>
    </div>
  );
};
