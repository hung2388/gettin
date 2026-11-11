import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';

interface WordRowEditorProps {
  index: number;
  word: WordEntry;
  onUpdate: (index: number, field: keyof WordEntry, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const WordRowEditor: React.FC<WordRowEditorProps> = React.memo(
  ({ index, word, onUpdate, onRemove, canRemove }) => {
    return (
      <div className="flex items-center gap-2 group hover:bg-[#151624] p-1 rounded-xl transition-colors">
        <span className="w-6 text-[10px] font-mono text-zinc-600 text-center select-none">
          {index + 1}
        </span>
        <input
          type="text"
          placeholder="Kanji / Từ *"
          value={word.word}
          onChange={(e) => onUpdate(index, 'word', e.target.value)}
          className="w-1/4 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#252837] focus:border-red-500/80 text-xs text-white outline-none font-jp"
        />
        <input
          type="text"
          placeholder="Kana (Hiragana)"
          value={word.kana || ''}
          onChange={(e) => onUpdate(index, 'kana', e.target.value)}
          className="w-1/4 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#252837] focus:border-red-500/80 text-xs text-white outline-none font-jp"
        />
        <input
          type="text"
          placeholder="Romaji"
          value={word.romaji}
          onChange={(e) => onUpdate(index, 'romaji', e.target.value)}
          className="w-1/4 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#252837] focus:border-red-500/80 text-xs text-white outline-none font-mono"
        />
        <input
          type="text"
          placeholder="Nghĩa TV *"
          value={word.meaning}
          onChange={(e) => onUpdate(index, 'meaning', e.target.value)}
          className="w-1/4 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#252837] focus:border-red-500/80 text-xs text-white outline-none"
        />
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Xóa dòng này"
          >
            <PixelIcon name="close" size={12} />
          </button>
        )}
      </div>
    );
  }
);

WordRowEditor.displayName = 'WordRowEditor';
