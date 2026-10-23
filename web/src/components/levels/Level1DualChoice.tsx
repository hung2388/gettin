import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
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

    setSelectedKana(null);
    setSelectedMeaning(null);
    setIsEvaluated(false);
    setIsBothCorrectState(null);

    const distractorSource = allPackWords.length >= 4 ? allPackWords : words;
    const shuffleDist = [...distractorSource].sort(() => Math.random() - 0.5);

    const correctKana = currentWord.kana || currentWord.word;
    const correctMeaning = currentWord.meaning;

    const selectedWrongs: WordEntry[] = [];
    const usedKanas = new Set<string>([correctKana]);
    const usedMeanings = new Set<string>([correctMeaning]);

    for (const w of shuffleDist) {
      if (selectedWrongs.length >= 3) break;
      if (w.word === currentWord.word) continue;

      const wKana = w.kana || w.word;
      if (usedKanas.has(wKana) || usedMeanings.has(w.meaning)) continue;

      usedKanas.add(wKana);
      usedMeanings.add(w.meaning);
      selectedWrongs.push(w);
    }

    const fallbacks: WordEntry[] = [
      { word: 'mock1', kana: 'ねこ', meaning: 'Con mèo', romaji: 'neko' },
      { word: 'mock2', kana: 'いぬ', meaning: 'Con chó', romaji: 'inu' },
      { word: 'mock3', kana: 'いま', meaning: 'Thời gian', romaji: 'ima' },
      { word: 'mock4', kana: 'あか', meaning: 'Màu sắc', romaji: 'aka' },
      { word: 'mock5', kana: 'かぞく', meaning: 'Gia đình', romaji: 'kazoku' },
      { word: 'mock6', kana: 'くるま', meaning: 'Ô tô', romaji: 'kuruma' },
      { word: 'mock7', kana: 'じてんしゃ', meaning: 'Xe đạp', romaji: 'jitensha' },
      { word: 'mock8', kana: 'ごはん', meaning: 'Bữa cơm', romaji: 'gohan' },
    ];

    let fbIndex = 0;
    while (selectedWrongs.length < 3 && fbIndex < fallbacks.length) {
      const fb = fallbacks[fbIndex];
      const fbKana = fb.kana || fb.word;
      if (!usedKanas.has(fbKana) && !usedMeanings.has(fb.meaning)) {
        usedKanas.add(fbKana);
        usedMeanings.add(fb.meaning);
        selectedWrongs.push(fb);
      }
      fbIndex++;
    }

    const finalChoicesPool = [currentWord, ...selectedWrongs];

    const finalKanas = finalChoicesPool
      .map((w) => w.kana || w.word)
      .sort(() => Math.random() - 0.5);
    const finalMeanings = finalChoicesPool
      .map((w) => w.meaning)
      .sort(() => Math.random() - 0.5);

    setKanaChoices(finalKanas);
    setMeaningChoices(finalMeanings);
  }, [currentIndex, pool, allPackWords, words]);

  const targetKana = currentWord?.kana || currentWord?.word;

  const handleSelectKana = (val: string) => {
    if (isEvaluated) return;
    setSelectedKana(val);
    speakJapanese(val);
    if (selectedMeaning) {
      evaluateRound(val, selectedMeaning);
    }
  };

  const handleSelectMeaning = (val: string) => {
    if (isEvaluated) return;
    setSelectedMeaning(val);
    if (selectedKana) {
      evaluateRound(selectedKana, val);
    }
  };

  const handleForgot = () => {
    if (isEvaluated || !currentWord) return;
    speakJapanese(targetKana || '');
    setSelectedKana('__FORGOT__');
    setSelectedMeaning('__FORGOT__');
    setMistakeCount((prev) => prev + 1);
    setMissedList((prev) => [...prev, currentWord]);
    setFailedWords((prev) => [...prev, currentWord]);
    setIsEvaluated(true);
    setIsBothCorrectState(false);
  };

  const evaluateRound = (chosenKana: string, chosenMeaning: string) => {
    if (!currentWord) return;

    const isKanaOk = chosenKana === targetKana;
    const isMeaningOk = chosenMeaning === currentWord.meaning;
    const bothOk = isKanaOk && isMeaningOk;

    setIsEvaluated(true);
    setIsBothCorrectState(bothOk);

    if (bothOk) {
      setCorrectCount((prev) => prev + 1);
      setTimeout(() => {
        handleNextQuestion();
      }, 700);
    } else {
      setMistakeCount((prev) => prev + 1);
      setMissedList((prev) => [...prev, currentWord]);
      setFailedWords((prev) => [...prev, currentWord]);
      speakJapanese(targetKana || '');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < pool.length) {
      setCurrentIndex((prev) => prev + 1);
    } else if (failedWords.length > 0) {
      setPool([...failedWords].sort(() => Math.random() - 0.5));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!isEvaluated) {
          handleForgot();
        } else if (!isBothCorrectState) {
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEvaluated, isBothCorrectState, currentWord, currentIndex, pool, failedWords]);

  if (!currentWord) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161722] hover:bg-[#20222f] text-zinc-300 text-xs font-semibold border border-[#232533] transition-all"
        >
          <PixelIcon name="arrow-left" size={12} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Level 1: Trắc Nghiệm Kép
        </h2>
      </div>

      {/* Progress & Stats Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14151e] border border-[#222432] mb-6 text-xs font-bold">
        <span className="text-red-400">
          Câu: {currentIndex + 1} / {pool.length}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">✓ Đúng: {correctCount}</span>
          <span className="text-red-400">✗ Sai/Quên: {mistakeCount}</span>
        </div>
      </div>

      {/* Word Card Display */}
      <div className="p-8 rounded-3xl bg-[#121319] border border-[#232635] text-center mb-6 shadow-2xl relative">
        <div className="text-6xl sm:text-7xl font-black text-white font-jp mb-3">
          {currentWord.word}
        </div>
        <div className="text-xs text-zinc-400">
          Vui lòng chọn đồng thời KANA và NGHĨA tiếng Việt tương ứng:
        </div>

        {isEvaluated && !isBothCorrectState && (
          <div className="mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-300">
            <div className="text-xs font-bold uppercase mb-1">
              ĐÃ XÁC NHẬN QUÊN / CHỌN SAI - ĐÁP ÁN ĐÚNG ĐƯỢC TÔ XANH
            </div>
            <div className="text-xs font-bold text-red-400 animate-pulse mt-1">
              Nhấn phím [Enter] một lần nữa để chuyển sang câu tiếp theo ➔
            </div>
          </div>
        )}

        {!isEvaluated && (
          <button
            onClick={handleForgot}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 transition-all"
          >
            <PixelIcon name="help" size={12} />
            <span>[Enter] nếu quên</span>
          </button>
        )}
      </div>

      {/* Dual Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Kana Options */}
        <div className="p-5 rounded-3xl bg-[#14151e] border border-[#222432]">
          <h3 className="text-xs font-extrabold text-red-400 uppercase tracking-wider mb-3">
            1. Chọn cách đọc KANA
          </h3>
          <div className="space-y-2.5">
            {kanaChoices.map((choice, i) => {
              const isSelected = selectedKana === choice;
              const isCorrect = choice === targetKana;
              let btnStyle = 'bg-[#181924] border-[#252837] text-white hover:border-red-500/40';

              if (isEvaluated) {
                if (isCorrect)
                  btnStyle =
                    'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20';
                else if (isSelected && !isCorrect)
                  btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
              } else if (isSelected) {
                btnStyle = 'bg-red-500/20 border-red-500 text-red-300 font-bold';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectKana(choice)}
                  disabled={isEvaluated}
                  className={`w-full p-3.5 rounded-2xl border text-sm font-extrabold font-jp transition-all ${btnStyle}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Meaning Options */}
        <div className="p-5 rounded-3xl bg-[#14151e] border border-[#222432]">
          <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider mb-3">
            2. Chọn NGHĨA Tiếng Việt
          </h3>
          <div className="space-y-2.5">
            {meaningChoices.map((choice, i) => {
              const isSelected = selectedMeaning === choice;
              const isCorrect = choice === currentWord.meaning;
              let btnStyle = 'bg-[#181924] border-[#252837] text-white hover:border-red-500/40';

              if (isEvaluated) {
                if (isCorrect)
                  btnStyle =
                    'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20';
                else if (isSelected && !isCorrect)
                  btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
              } else if (isSelected) {
                btnStyle = 'bg-red-500/20 border-red-500 text-red-300 font-bold';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectMeaning(choice)}
                  disabled={isEvaluated}
                  className={`w-full p-3.5 rounded-2xl border text-xs font-bold transition-all ${btnStyle}`}
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
            className="px-8 py-3.5 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] text-white font-extrabold text-xs shadow-xl shadow-red-500/25 transition-all inline-flex items-center gap-2"
          >
            <span>Chuyển câu tiếp theo (Nhấn Enter)</span>
            <PixelIcon name="chevron-right" size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
