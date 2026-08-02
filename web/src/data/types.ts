export interface KanaEntry {
  kana: string;
  romaji: string;
  hint?: string;
}

export interface KanaPackage {
  id: string;
  name: string;
  entries: KanaEntry[];
}

export interface WordEntry {
  word: string;
  romaji: string;
  meaning: string;
  kana?: string;
  hint?: string;
}

export interface VocabPack {
  id: string;
  name: string;
  description: string;
  words: WordEntry[];
  is_custom?: boolean;
  supports_handwriting?: boolean;
}

export type KanaType =
  | 'hiragana'
  | 'katakana'
  | 'both'
  | 'numbers'
  | 'days_week'
  | 'days_month'
  | 'days_month_special'
  | 'months'
  | 'years'
  | 'birth_year'
  | 'pack_00'
  | 'pack_01'
  | 'pack_02'
  | 'pack_03'
  | string;

export interface UserProgress {
  [key: string]: number;
}
