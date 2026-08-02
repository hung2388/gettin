import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Timer, Sparkles } from 'lucide-react';
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
    // Select up to 10 words for the block
    const sample = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setTestBlock(sample);
    setAnswers(new Array(sample.length).fill(''));
    setIsListeningPhase(true);

    // Play speech sequence
    let i = 0;
    const interval = setInterval(() => {
      if (i < sample.length) {
        setPlayingIndex(i);
        speakJapanese(sample[i].word);
        i++;
      } else {
        clearInterval(interval);
        setPlayingIndex(-1);
        setIsListeningPhase(false);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [words]);

  // Countdown timer during typing phase
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
    }, 3000);
  };

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
        <h2 className="text-xl font-extrabold text-white">Level 3: Luyện Nghe & Điền Nghĩa 🎧</h2>
      </div>

      {/* Listening Phase Overlay */}
      {isListeningPhase ? (
        <div className="p-10 rounded-3xl bg-[#131B2E] border border-cyan-500/40 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 mx-auto mb-6 animate-pulse">
            <Volume2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Đang Phát Âm Chuỗi {testBlock.length} Từ</h3>
          <p className="text-sm text-slate-400 mb-6">Lắng nghe thật kỹ thứ tự phát âm các từ vựng...</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-cyan-400">
            Từ số {playingIndex + 1} / {testBlock.length}
          </div>
        </div>
      ) : (
        <div>
          {/* Timer bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131B2E] border border-slate-800 mb-6">
            <div className="text-xs font-bold text-slate-300">Điền nghĩa tiếng Việt cho {testBlock.length} từ vừa nghe:</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-extrabold">
              <Timer className="w-4 h-4" />
              <span>Thời gian: {timeLeft}s</span>
            </div>
          </div>

          {/* Answer Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {testBlock.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={answers[idx]}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    disabled={isSubmitted}
                    placeholder={`Nghĩa của từ #${idx + 1}...`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => speakJapanese(item.word)}
                  className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                  title="Nghe lại"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitted}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-base shadow-xl shadow-cyan-500/25"
          >
            {isSubmitted ? 'Đã Nộp Bài! Đang Tính Điểm...' : 'Nộp Bài ⛩️'}
          </button>
        </div>
      )}
    </div>
  );
};
