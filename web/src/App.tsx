import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { LearningPathScreen } from '@/components/screens/LearningPathScreen';
import { VocabPacksScreen } from '@/components/screens/VocabPacksScreen';
import { VocabStudyHubScreen } from '@/components/screens/VocabStudyHubScreen';
import { KanaChartModal } from '@/components/screens/KanaChartModal';
import { StatsModal } from '@/components/screens/StatsModal';

import { Level1DualChoice } from '@/components/levels/Level1DualChoice';
import { Level2Recall } from '@/components/levels/Level2Recall';
import { Level3Listening } from '@/components/levels/Level3Listening';
import { Level4Matching } from '@/components/levels/Level4Matching';
import { Level5SpeedTyping } from '@/components/levels/Level5SpeedTyping';
import { HandwritingCanvas } from '@/components/levels/HandwritingCanvas';
import { StageDoneModal } from '@/components/levels/StageDoneModal';
import { ReferenceModal } from '@/components/screens/ReferenceModal';

import { WordEntry, UserProgress } from '@/data/types';
import { HIRAGANA_WORDS } from '@/data/wordData';
import { loadProgress, updateTopicProgress, getVocabPack } from '@/data/storage';

type ViewMode =
  | 'path'
  | 'vocab_packs'
  | 'study_hub'
  | 'level1'
  | 'level2'
  | 'level3'
  | 'level4'
  | 'level5'
  | 'handwriting';

export function App() {
  const [view, setView] = useState<ViewMode>('path');
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  // Navigation states
  const [selectedPackId, setSelectedPackId] = useState<string>('');

  // Active word pools for current level / quiz
  const [activeWords, setActiveWords] = useState<WordEntry[]>([]);
  const [allPackWords, setAllPackWords] = useState<WordEntry[]>([]);

  // Stage done state
  const [doneStats, setDoneStats] = useState<{
    correct: number;
    mistakes: number;
    missed: WordEntry[];
  } | null>(null);

  const handleSelectPack = (packId: string) => {
    setSelectedPackId(packId);
    setView('study_hub');
  };

  // Track where the current level/quiz was launched from so "Quay lại" returns to the right place
  const [returnView, setReturnView] = useState<ViewMode>('path');

  const handleLevelBack = () => {
    setStageQueue([]);
    setView(returnView || 'path');
  };

  const handleStartLevelFromHub = (levelNum: number, selected: WordEntry[]) => {
    setReturnView('study_hub');
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
    setReturnView(selectedPackId ? 'study_hub' : 'path');
    setActiveWords(selected);
    setView('handwriting');
  };

  const handleQuickReview = (reviewWords: WordEntry[]) => {
    setReturnView('path');
    setActiveWords(reviewWords);
    setAllPackWords(HIRAGANA_WORDS);
    setView('level1');
  };

  // Stage queue for multi-stage practice
  const [stageQueue, setStageQueue] = useState<number[]>([]);

  const launchStage = (stageId: number, words: WordEntry[]) => {
    setActiveWords(words);
    setAllPackWords(words);
    if (stageId === 1) setView('level1');
    else if (stageId === 2) setView('level2');
    else if (stageId === 3) setView('level4'); // Tìm cặp
    else if (stageId === 4 || stageId === 5 || stageId === 6) setView('level5'); // Viết câu trả lời / Viết từ
    else if (stageId === 7) setView('level3'); // Nghe
    else if (stageId === 8 || stageId === 9) setView('handwriting'); // Thứ tự nét / Vẽ kana
    else setView('level1');
  };

  const handleStartDirectPractice = (wordsToPractice: WordEntry[], stages?: number[]) => {
    setReturnView('path');
    const queue = stages && stages.length > 0 ? stages : [1];
    const first = queue[0];
    setStageQueue(queue.slice(1));
    launchStage(first, wordsToPractice);
  };

  const handleLevelFinish = (stats: {
    correct: number;
    mistakes: number;
    missed: WordEntry[];
  }) => {
    setDoneStats(stats);
    const keyToUpdate = selectedPackId || 'hiragana';
    if (keyToUpdate) {
      const updated = updateTopicProgress(keyToUpdate, 100);
      setProgress(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f1f2f6] flex flex-col font-sans">
      {/* Left Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        activeView={view === 'vocab_packs' ? 'vocab_packs' : 'path'}
        setActiveView={(v) => setView(v === 'vocab_packs' ? 'vocab_packs' : 'path')}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenKanaChart={() => setIsKanaChartOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Content Area (Pushed by sidebar on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <AppHeader
          activeView={view === 'vocab_packs' ? 'vocab_packs' : 'path'}
          setActiveView={(v) => setView(v === 'vocab_packs' ? 'vocab_packs' : 'path')}
          progress={progress}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
        />

        <main className="flex-1">
          {view === 'path' && (
            <LearningPathScreen
              progress={progress}
              onSelectPack={handleSelectPack}
              onSelectReference={(id) => setReferenceId(id)}
              onQuickReview={handleQuickReview}
              onStartDirectPractice={handleStartDirectPractice}
            />
          )}

          {view === 'vocab_packs' && (
            <VocabPacksScreen
              onSelectPack={handleSelectPack}
              onBack={() => setView('path')}
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
              onBack={handleLevelBack}
              onFinish={handleLevelFinish}
            />
          )}

          {view === 'level2' && (
            <Level2Recall
              words={activeWords}
              onBack={handleLevelBack}
              onFinish={handleLevelFinish}
            />
          )}

          {view === 'level3' && (
            <Level3Listening
              words={activeWords}
              onBack={handleLevelBack}
              onFinish={handleLevelFinish}
            />
          )}

          {view === 'level4' && (
            <Level4Matching
              words={activeWords}
              onBack={handleLevelBack}
              onFinish={handleLevelFinish}
            />
          )}

          {view === 'level5' && (
            <Level5SpeedTyping
              words={activeWords}
              onBack={handleLevelBack}
              onFinish={handleLevelFinish}
            />
          )}

          {view === 'handwriting' && (
            <HandwritingCanvas
              words={activeWords}
              onBack={handleLevelBack}
            />
          )}
        </main>
      </div>

      {/* Stage Complete Popup */}
      {doneStats && (
        <StageDoneModal
          stats={doneStats}
          onRepeat={() => {
            setDoneStats(null);
          }}
          onNext={() => {
            if (stageQueue.length > 0) {
              const nextStage = stageQueue[0];
              setStageQueue((prev) => prev.slice(1));
              setDoneStats(null);
              launchStage(nextStage, activeWords);
            } else {
              setDoneStats(null);
              setView('path');
            }
          }}
        />
      )}

      {/* Grammar Reference Modal */}
      {referenceId && (
        <ReferenceModal
          id={referenceId}
          onClose={() => setReferenceId(null)}
        />
      )}

      {/* Kana 50-Sound Interactive Chart Modal */}
      {isKanaChartOpen && (
        <KanaChartModal onClose={() => setIsKanaChartOpen(false)} />
      )}

      {/* Statistics Modal */}
      {isStatsOpen && (
        <StatsModal progress={progress} onClose={() => setIsStatsOpen(false)} />
      )}
    </div>
  );
}
