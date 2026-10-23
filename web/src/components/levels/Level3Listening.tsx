import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface Level3ListeningProps {
  words: WordEntry[];
  onBack: () => void;
  onFinish: (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => void;
}

export const Level3Listening: React.FC<Level3ListeningProps> = ({ words, onBack, onFinish }) => {
  const [testBlock, setTestBlock] = useState<WordEntry[]>([]);
  const [isListeningPhase, setIsListeningPhase] = useState(true);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(25);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const sample = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setTestBlock(sample);
    setAnswers(new Array(sample.length).fill(''));
    setIsListeningPhase(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < sample.length) {
        setPlayingIndex(i);
        speakJapanese(sample[i].kana || sample[i].word);
        i++;
      } else {
        clearInterval(interval);
        setPlayingIndex(-1);
        setIsListeningPhase(false);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [words]);

  useEffect(() => {
    if (isListeningPhase || isSubmitted) return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isListeningPhase, timeLeft, isSubmitted]);

  const handleAnswerChange = (index: number, val: string) => {
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const handleFinalSubmit = () => {
    setIsSubmitted(true);
    let correct = 0;
    let mistakes = 0;
    const missed: WordEntry[] = [];

    testBlock.forEach((w, i) => {
      const userAns = (answers[i] || '').trim().toLowerCase();
      const actualMeaning = w.meaning.toLowerCase();
      if (userAns && actualMeaning.includes(userAns)) {
        correct++;
      } else {
        mistakes++;
        missed.push(w);
      }
    });

    setTimeout(() => {
      onFinish({ correct, mistakes, missed });
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
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
          Level 3: Luyện Nghe & Điền Nghĩa
        </h2>
      </div>

      {/* Listening Phase Overlay */}
      {isListeningPhase ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#121319] border border-[#232635] text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-5 animate-pulse">
            <PixelIcon name="volume" size={28} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Đang Phát Âm Chuỗi {testBlock.length} Ký Tự / Từ
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Lắng nghe thật kỹ thứ tự phát âm các từ vựng...
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#181924] border border-[#252837] text-xs font-bold text-red-400 font-mono">
            Đang phát từ #{playingIndex + 1} / {testBlock.length}
          </div>
        </div>
      ) : (
        <div>
          {/* Timer bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] mb-6">
            <div className="text-xs font-bold text-zinc-300">
              Điền nghĩa tiếng Việt cho {testBlock.length} từ vừa nghe:
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-extrabold font-mono">
              <PixelIcon name="timer" size={14} />
              <span>Thời gian: {timeLeft}s</span>
            </div>
          </div>

          {/* Answer Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {testBlock.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-lg bg-[#1c1d28] text-zinc-400 text-xs font-bold font-mono flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={answers[idx]}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    disabled={isSubmitted}
                    placeholder={`Nghĩa của từ #${idx + 1}...`}
                    className="w-full px-3 py-2 rounded-xl bg-[#181924] border border-[#252837] text-white text-xs outline-none focus:border-red-500"
                  />
                </div>
                <button
                  onClick={() => speakJapanese(item.kana || item.word)}
                  className="p-2 rounded-xl bg-[#1c1d28] text-zinc-400 hover:text-red-400 hover:bg-[#252837]"
                  title="Nghe lại"
                >
                  <PixelIcon name="volume" size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitted}
            className="w-full py-4 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] text-white font-extrabold text-sm shadow-xl shadow-red-500/25 transition-all"
          >
            {isSubmitted ? 'Đã Nộp Bài! Đang Tính Điểm...' : 'Nộp Bài Kiểm Tra ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
