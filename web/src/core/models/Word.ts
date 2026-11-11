import { WordEntry } from '@/data/types';

/**
 * Domain Model representing a single Japanese vocabulary entry.
 * Encapsulates validation, formatting, searching, and serialization.
 */
export class Word {
  public readonly word: string;
  public readonly romaji: string;
  public readonly meaning: string;
  public readonly kana: string;
  public readonly hint?: string;

  constructor(word: string, meaning: string, romaji = '', kana = '', hint?: string) {
    this.word = (word || '').trim();
    this.meaning = (meaning || '').trim();
    this.romaji = (romaji || '').trim();
    this.kana = (kana || '').trim();
    this.hint = hint ? hint.trim() : undefined;
  }

  /**
   * Returns kana representation if available, otherwise falls back to word.
   */
  public getDisplayKana(): string {
    return this.kana || this.word;
  }

  /**
   * Check if the word entry is valid (must have at least a word/kana and meaning).
   */
  public isValid(): boolean {
    return (this.word.length > 0 || this.kana.length > 0) && this.meaning.length > 0;
  }

  /**
   * Matches against a query string (case-insensitive search across word, kana, romaji, meaning).
   */
  public matches(query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      this.word.toLowerCase().includes(q) ||
      this.kana.toLowerCase().includes(q) ||
      this.romaji.toLowerCase().includes(q) ||
      this.meaning.toLowerCase().includes(q)
    );
  }

  /**
   * Convert to plain JSON object compatible with legacy WordEntry interface.
   */
  public toJSON(): WordEntry {
    return {
      word: this.word,
      romaji: this.romaji,
      meaning: this.meaning,
      kana: this.kana || undefined,
      hint: this.hint,
    };
  }

  /**
   * Factory method to instantiate a Word from raw input / JSON.
   */
  public static fromJSON(raw: any): Word {
    if (!raw) return new Word('', '');
    return new Word(
      raw.word || '',
      raw.meaning || '',
      raw.romaji || '',
      raw.kana || '',
      raw.hint
    );
  }

  /**
   * Create a clone with optional overrides.
   */
  public clone(overrides?: Partial<WordEntry>): Word {
    return new Word(
      overrides?.word !== undefined ? overrides.word : this.word,
      overrides?.meaning !== undefined ? overrides.meaning : this.meaning,
      overrides?.romaji !== undefined ? overrides.romaji : this.romaji,
      overrides?.kana !== undefined ? overrides.kana : this.kana,
      overrides?.hint !== undefined ? overrides.hint : this.hint
    );
  }
}
