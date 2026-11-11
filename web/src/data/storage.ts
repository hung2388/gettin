import { VocabPack, WordEntry, UserProgress } from './types';
import { VocabRepository } from '../core/repositories/VocabRepository';
import { Word } from '../core/models/Word';

const PROGRESS_KEY = 'kanalearner_progress_v1';
const SELECTED_WORDS_KEY = 'kanalearner_selected_words_v1';

// ── Progress Storage ──────────────────────────────────────────────────────

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  return {};
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function updateTopicProgress(topicId: string, percentage: number): UserProgress {
  const current = loadProgress();
  current[topicId] = Math.max(current[topicId] || 0, percentage);
  saveProgress(current);
  return current;
}

// ── Custom Packs Storage (Delegated to VocabRepository with In-Memory Cache) ──

export function loadCustomPacks(): VocabPack[] {
  return VocabRepository.getInstance()
    .getCustomPacks()
    .map((p) => p.toJSON());
}

export function saveCustomPacks(packs: VocabPack[]): void {
  const repo = VocabRepository.getInstance();
  // Clear and re-populate
  for (const pack of packs) {
    const words = pack.words.map((w) => Word.fromJSON(w));
    if (repo.getPackById(pack.id)) {
      repo.updateCustomPack(pack.id, pack.name, pack.description, words);
    } else {
      repo.createCustomPack(pack.name, pack.description, words);
    }
  }
}

export function addCustomPack(name: string, description: string, words: WordEntry[]): VocabPack {
  const wordModels = words.map((w) => Word.fromJSON(w));
  const newPack = VocabRepository.getInstance().createCustomPack(name, description, wordModels);
  return newPack.toJSON();
}

export function updateCustomPack(id: string, name: string, description: string, words: WordEntry[]): void {
  const wordModels = words.map((w) => Word.fromJSON(w));
  VocabRepository.getInstance().updateCustomPack(id, name, description, wordModels);
}

export function deleteCustomPack(id: string): void {
  VocabRepository.getInstance().deleteCustomPack(id);
}

// ── Word Selections Storage per Pack ──────────────────────────────────────

export function loadSelectedIndices(packId: string, totalWords: number): number[] {
  try {
    const raw = sessionStorage.getItem(`${SELECTED_WORDS_KEY}_${packId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.error('Error loading selected words for pack:', packId, e);
  }
  // Default: select all words
  return Array.from({ length: totalWords }, (_, i) => i);
}

export function saveSelectedIndices(packId: string, indices: number[]): void {
  try {
    sessionStorage.setItem(`${SELECTED_WORDS_KEY}_${packId}`, JSON.stringify(indices));
  } catch (e) {
    console.error('Error saving selected words for pack:', packId, e);
  }
}

// ── Master Pack Finder (Cached via VocabRepository) ───────────────────────

export function getVocabPack(packId: string): VocabPack | null {
  const model = VocabRepository.getInstance().getPackById(packId);
  return model ? model.toJSON() : null;
}

export function getAllVocabPacks(): VocabPack[] {
  return VocabRepository.getInstance()
    .getAllPacks()
    .map((p) => p.toJSON());
}
