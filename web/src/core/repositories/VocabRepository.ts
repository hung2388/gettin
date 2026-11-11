import { VocabPackModel } from '../models/VocabPack';
import { Word } from '../models/Word';
import { PackRegistry } from '../registry/PackRegistry';
import { SmartImportService, ParseResult } from '../parsers/TextImportParser';

const CUSTOM_PACKS_KEY = 'kanalearner_custom_packs_v1';

export type RepositoryListener = () => void;

/**
 * Repository Pattern for Centralized Data Access & In-Memory Caching.
 * Decouples storage details from UI, ensures instant O(1) reads, and notifies subscribers.
 */
export class VocabRepository {
  private static instance: VocabRepository;
  private customPacksCache: VocabPackModel[] | null = null;
  private reviewAllCache: VocabPackModel | null = null;
  private listeners: Set<RepositoryListener> = new Set();
  private registry: PackRegistry;

  private constructor() {
    this.registry = PackRegistry.getInstance();
  }

  public static getInstance(): VocabRepository {
    if (!VocabRepository.instance) {
      VocabRepository.instance = new VocabRepository();
    }
    return VocabRepository.instance;
  }

  /**
   * Subscribe to repository state changes. Returns an unsubscribe function.
   */
  public subscribe(listener: RepositoryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.reviewAllCache = null; // Invalidate review cache
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in VocabRepository listener:', err);
      }
    }
  }

  /**
   * Load custom packs with memory caching.
   */
  public getCustomPacks(): VocabPackModel[] {
    if (this.customPacksCache !== null) {
      return this.customPacksCache;
    }

    try {
      const raw = localStorage.getItem(CUSTOM_PACKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.customPacksCache = parsed.map((item: any) => VocabPackModel.fromJSON(item));
          return this.customPacksCache;
        }
      }
    } catch (e) {
      console.error('Error loading custom packs from localStorage:', e);
    }

    this.customPacksCache = [];
    return this.customPacksCache;
  }

  /**
   * Get all built-in packs from registry.
   */
  public getBuiltInPacks(): VocabPackModel[] {
    return this.registry.getAll();
  }

  /**
   * Get all packs (Built-in + Custom + Review All).
   */
  public getAllPacks(): VocabPackModel[] {
    const builtIns = this.getBuiltInPacks();
    const customs = this.getCustomPacks();
    const reviewAll = this.getReviewAllPack();
    return [...builtIns, ...customs, reviewAll];
  }

  /**
   * Find a pack by ID across built-ins, customs, and special packs.
   */
  public getPackById(id: string): VocabPackModel | null {
    if (id === 'review_all') {
      return this.getReviewAllPack();
    }

    // Check registry
    const builtIn = this.registry.get(id);
    if (builtIn) return builtIn;

    // Check customs
    const customs = this.getCustomPacks();
    const custom = customs.find((p) => p.id === id);
    if (custom) return custom;

    return null;
  }

  /**
   * Save custom packs array to localStorage and update cache.
   */
  private saveCustomPacksToStorage(packs: VocabPackModel[]): void {
    this.customPacksCache = packs;
    try {
      const dataToSave = packs.map((p) => p.toJSON());
      localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving custom packs to localStorage:', e);
    }
    this.notify();
  }

  /**
   * Create and persist a new custom pack.
   */
  public createCustomPack(name: string, description: string, words: Word[]): VocabPackModel {
    const newPack = new VocabPackModel(
      `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      description,
      words,
      true,
      false,
      Date.now(),
      Date.now()
    );

    const current = [...this.getCustomPacks(), newPack];
    this.saveCustomPacksToStorage(current);
    return newPack;
  }

  /**
   * Update an existing custom pack.
   */
  public updateCustomPack(id: string, name: string, description: string, words: Word[]): boolean {
    const customs = [...this.getCustomPacks()];
    const index = customs.findIndex((p) => p.id === id);
    if (index === -1) return false;

    customs[index].name = name;
    customs[index].description = description;
    customs[index].setWords(words);

    this.saveCustomPacksToStorage(customs);
    return true;
  }

  /**
   * Delete a custom pack by ID.
   */
  public deleteCustomPack(id: string): boolean {
    const current = this.getCustomPacks();
    const filtered = current.filter((p) => p.id !== id);
    if (filtered.length !== current.length) {
      this.saveCustomPacksToStorage(filtered);
      return true;
    }
    return false;
  }

  /**
   * Duplicate a pack into a new custom pack.
   */
  public duplicatePack(id: string): VocabPackModel | null {
    const target = this.getPackById(id);
    if (!target) return null;

    const cloned = target.clone();
    const current = [...this.getCustomPacks(), cloned];
    this.saveCustomPacksToStorage(current);
    return cloned;
  }

  /**
   * Import pack easily from raw text (Excel, tab, pipe, colon) using SmartImportService.
   */
  public importFromText(
    name: string,
    description: string,
    rawText: string
  ): { pack: VocabPackModel; result: ParseResult } {
    const result = SmartImportService.getInstance().parseText(rawText);
    const pack = this.createCustomPack(name, description, result.words);
    return { pack, result };
  }

  /**
   * Get deduplicated Review All pack with caching.
   */
  public getReviewAllPack(): VocabPackModel {
    if (this.reviewAllCache) {
      return this.reviewAllCache;
    }

    const allWords: Word[] = [];
    const builtIns = this.getBuiltInPacks();
    const customs = this.getCustomPacks();

    for (const p of builtIns) {
      allWords.push(...p.getWords());
    }
    for (const p of customs) {
      allWords.push(...p.getWords());
    }

    // Deduplicate by word + romaji
    const seen = new Set<string>();
    const unique: Word[] = [];
    for (const w of allWords) {
      const key = `${w.word}_${w.romaji}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(w);
      }
    }

    this.reviewAllCache = new VocabPackModel(
      'review_all',
      'Review All 💡',
      'Tổng hợp tất cả từ vựng của các chủ đề',
      unique,
      false,
      false
    );

    return this.reviewAllCache;
  }
}
