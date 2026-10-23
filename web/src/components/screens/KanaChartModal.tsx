import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { speakJapanese } from '@/data/tts';

interface KanaChartModalProps {
  onClose: () => void;
}

const HIRAGANA_GRID = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', '', '', 'を'],
  ['ん', '', '', '', ''],
];

const KATAKANA_GRID = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', '', 'ユ', '', 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', '', '', '', 'ヲ'],
  ['ン', '', '', '', ''],
];

const ROMAJI_GRID = [
  ['a', 'i', 'u', 'e', 'o'],
  ['ka', 'ki', 'ku', 'ke', 'ko'],
  ['sa', 'shi', 'su', 'se', 'so'],
  ['ta', 'chi', 'tsu', 'te', 'to'],
  ['na', 'ni', 'nu', 'ne', 'no'],
  ['ha', 'hi', 'fu', 'he', 'ho'],
  ['ma', 'mi', 'mu', 'me', 'mo'],
  ['ya', '', 'yu', '', 'yo'],
  ['ra', 'ri', 'ru', 're', 'ro'],
  ['wa', '', '', '', 'wo'],
  ['n', '', '', '', ''],
];

export const KanaChartModal: React.FC<KanaChartModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [activeKana, setActiveKana] = useState<string | null>(null);

  const grid = tab === 'hiragana' ? HIRAGANA_GRID : KATAKANA_GRID;

  const handlePlay = (char: string) => {
    if (!char) return;
    setActiveKana(char);
    speakJapanese(char);
    setTimeout(() => setActiveKana(null), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121319] border border-[#232634] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#20222f] flex items-center justify-between bg-[#15161f]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-jp font-bold">
              {tab === 'hiragana' ? 'あ' : 'ア'}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Bảng Ký Tự Kana (50 Âm Tiết)
              </h2>
              <p className="text-xs text-zinc-400">Bấm vào ký tự bất kỳ để nghe phát âm chuẩn</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c1d27] hover:bg-[#282b3a] text-zinc-400 hover:text-white transition-colors"
          >
            <PixelIcon name="close" size={14} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-4">
          <div className="flex rounded-xl bg-[#0d0e13] p-1 border border-[#1f212c]">
            <button
              onClick={() => setTab('hiragana')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'hiragana'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hiragana (ひらがな)
            </button>
            <button
              onClick={() => setTab('katakana')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'katakana'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Katakana (カタカナ)
            </button>
          </div>
        </div>

        {/* Kana Matrix Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-5 gap-2 text-center">
            {grid.map((row, rIdx) =>
              row.map((char, cIdx) => {
                const romaji = ROMAJI_GRID[rIdx][cIdx];
                if (!char) {
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className="h-16 rounded-xl border border-transparent"
                    />
                  );
                }
                const isPlaying = activeKana === char;
                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handlePlay(char)}
                    className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                      isPlaying
                        ? 'bg-red-500/20 border-red-500 text-red-400 scale-95 shadow-md shadow-red-500/20'
                        : 'bg-[#181922] border-[#222430] hover:border-red-500/50 hover:bg-[#1f212d] text-zinc-100'
                    }`}
                  >
                    <span className="text-xl font-bold font-jp">{char}</span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase">{romaji}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
