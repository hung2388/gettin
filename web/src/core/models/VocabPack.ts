import { VocabPack as VocabPackData, WordEntry } from '@/data/types';
import { Word } from './Word';

/**
 * Domain Model representing a Vocabulary Package.
 * Encapsulates operations on vocabulary words, JSON serialization, and cloning.
 */
export class VocabPackModel {
  public readonly id: string;
  public name: string;
  public description: string;
  private _words: Word[];
  public isCustom: boolean;
  public supportsHandwriting: boolean;
  public createdAt: number;
  public updatedAt: number;

  constructor(
    id: string,
    name: string,
    description = '',
    words: Word[] = [],
    isCustom = false,
    supportsHandwriting = false,
    createdAt = Date.now(),
    updatedAt = Date.now()
  ) {
    this.id = id || `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.name = name;
    this.description = description;
    this._words = [...words];
    this.isCustom = isCustom;
    this.supportsHandwriting = supportsHandwriting;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Get all words as immutable Word models.
   */
  public getWords(): readonly Word[] {
    return this._words;
  }

  /**
   * Get plain WordEntry objects for legacy components.
   */
  public getRawWords(): WordEntry[] {
    return this._words.map((w) => w.toJSON());
  }

  /**
   * Get total number of words.
   */
  public getWordCount(): number {
    return this._words.length;
  }

  /**
   * Filter valid words only.
   */
  public getValidWords(): Word[] {
    return this._words.filter((w) => w.isValid());
  }

  /**
   * Add a single word to the pack.
   */
  public addWord(word: Word): void {
    this._words.push(word);
    this.updatedAt = Date.now();
  }

  /**
   * Add multiple words to the pack.
   */
  public addWords(words: Word[]): void {
    this._words.push(...words);
    this.updatedAt = Date.now();
  }

  /**
   * Update a word at a specific index.
   */
  public updateWord(index: number, word: Word): void {
    if (index >= 0 && index < this._words.length) {
      this._words[index] = word;
      this.updatedAt = Date.now();
    }
  }

  /**
   * Remove a word at a specific index.
   */
  public removeWord(index: number): void {
    if (index >= 0 && index < this._words.length) {
      this._words.splice(index, 1);
      this.updatedAt = Date.now();
    }
  }

  /**
   * Set entire word list.
   */
  public setWords(words: Word[]): void {
    this._words = [...words];
    this.updatedAt = Date.now();
  }

  /**
   * Clone this pack with a new ID and optional new name.
   */
  public clone(newId?: string, newName?: string): VocabPackModel {
    return new VocabPackModel(
      newId || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      newName || `${this.name} (Bản sao)`,
      this.description,
      this._words.map((w) => w.clone()),
      true,
      this.supportsHandwriting,
      Date.now(),
      Date.now()
    );
  }

  /**
   * Convert to JSON representation compatible with VocabPack interface.
   */
  public toJSON(): VocabPackData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      words: this.getRawWords(),
      is_custom: this.isCustom,
      supports_handwriting: this.supportsHandwriting,
    };
  }

  /**
   * Trigger download of pack as a .json file.
   */
  public exportAsJsonFile(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.toJSON(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${this.name.replace(/[/\\?%*:|"<>]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Factory method to create VocabPackModel from JSON.
   */
  public static fromJSON(raw: any): VocabPackModel {
    if (!raw) return new VocabPackModel('', 'Chưa đặt tên');
    const words = Array.isArray(raw.words)
      ? raw.words.map((w: any) => Word.fromJSON(w))
      : [];
    return new VocabPackModel(
      raw.id || `custom_${Date.now()}`,
      raw.name || 'Gói từ mới',
      raw.description || '',
      words,
      Boolean(raw.is_custom),
      Boolean(raw.supports_handwriting),
      raw.createdAt || Date.now(),
      raw.updatedAt || Date.now()
    );
  }
}
