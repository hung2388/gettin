import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { VocabPack, WordEntry } from '@/data/types';
import { VocabRepository } from '@/core/repositories/VocabRepository';
import { Word } from '@/core/models/Word';
import { BatchImportModal } from '@/components/vocab/BatchImportModal';
import { WordRowEditor } from '@/components/vocab/WordRowEditor';

interface VocabPacksScreenProps {
  onSelectPack: (packId: string) => void;
  onBack: () => void;
}

export const VocabPacksScreen: React.FC<VocabPacksScreenProps> = ({ onSelectPack, onBack }) => {
  const repo = useMemo(() => VocabRepository.getInstance(), []);
  const [packs, setPacks] = useState<VocabPack[]>(() => repo.getAllPacks().map((p) => p.toJSON()));

  // Modals state
  const [editingPack, setEditingPack] = useState<VocabPack | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [words, setWords] = useState<WordEntry[]>([{ word: '', kana: '', romaji: '', meaning: '' }]);

  // Subscribe to VocabRepository updates
  useEffect(() => {
    const unsubscribe = repo.subscribe(() => {
      setPacks(repo.getAllPacks().map((p) => p.toJSON()));
    });
    return unsubscribe;
  }, [repo]);

  const refreshList = () => {
    setPacks(repo.getAllPacks().map((p) => p.toJSON()));
  };

  const openEditor = (pack: VocabPack | null = null) => {
    if (pack) {
      setEditingPack(pack);
      setName(pack.name);
      setDesc(pack.description);
      setWords(pack.words.length ? [...pack.words] : [{ word: '', kana: '', romaji: '', meaning: '' }]);
    } else {
      setEditingPack(null);
      setName('');
      setDesc('');
      setWords([{ word: '', kana: '', romaji: '', meaning: '' }]);
    }
    setIsEditorOpen(true);
  };

  // Optimized row editor callback with zero full-list re-renders
  const handleUpdateWordRow = useCallback((index: number, field: keyof WordEntry, value: string) => {
    setWords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleRemoveWordRow = useCallback((index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddRows = (count: number) => {
    const newRows: WordEntry[] = Array.from({ length: count }, () => ({
      word: '',
      kana: '',
      romaji: '',
      meaning: '',
    }));
    setWords((prev) => [...prev, ...newRows]);
  };

  const handleSavePack = () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên chủ đề!');
      return;
    }

    const validWords = words.filter((w) => w.word.trim() || w.romaji.trim() || w.meaning.trim());
    if (validWords.length === 0) {
      alert('Vui lòng nhập ít nhất 1 từ vựng!');
      return;
    }

    const wordModels = validWords.map((w) => Word.fromJSON(w));

    if (editingPack) {
      repo.updateCustomPack(editingPack.id, name.trim(), desc.trim(), wordModels);
    } else {
      repo.createCustomPack(name.trim(), desc.trim(), wordModels);
    }

    setIsEditorOpen(false);
    refreshList();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chủ đề tự chọn này không?')) {
      repo.deleteCustomPack(id);
      refreshList();
    }
  };

  const handleDuplicate = (pack: VocabPack) => {
    const cloned = repo.duplicatePack(pack.id);
    if (cloned) {
      refreshList();
      alert(`Đã nhân bản thành công gói từ: "${cloned.name}"`);
    }
  };

  const handleExport = (pack: VocabPack) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pack, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${pack.name.replace(/[/\\?%*:|"<>]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.name && Array.isArray(parsed.words)) {
          const wordModels = parsed.words.map((w: any) => Word.fromJSON(w));
          repo.createCustomPack(parsed.name, parsed.description || '', wordModels);
          refreshList();
          alert(`Đã nhập thành công chủ đề: ${parsed.name}`);
        } else {
          alert('File JSON không đúng cấu trúc (thiếu name hoặc words)!');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };

  // Filtered packs
  const filteredPacks = useMemo(() => {
    if (!searchQuery.trim()) return packs;
    const q = searchQuery.toLowerCase().trim();
    return packs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.words.some((w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    );
  }, [packs, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#171822] hover:bg-[#20222f] text-zinc-300 border border-[#242635] transition-colors"
          >
            <PixelIcon name="arrow-left" size={14} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Kho Từ Vựng Tiếng Nhật
            </h2>
            <p className="text-xs text-zinc-400">
              Quản lý bài học hệ thống & tạo gói từ mới nhanh chóng qua bảng tính hoặc gõ trực tiếp
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Batch Import Button */}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/25 transition-all"
          >
            <PixelIcon name="upload" size={12} />
            <span>⚡ Nhập Siêu Tốc (Excel / Text)</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#171822] hover:bg-[#20222f] text-zinc-200 font-semibold text-xs cursor-pointer border border-[#242635] transition-all">
            <PixelIcon name="download" size={12} className="text-zinc-400" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={() => openEditor(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1b28] hover:bg-[#25283c] text-zinc-200 font-bold text-xs border border-[#2a2d42] transition-all"
          >
            <PixelIcon name="plus" size={12} />
            <span>Tạo Thủ Công</span>
          </button>
        </div>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[#12131b] border border-[#202230]">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm gói từ hoặc từ vựng..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#181925] border border-[#242638] text-xs text-white placeholder:text-zinc-500 focus:border-red-500/70 outline-none"
          />
          <div className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400 self-end sm:self-auto">
          <span>
            Tổng cộng: <strong className="text-white">{packs.length}</strong> chủ đề
          </span>
          <span className="text-zinc-600">|</span>
          <span>
            Từ vựng:{' '}
            <strong className="text-red-400 font-mono">
              {packs.reduce((acc, p) => (p.id !== 'review_all' ? acc + p.words.length : acc), 0)}
            </strong>{' '}
            từ
          </span>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPacks.map((pack) => {
          const isReview = pack.id === 'review_all';
          const isCustom = pack.is_custom;

          return (
            <div
              key={pack.id}
              className={`group p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isCustom
                  ? 'bg-[#141520] border-emerald-500/20 hover:border-emerald-500/50'
                  : 'bg-[#13141c] border-[#222432] hover:border-red-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-extrabold text-base text-white group-hover:text-red-400 transition-colors">
                    {pack.name}
                  </h3>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isReview
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isCustom
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1e202c] text-zinc-400 border border-[#2a2d3e]'
                    }`}
                  >
                    {isReview ? '💡 Ôn tập' : isCustom ? '✨ Tự chọn của bạn' : '🎌 Hệ thống'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                  {pack.description || 'Không có mô tả'} ·{' '}
                  <strong className="text-zinc-200">{pack.words.length} từ</strong>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-[#1e202c]">
                <div className="flex items-center gap-1.5">
                  {isCustom ? (
                    <>
                      <button
                        onClick={() => openEditor(pack)}
                        className="p-2 rounded-lg bg-[#1a1b26] hover:bg-[#252837] text-zinc-300 transition-colors"
                        title="Chỉnh sửa chủ đề"
                      >
                        <PixelIcon name="edit" size={12} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(pack)}
                        className="p-2 rounded-lg bg-[#1a1b26] hover:bg-[#252837] text-zinc-300 transition-colors"
                        title="Nhân bản chủ đề"
                      >
                        <PixelIcon name="layers" size={12} />
                      </button>
                      <button
                        onClick={() => handleExport(pack)}
                        className="p-2 rounded-lg bg-[#1a1b26] hover:bg-[#252837] text-zinc-300 transition-colors"
                        title="Xuất file JSON"
                      >
                        <PixelIcon name="download" size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Xóa chủ đề"
                      >
                        <PixelIcon name="trash" size={12} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDuplicate(pack)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b26] hover:bg-[#252837] text-zinc-300 text-[11px] font-semibold transition-colors"
                      title="Nhân bản gói hệ thống để tùy biến"
                    >
                      <PixelIcon name="layers" size={11} />
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSelectPack(pack.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1b1c28] hover:bg-[#c93b3b] text-zinc-200 hover:text-white font-bold text-xs border border-[#2b2e40] hover:border-red-500/40 transition-all"
                >
                  <span>Học Ngay</span>
                  <PixelIcon name="chevron-right" size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={(packName, wordCount) => {
          refreshList();
          alert(`Đã tạo thành công gói từ "${packName}" với ${wordCount} từ vựng!`);
        }}
      />

      {/* Editor Modal with Zero-Lag Memoized Rows */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13141c] border border-[#242635] rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#212330]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingPack ? `Sửa chủ đề: ${editingPack.name}` : 'Tạo Chủ Đề Tự Học Mới'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Nhập danh sách từ vựng chi tiết từng dòng (đã tối ưu gõ phím siêu tốc)
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <PixelIcon name="close" size={14} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Tên chủ đề *:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: JLPT N5 - Động từ nhóm 1"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#181924] border border-[#252837] text-white text-xs focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Mô tả ngắn:</label>
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Mô tả danh sách từ vựng..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#181924] border border-[#252837] text-white text-xs focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-zinc-300">
                    Danh sách từ ({words.length} dòng):
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddRows(1)}
                      className="text-xs font-bold text-red-400 hover:underline"
                    >
                      + 1 dòng
                    </button>
                    <span className="text-zinc-600">·</span>
                    <button
                      type="button"
                      onClick={() => handleAddRows(5)}
                      className="text-xs font-bold text-cyan-400 hover:underline"
                    >
                      + 5 dòng
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {words.map((w, idx) => (
                    <WordRowEditor
                      key={idx}
                      index={idx}
                      word={w}
                      onUpdate={handleUpdateWordRow}
                      onRemove={handleRemoveWordRow}
                      canRemove={words.length > 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#212330] mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditorOpen(false);
                  setIsBatchModalOpen(true);
                }}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                ⚡ Chuyển sang chế độ dán từ Excel
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1d28] text-zinc-300 text-xs font-bold hover:bg-[#252838]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePack}
                  className="px-5 py-2 rounded-full bg-[#c93b3b] text-white text-xs font-extrabold hover:bg-[#e74c3c] shadow-md shadow-red-500/20"
                >
                  Lưu Chủ Đề
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
