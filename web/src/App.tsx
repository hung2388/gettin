import React, { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { LearningPathScreen } from '@/components/screens/LearningPathScreen';
import { TopicDetailsScreen } from '@/components/screens/TopicDetailsScreen';
import { VocabPacksScreen } from '@/components/screens/VocabPacksScreen';
import { VocabStudyHubScreen } from '@/components/screens/VocabStudyHubScreen';

import { Level1DualChoice } from '@/components/levels/Level1DualChoice';
import { Level2Recall } from '@/components/levels/Level2Recall';
import { Level3Listening } from '@/components/levels/Level3Listening';
import { Level4Matching } from '@/components/levels/Level4Matching';
import { Level5SpeedTyping } from '@/components/levels/Level5SpeedTyping';
import { HandwritingCanvas } from '@/components/levels/HandwritingCanvas';
import { StageDoneModal } from '@/components/levels/StageDoneModal';

import { WordEntry, UserProgress } from '@/data/types';
import { generateRandomNumberEntries } from '@/data/kanaData';
import { HIRAGANA_WORDS, KATAKANA_WORDS } from '@/data/wordData';
import { loadProgress, updateTopicProgress, getVocabPack } from '@/data/storage';

type ViewMode = 'path' | 'topic' | 'vocab_packs' | 'study_hub' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5' | 'handwriting';

export function App() {
  const [view, setView] = useState<ViewMode>('path');
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  // Navigation states
  const [selectedTopicKey, setSelectedTopicKey] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [selectedPackId, setSelectedPackId] = useState<string>('');

  // Active word pools for current level / quiz
  const [activeWords, setActiveWords] = useState<WordEntry[]>([]);
  const [allPackWords, setAllPackWords] = useState<WordEntry[]>([]);

  // Stage done state
  const [doneStats, setDoneStats] = useState<{ correct: number; mistakes: number; missed: WordEntry[] } | null>(null);

  const getTopicWords = (key: string): WordEntry[] => {
    if (key === 'hiragana') {
      return HIRAGANA_WORDS;
    }
    if (key === 'katakana') {
      return KATAKANA_WORDS;
    }
    if (key === 'numbers') {
      return generateRandomNumberEntries(25).map((e) => ({ word: e.kana, romaji: e.romaji, meaning: e.hint || e.kana }));
    }
    const pack = getVocabPack(key);
    return pack ? pack.words : [];
  };

  const handleSelectTopic = (key: string, name: string) => {
    setSelectedTopicKey(key);
    setSelectedTopicName(name);
    setView('topic');
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    setView('study_hub');
  };

  const handleStartQuizFromTopic = (selected: WordEntry[]) => {
    setActiveWords(selected);
    const full = getTopicWords(selectedTopicKey);
    setAllPackWords(full);
    setView('level1');
  };

  const handleStartLevelFromHub = (levelNum: number, selected: WordEntry[]) => {
    setActiveWords(selected);
    const pack = getVocabPack(selectedPackId);
    setAllPackWords(pack ? pack.words : selected);

    if (levelNum === 1) setView('level1');
    else if (levelNum === 2) setView('level2');
    else if (levelNum === 3) setView('level3');
    else if (levelNum === 4) setView('level4');
    else if (levelNum === 5) setView('level5');
  };

  const handleStartHandwriting = (selected: WordEntry[]) => {
    setActiveWords(selected);
    setView('handwriting');
  };

  const handleLevelFinish = (stats: { correct: number; mistakes: number; missed: WordEntry[] }) => {
    setDoneStats(stats);
    // Mark progress 100%
    const keyToUpdate = selectedPackId || selectedTopicKey;
    if (keyToUpdate) {
      const updated = updateTopicProgress(keyToUpdate, 100);
      setProgress(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <AppHeader
        activeView={view === 'vocab_packs' ? 'vocab_packs' : 'path'}
        setActiveView={(v) => setView(v === 'vocab_packs' ? 'vocab_packs' : 'path')}
        progress={progress}
      />

      <main className="flex-1">
        {view === 'path' && (
          <LearningPathScreen
            progress={progress}
            onSelectTopic={handleSelectTopic}
            onSelectPack={handleSelectPack}
          />
        )}

        {view === 'vocab_packs' && (
          <VocabPacksScreen
            onSelectPack={handleSelectPack}
            onBack={() => setView('path')}
          />
        )}

        {view === 'topic' && (
          <TopicDetailsScreen
            topicKey={selectedTopicKey}
            topicName={selectedTopicName}
            words={getTopicWords(selectedTopicKey)}
            onBack={() => setView('path')}
            onStartQuiz={handleStartQuizFromTopic}
          />
        )}

        {view === 'study_hub' && (
          <VocabStudyHubScreen
            packId={selectedPackId}
            onBack={() => setView('vocab_packs')}
            onStartLevel={handleStartLevelFromHub}
            onStartHandwriting={handleStartHandwriting}
          />
        )}

        {view === 'level1' && (
          <Level1DualChoice
            words={activeWords}
            allPackWords={allPackWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
            onFinish={handleLevelFinish}
          />
        )}

        {view === 'level2' && (
          <Level2Recall
            words={activeWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
            onFinish={handleLevelFinish}
          />
        )}

        {view === 'level3' && (
          <Level3Listening
            words={activeWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
            onFinish={handleLevelFinish}
          />
        )}

        {view === 'level4' && (
          <Level4Matching
            words={activeWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
            onFinish={handleLevelFinish}
          />
        )}

        {view === 'level5' && (
          <Level5SpeedTyping
            words={activeWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
            onFinish={handleLevelFinish}
          />
        )}

        {view === 'handwriting' && (
          <HandwritingCanvas
            words={activeWords}
            onBack={() => setView(selectedPackId ? 'study_hub' : 'topic')}
          />
        )}
      </main>

      {/* Stage Complete Popup */}
      {doneStats && (
        <StageDoneModal
          stats={doneStats}
          onRepeat={() => {
            setDoneStats(null);
          }}
          onNext={() => {
            setDoneStats(null);
            setView('path');
          }}
        />
      )}
    </div>
  );
}
