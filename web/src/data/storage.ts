import { VocabPack, WordEntry, UserProgress } from './types';
import { getAllBuiltInPacks, getBuiltInPack } from './wordData';

const PROGRESS_KEY = 'kanalearner_progress_v1';
const CUSTOM_PACKS_KEY = 'kanalearner_custom_packs_v1';
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

// ── Custom Packs Storage ──────────────────────────────────────────────────

export function loadCustomPacks(): VocabPack[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PACKS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        words: item.words || [],
        is_custom: true,
      }));
    }
  } catch (e) {
    console.error('Error loading custom packs:', e);
  }
  return [];
}

export function saveCustomPacks(packs: VocabPack[]): void {
  try {
    localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
  } catch (e) {
    console.error('Error saving custom packs:', e);
  }
}

export function addCustomPack(name: string, description: string, words: WordEntry[]): VocabPack {
  const packs = loadCustomPacks();
  const newPack: VocabPack = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    description,
    words,
    is_custom: true,
  };
  packs.push(newPack);
  saveCustomPacks(packs);
  return newPack;
}

export function updateCustomPack(id: string, name: string, description: string, words: WordEntry[]): void {
  const packs = loadCustomPacks();
  const idx = packs.findIndex((p) => p.id === id);
  if (idx !== -1) {
    packs[idx] = { ...packs[idx], name, description, words };
    saveCustomPacks(packs);
  }
}

export function deleteCustomPack(id: string): void {
  const packs = loadCustomPacks().filter((p) => p.id !== id);
  saveCustomPacks(packs);
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

// ── Master Pack Finder ───────────────────────────────────────────────────

export function getVocabPack(packId: string): VocabPack | null {
  // Built-in pack
  const builtIn = getBuiltInPack(packId);
  if (builtIn) return builtIn;

  // Custom pack
  const customs = loadCustomPacks();
  const custom = customs.find((p) => p.id === packId);
  if (custom) return custom;

  // Review All Pack
  if (packId === 'review_all') {
    const allWords: WordEntry[] = [];
    const builtIns = getAllBuiltInPacks();
    builtIns.forEach((p) => allWords.push(...p.words));
    customs.forEach((p) => allWords.push(...p.words));

    // Deduplicate
    const seen = new Set<string>();
    const unique: WordEntry[] = [];
    allWords.forEach((w) => {
      const key = `${w.word}_${w.romaji}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(w);
      }
    });

    return {
      id: 'review_all',
      name: 'Review All 💡',
      description: 'Tổng hợp tất cả từ vựng của các chủ đề',
      words: unique,
      is_custom: false,
    };
  }

  return null;
}

export function getAllVocabPacks(): VocabPack[] {
  const builtIns = getAllBuiltInPacks();
  const customs = loadCustomPacks();
  const reviewPack = getVocabPack('review_all');
  const result = [...builtIns, ...customs];
  if (reviewPack) result.push(reviewPack);
  return result;
}
