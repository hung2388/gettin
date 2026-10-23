import React, { useState, useMemo } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { UserProgress, WordEntry } from '@/data/types';
import { HIRAGANA_BASIC, KATAKANA_BASIC, generateRandomNumberEntries } from '@/data/kanaData';
import { getBuiltInPack } from '@/data/wordData';
import { speakJapanese } from '@/data/tts';

interface LearningPathScreenProps {
  progress: UserProgress;
  onSelectPack?: (packId: string) => void;
  onSelectReference?: (refId: string) => void;
  onQuickReview?: (words: WordEntry[]) => void;
  onStartDirectPractice?: (words: WordEntry[], stages?: number[]) => void;
}

export interface StageOption {
  id: number;
  name: string;
  desc: string;
  premium?: boolean;
}

export const STAGES: StageOption[] = [
  { id: 1, name: 'Giai đoạn 1', desc: 'Trắc nghiệm' },
  { id: 2, name: 'Giai đoạn 2', desc: 'Trắc nghiệm (Đảo ngược)' },
  { id: 3, name: 'Giai đoạn 3', desc: 'Tìm cặp' },
  { id: 4, name: 'Giai đoạn 4', desc: 'Viết câu trả lời' },
  { id: 5, name: 'Giai đoạn 5', desc: 'Viết từ', premium: true },
  { id: 6, name: 'Giai đoạn 6', desc: 'Viết văn bản', premium: true },
  { id: 7, name: 'Giai đoạn 7', desc: 'Nghe', premium: true },
  { id: 8, name: 'Giai đoạn 8', desc: 'Thứ tự nét', premium: true },
  { id: 9, name: 'Giai đoạn 9', desc: 'Vẽ kana', premium: true },
];

// 10 characters for top quick review bar as seen in kana.pro/vi screenshot
const QUICK_REVIEW_CHARS = [
  { char: 'ね', romaji: 'ne', meaning: 'ne (Hiragana)' },
  { char: 'と', romaji: 'to', meaning: 'to (Hiragana)' },
  { char: 'ん', romaji: 'n', meaning: 'n (Hiragana)' },
  { char: 'て', romaji: 'te', meaning: 'te (Hiragana)' },
  { char: 'す', romaji: 'su', meaning: 'su (Hiragana)' },
  { char: 'か', romaji: 'ka', meaning: 'ka (Hiragana)' },
  { char: 'ら', romaji: 'ra', meaning: 'ra (Hiragana)' },
  { char: 'な', romaji: 'na', meaning: 'na (Hiragana)' },
  { char: 'も', romaji: 'mo', meaning: 'mo (Hiragana)' },
  { char: 'や', romaji: 'ya', meaning: 'ya (Hiragana)' },
];

// Pack order: highest number first, down to pack_00
const VOCAB_PACK_IDS = [
  'pack_11',
  'pack_10',
  'pack_09',
  'pack_08',
  'pack_03',
  'pack_02',
  'pack_01',
  'pack_00',
];

export const LearningPathScreen: React.FC<LearningPathScreenProps> = ({
  progress,
  onSelectPack,
  onSelectReference,
  onQuickReview,
  onStartDirectPractice,
}) => {
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');

  // Load all vocab packs sorted highest first
  const vocabPacks = useMemo(() => {
    return VOCAB_PACK_IDS.map((id) => getBuiltInPack(id)!).filter(Boolean);
  }, []);

  // Track accordion states (pack_11 open by default so user sees vocab words immediately)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    pack_11: true,
    hiragana: false,
    katakana: false,
    other: false,
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group selection state for Hiragana & Katakana
  const [selectedHGroups, setSelectedHGroups] = useState<Set<string>>(new Set(['h_a', 'h_ka']));
  const [selectedKGroups, setSelectedKGroups] = useState<Set<string>>(
    new Set(['k_a', 'k_ka', 'k_sa', 'k_ta', 'k_na', 'k_ha', 'k_ma', 'k_ya', 'k_ra', 'k_wa_n'])
  );

  // Stage selection state (Giai đoạn 1..4 selected by default matching kana.pro)
  const [isStagesOpen, setIsStagesOpen] = useState<boolean>(true);
  const [selectedStages, setSelectedStages] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  const toggleStage = (stageId: number) => {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const selectAllStages = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStages(new Set(STAGES.map((s) => s.id)));
  };

  const clearStages = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStages(new Set());
  };

  // Selected words per vocab pack (default all selected for each pack)
  const [selectedWordsByPack, setSelectedWordsByPack] = useState<Record<string, Set<number>>>(() => {
    const initial: Record<string, Set<number>> = {};
    VOCAB_PACK_IDS.forEach((id) => {
      const p = getBuiltInPack(id);
      if (p) {
        initial[id] = new Set(p.words.map((_, i) => i));
      }
    });
    return initial;
  });

  const toggleWordInPack = (packId: string, wordIdx: number) => {
    setSelectedWordsByPack((prev) => {
      const currentSet = new Set(prev[packId] || []);
      if (currentSet.has(wordIdx)) {
        currentSet.delete(wordIdx);
      } else {
        currentSet.add(wordIdx);
      }
      return {
        ...prev,
        [packId]: currentSet,
      };
    });
  };

  const selectAllInPack = (e: React.MouseEvent, packId: string, totalCount: number) => {
    e.stopPropagation();
    setSelectedWordsByPack((prev) => ({
      ...prev,
      [packId]: new Set(Array.from({ length: totalCount }, (_, i) => i)),
    }));
  };

  const clearAllInPack = (e: React.MouseEvent, packId: string) => {
    e.stopPropagation();
    setSelectedWordsByPack((prev) => ({
      ...prev,
      [packId]: new Set(),
    }));
  };

  const toggleHGroup = (id: string) => {
    setSelectedHGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleKGroup = (id: string) => {
    setSelectedKGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllH = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHGroups(new Set(HIRAGANA_BASIC.map((g) => g.id)));
  };
  const clearH = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHGroups(new Set());
  };

  const selectAllK = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKGroups(new Set(KATAKANA_BASIC.map((g) => g.id)));
  };
  const clearK = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKGroups(new Set());
  };

  const handleStartReview = () => {
    if (onQuickReview) {
      onQuickReview(
        QUICK_REVIEW_CHARS.map((c) => ({
          word: c.char,
          romaji: c.romaji,
          meaning: c.meaning,
        }))
      );
    } else if (onStartDirectPractice) {
      const defaultWords = HIRAGANA_BASIC.flatMap((g) => g.entries).map((e) => ({
        word: e.kana,
        romaji: e.romaji,
        meaning: `${e.romaji} (Hiragana)`,
      }));
      const sortedStages = Array.from(selectedStages).sort((a, b) => a - b);
      onStartDirectPractice(defaultWords, sortedStages.length > 0 ? sortedStages : [1]);
    }
  };

  const handleStartNumbers = () => {
    const numEntries = generateRandomNumberEntries(25).map((e) => ({
      word: e.kana,
      romaji: e.romaji,
      meaning: e.hint || e.kana,
    }));
    const sortedStages = Array.from(selectedStages).sort((a, b) => a - b);
    if (onStartDirectPractice) {
      onStartDirectPractice(numEntries, sortedStages.length > 0 ? sortedStages : [1]);
    }
  };

  // Master Start Practice trigger from floating bottom button
  const handleMasterStart = () => {
    if (!onStartDirectPractice) return;

    const sortedStages = Array.from(selectedStages).sort((a, b) => a - b);
    const stagesToRun = sortedStages.length > 0 ? sortedStages : [1];

    // 1. Check if any Vocab Pack is open and has words selected
    for (const pack of vocabPacks) {
      if (openAccordions[pack.id]) {
        const selectedIndices = selectedWordsByPack[pack.id] || new Set();
        if (selectedIndices.size > 0) {
          const selectedWords = pack.words.filter((_, i) => selectedIndices.has(i));
          onStartDirectPractice(selectedWords, stagesToRun);
          return;
        }
      }
    }

    // 2. Check if Katakana is open
    if (openAccordions['katakana'] && selectedKGroups.size > 0) {
      const entries = KATAKANA_BASIC.filter((g) => selectedKGroups.has(g.id))
        .flatMap((g) => g.entries)
        .map((e) => ({ word: e.kana, romaji: e.romaji, meaning: `${e.romaji} (Katakana)` }));
      onStartDirectPractice(entries, stagesToRun);
      return;
    }

    // 3. Check if Hiragana is open
    if (openAccordions['hiragana'] && selectedHGroups.size > 0) {
      const entries = HIRAGANA_BASIC.filter((g) => selectedHGroups.has(g.id))
        .flatMap((g) => g.entries)
        .map((e) => ({ word: e.kana, romaji: e.romaji, meaning: `${e.romaji} (Hiragana)` }));
      onStartDirectPractice(entries, stagesToRun);
      return;
    }

    // 4. Default: launch highest pack's words (pack_11) or first pack
    const firstPack = vocabPacks[0];
    if (firstPack) {
      const selectedIndices = selectedWordsByPack[firstPack.id] || new Set();
      const wordsToUse = selectedIndices.size > 0
        ? firstPack.words.filter((_, i) => selectedIndices.has(i))
        : firstPack.words;
      onStartDirectPractice(wordsToUse, stagesToRun);
    } else {
      const defaultWords = HIRAGANA_BASIC.flatMap((g) => g.entries).map((e) => ({
        word: e.kana,
        romaji: e.romaji,
        meaning: `${e.romaji} (Hiragana)`,
      }));
      onStartDirectPractice(defaultWords, stagesToRun);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Top Quick Review Bar (Kana Pro style) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#14151c] border border-[#222432] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="w-full md:w-auto">
          <div className="text-xs text-zinc-300 font-medium mb-2.5">
            Ôn nhanh 10 ký tự này để vẫn nhớ rõ chúng nhé.
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {QUICK_REVIEW_CHARS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => speakJapanese(item.char)}
                title={`Phát âm: ${item.romaji}`}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1c1e28] hover:bg-[#252837] border border-[#2b2d3c] hover:border-red-500/50 flex flex-col items-center justify-center transition-all cursor-pointer group"
              >
                <span className="text-base sm:text-lg font-bold text-zinc-100 font-jp group-hover:text-red-400">
                  {item.char}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartReview}
          className="self-end md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d63031] hover:bg-[#e74c3c] text-white font-bold text-xs shadow-md shadow-red-500/20 hover:scale-105 transition-all cursor-pointer"
        >
          <span>Ôn lại</span>
          <PixelIcon name="chevron-right" size={10} />
        </button>
      </div>

      {/* Main Section Header: "Chọn từ vựng & ký tự" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Chọn ký tự & Từ vựng</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Chế độ Tự động chọn dựa trên tiến độ học. Chế độ Thủ công cho phép chọn chính xác từng từ vựng hoặc nhóm ký tự mong muốn ngay tại đây.
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="inline-flex rounded-full bg-[#14151d] p-1 border border-[#222533] self-start sm:self-auto shrink-0">
          <button
            onClick={() => setMode('auto')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              mode === 'auto'
                ? 'bg-zinc-100 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tự động
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              mode === 'manual'
                ? 'bg-zinc-100 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Thủ công
          </button>
        </div>
      </div>

      {/* List of Accordions */}
      <div className="space-y-4">
        {/* ── 1. CÁC GÓI TỪ VỰNG (SỐ CAO NHẤT ĐỨNG ĐẦU) ───────────── */}
        {vocabPacks.map((pack) => {
          const isOpen = !!openAccordions[pack.id];
          const selectedIndices = selectedWordsByPack[pack.id] || new Set();
          const p = progress[pack.id] || 0;

          return (
            <div
              key={pack.id}
              className="rounded-2xl bg-[#13141f] border border-[#24263b] overflow-hidden transition-all duration-200"
            >
              {/* Pack Accordion Header */}
              <div
                onClick={() => toggleAccordion(pack.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#181927] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="p-1 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20">
                    <PixelIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white">
                      {pack.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      {pack.description} · <span className="text-red-400 font-bold">{pack.words.length} từ</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-400 hidden sm:inline">
                    Đã chọn <strong className="text-white">{selectedIndices.size}</strong>/{pack.words.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => selectAllInPack(e, pack.id, pack.words.length)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                    >
                      Tất cả
                    </button>
                    <span className="text-zinc-600">·</span>
                    <button
                      onClick={(e) => clearAllInPack(e, pack.id)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                    >
                      Không chọn
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Word Tiles Grid (Giống như các ô Katakana / Hiragana) */}
              {isOpen && (
                <div className="px-4 pb-5 pt-1 border-t border-[#24263b]/60 bg-[#0d0e16]/50">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-3 px-1">
                    <span>
                      Danh sách từ vựng · Tích chọn các từ bạn muốn học và luyện tập:
                    </span>
                    <span>
                      Đã chọn: <strong className="text-red-400">{selectedIndices.size}</strong> từ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {pack.words.map((word, wIdx) => {
                      const isSelected = selectedIndices.has(wIdx);
                      return (
                        <div
                          key={wIdx}
                          onClick={() => toggleWordInPack(pack.id, wIdx)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-[#1b1c28] border-red-500/40 text-white shadow-sm'
                              : 'bg-[#11121b]/60 border-[#1f202d] text-zinc-400 hover:border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-red-500 border-red-400 text-white'
                                  : 'border-zinc-600 bg-transparent'
                              }`}
                            >
                              {isSelected && <PixelIcon name="check" size={10} color="#fff" />}
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-[11px] font-mono font-bold text-zinc-400 truncate">
                                {word.romaji || word.kana}
                              </div>
                              <div className="text-sm font-bold text-white font-jp truncate">
                                {word.word}{' '}
                                {word.kana && word.kana !== word.word && (
                                  <span className="text-[11px] font-normal text-zinc-400">
                                    [{word.kana}]
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <div className="text-[11px] font-semibold text-zinc-300 max-w-[110px] truncate">
                              {word.meaning}
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {p >= 100 ? '100%' : p > 0 ? `${p}%` : '96%'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── 2. NHÓM KHÁC (CON SỐ & ĐẠI TỪ CHỈ THỊ) ─────────────── */}
        <div className="rounded-2xl bg-[#141520] border border-[#27293e] overflow-hidden transition-all duration-200">
          <div
            onClick={() => toggleAccordion('other')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#1a1b2a] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-1 rounded-lg text-purple-400 bg-purple-500/10 border border-purple-500/20">
                <PixelIcon name={openAccordions['other'] ? 'chevron-down' : 'chevron-right'} size={12} />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">Khác</h3>
                <p className="text-xs text-purple-400 font-medium">
                  その他 · Con số Tiếng Nhật & Đại từ chỉ thị
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              2 phần học
            </span>
          </div>

          {openAccordions['other'] && (
            <div className="px-4 pb-5 pt-2 border-t border-[#27293e]/60 bg-[#0d0e17]/50 space-y-3">
              {/* Item A: Con số Tiếng Nhật */}
              <div
                onClick={handleStartNumbers}
                className="p-4 rounded-xl bg-[#171825] border border-[#26283b] hover:border-cyan-500/50 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                    123
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">Con số Tiếng Nhật (数字)</h4>
                    <p className="text-xs text-zinc-400">Luyện đếm số ngẫu nhiên từ 1 đến 99,999</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {progress['numbers'] ? `${progress['numbers']}%` : 'Sẵn sàng'}
                  </span>
                  <span className="text-xs font-bold text-cyan-400 hover:underline">
                    Luyện tập ➔
                  </span>
                </div>
              </div>

              {/* Item B: Đại từ chỉ thị こ/そ/あ/ど */}
              <div
                onClick={() => onSelectReference && onSelectReference('pre_02')}
                className="p-4 rounded-xl bg-[#171825] border border-[#26283b] hover:border-fuchsia-500/50 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold text-sm">
                    こ
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Bảng Đại Từ Chỉ Thị: こ/そ/あ/ど (Pre 02)
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Bảng tra cứu đồ vật (これ), vị trí (ここ), người và phương hướng
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 self-end sm:self-auto">
                  Xem bảng hệ thống ➔
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. DƯỚI NỮA LÀ KANA (HIRAGANA & KATAKANA) ───────────── */}
        {/* Card Hiragana */}
        <div className="rounded-2xl bg-[#0c1611] border border-[#173325] overflow-hidden transition-all duration-200">
          <div
            onClick={() => toggleAccordion('hiragana')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-950/20 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-1 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <PixelIcon name={openAccordions['hiragana'] ? 'chevron-down' : 'chevron-right'} size={12} />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">Hiragana</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  ひらがな · {progress['hiragana'] || 43}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400 hidden sm:inline">
                Đã chọn <strong className="text-white">{selectedHGroups.size}</strong> nhóm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllH}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  onClick={clearH}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Không chọn
                </button>
              </div>
            </div>
          </div>

          {openAccordions['hiragana'] && (
            <div className="px-4 pb-5 pt-1 border-t border-[#173325]/60 bg-[#09110d]/50">
              <div className="text-[11px] font-semibold text-zinc-400 mb-3 px-1">
                Bộ cơ bản · Các ký tự cốt lõi của Hiragana.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {HIRAGANA_BASIC.map((group, idx) => {
                  const isChecked = selectedHGroups.has(group.id);
                  const romajiList = group.entries.map((e) => e.romaji).join(' ');
                  const kanaList = group.entries.map((e) => e.kana).join('');
                  const pct = 90 + ((idx * 3) % 11);

                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleHGroup(group.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#12221a] border-emerald-500/40 text-white shadow-sm'
                          : 'bg-[#0d1612]/60 border-[#1a2d22] text-zinc-400 hover:border-emerald-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isChecked && <PixelIcon name="check" size={10} color="#000" />}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-zinc-300">{romajiList}</div>
                          <div className="text-sm font-bold text-white font-jp tracking-wider">
                            {kanaList}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Card Katakana */}
        <div className="rounded-2xl bg-[#1b140d] border border-[#382917] overflow-hidden transition-all duration-200">
          <div
            onClick={() => toggleAccordion('katakana')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-amber-950/20 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-1 rounded-lg text-amber-400 bg-amber-500/10 border border-amber-500/20">
                <PixelIcon name={openAccordions['katakana'] ? 'chevron-down' : 'chevron-right'} size={12} />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">Katakana</h3>
                <p className="text-xs text-amber-400 font-medium">
                  カタカナ · {progress['katakana'] || 32}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400 hidden sm:inline">
                Đã chọn <strong className="text-white">{selectedKGroups.size}</strong> nhóm
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllK}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  onClick={clearK}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Không chọn
                </button>
              </div>
            </div>
          </div>

          {openAccordions['katakana'] && (
            <div className="px-4 pb-5 pt-1 border-t border-[#382917]/60 bg-[#120d08]/50">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-3 px-1">
                <span className="flex items-center gap-1.5">
                  <PixelIcon name="chevron-down" size={10} />
                  Bộ cơ bản · Các ký tự cốt lõi của Katakana.
                </span>
                <span>
                  Đã chọn {selectedKGroups.size} · Tất cả · Không chọn
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {KATAKANA_BASIC.map((group, idx) => {
                  const isChecked = selectedKGroups.has(group.id);
                  const romajiList = group.entries.map((e) => e.romaji).join(' ');
                  const kanaList = group.entries.map((e) => e.kana).join('');
                  const pct = idx % 2 === 0 ? 100 : 96;

                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleKGroup(group.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#291e13] border-amber-500/40 text-white shadow-sm'
                          : 'bg-[#18110b]/60 border-[#2f2214] text-zinc-400 hover:border-amber-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isChecked && <PixelIcon name="check" size={10} color="#000" />}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-zinc-300">{romajiList}</div>
                          <div className="text-sm font-bold text-white font-jp tracking-wider">
                            {kanaList}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Button: + Thêm nhóm tùy chỉnh */}
        <button
          onClick={() => {
            // Smoothly scrolls to vocab packs or shows a quick prompt
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-3.5 rounded-2xl bg-[#12131b] border border-[#1f212d] hover:border-zinc-600 hover:bg-[#161824] text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <span>+ Thêm nhóm tùy chỉnh</span>
        </button>
      </div>

      {/* ── CHỌN GIAI ĐOẠN (CHỌN LEVEL Ở DƯỚI) ─────────────────── */}
      <div className="mt-10 mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight mb-4">Chọn giai đoạn</h2>

        <div className="rounded-2xl bg-[#13141f] border border-[#24263b] overflow-hidden transition-all duration-200">
          {/* Stage Accordion Header */}
          <div
            onClick={() => setIsStagesOpen(!isStagesOpen)}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#181927] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-1.5 rounded-lg text-red-400 bg-red-500/10 border border-red-500/20">
                <PixelIcon name={isStagesOpen ? 'chevron-down' : 'chevron-right'} size={12} />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">Giai đoạn</h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Chọn giai đoạn nào được kích hoạt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400 hidden sm:inline">
                Đã chọn <strong className="text-white">{selectedStages.size}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllStages}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Tất cả
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  onClick={clearStages}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  Không chọn
                </button>
              </div>
            </div>
          </div>

          {/* Expanded 9-stage Grid matching kana.pro screenshot */}
          {isStagesOpen && (
            <div className="p-4 sm:p-5 pt-2 border-t border-[#24263b]/60 bg-[#0d0e16]/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STAGES.map((stage) => {
                  const isChecked = selectedStages.has(stage.id);
                  return (
                    <div
                      key={stage.id}
                      onClick={() => toggleStage(stage.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-[#221014] border-red-500/50 text-white shadow-sm'
                          : 'bg-[#11121c]/70 border-[#20222f] text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-[#d63031] border-red-400 text-white'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isChecked && <PixelIcon name="check" size={10} color="#fff" />}
                        </div>
                        <div className="overflow-hidden">
                          <div
                            className={`text-xs font-bold leading-tight truncate ${
                              isChecked ? 'text-white' : 'text-zinc-300'
                            }`}
                          >
                            {stage.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium mt-0.5 truncate">
                            {stage.desc}
                          </div>
                        </div>
                      </div>

                      {stage.premium && (
                        <span className="ml-2 shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          PREMIUM
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar (Kana Pro "Bắt đầu >" red button) */}
      <div className="fixed bottom-5 right-5 sm:right-8 z-30">
        <button
          onClick={handleMasterStart}
          className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#c93b3b] hover:bg-[#e74c3c] active:scale-95 text-white font-extrabold text-base shadow-2xl shadow-red-600/40 border border-red-400/30 hover:shadow-red-500/60 transition-all cursor-pointer"
        >
          <span>Bắt đầu</span>
          <PixelIcon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
};
