import React, { useState } from 'react';
import { Plus, Download, Upload, Edit, Trash2, Play, Sparkles, BookOpen, ArrowLeft, X } from 'lucide-react';
import { VocabPack, WordEntry } from '@/data/types';
import { getAllVocabPacks, addCustomPack, updateCustomPack, deleteCustomPack } from '@/data/storage';

interface VocabPacksScreenProps {
  onSelectPack: (packId: string) => void;
  onBack: () => void;
}

export const VocabPacksScreen: React.FC<VocabPacksScreenProps> = ({ onSelectPack, onBack }) => {
  const [packs, setPacks] = useState<VocabPack[]>(() => getAllVocabPacks());
  const [editingPack, setEditingPack] = useState<VocabPack | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editor Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [words, setWords] = useState<WordEntry[]>([{ word: '', kana: '', romaji: '', meaning: '' }]);

  const refreshList = () => setPacks(getAllVocabPacks());

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

    if (editingPack) {
      updateCustomPack(editingPack.id, name, desc, validWords);
    } else {
      addCustomPack(name, desc, validWords);
    }

    setIsEditorOpen(false);
    refreshList();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chủ đề tự chọn này không?')) {
      deleteCustomPack(id);
      refreshList();
    }
  };

  const handleExport = (pack: VocabPack) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pack, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${pack.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.name && Array.isArray(parsed.words)) {
          addCustomPack(parsed.name, parsed.description || '', parsed.words);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Kho Từ Vựng Tiếng Nhật 🎌
            </h2>
            <p className="text-xs text-slate-400">Danh sách bài học hệ thống & chủ đề tự chọn của bạn</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer border border-slate-700 transition-all">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={() => openEditor(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Pack Mới</span>
          </button>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => {
          const isReview = pack.id === 'review_all';
          const isCustom = pack.is_custom;

          return (
            <div
              key={pack.id}
              className="group p-6 rounded-2xl bg-[#131B2E] border border-slate-800 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-purple-300 transition-colors">
                    {pack.name}
                  </h3>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isReview
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isCustom
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isReview ? '💡 Ôn tập' : isCustom ? '✨ Tự chọn' : '🎌 Hệ thống'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {pack.description} · <strong className="text-slate-200">{pack.words.length} từ</strong>
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  {isCustom && (
                    <>
                      <button
                        onClick={() => openEditor(pack)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExport(pack)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Xuất file JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onSelectPack(pack.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold text-xs border border-purple-500/30 transition-all"
                >
                  <span>Học Ngay 🎯</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingPack ? `Sửa chủ đề: ${editingPack.name}` : 'Tạo Chủ Đề Tự Học Mới'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên chủ đề:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: JLPT N5 - Từ vựng Động từ"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả ngắn:</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Mô tả danh sách từ vựng..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">Danh sách từ vựng:</label>
                  <button
                    onClick={() => setWords([...words, { word: '', kana: '', romaji: '', meaning: '' }])}
                    className="text-xs font-bold text-cyan-400 hover:underline"
                  >
                    + Thêm hàng từ
                  </button>
                </div>

                <div className="space-y-2">
                  {words.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Kanji/Từ"
                        value={w.word}
                        onChange={(e) => {
                          const next = [...words];
                          next[idx].word = e.target.value;
                          setWords(next);
                        }}
                        className="w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Kana"
                        value={w.kana || ''}
                        onChange={(e) => {
                          const next = [...words];
                          next[idx].kana = e.target.value;
                          setWords(next);
                        }}
                        className="w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Romaji"
                        value={w.romaji}
                        onChange={(e) => {
                          const next = [...words];
                          next[idx].romaji = e.target.value;
                          setWords(next);
                        }}
                        className="w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Nghĩa TV"
                        value={w.meaning}
                        onChange={(e) => {
                          const next = [...words];
                          next[idx].meaning = e.target.value;
                          setWords(next);
                        }}
                        className="w-1/4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                      {words.length > 1 && (
                        <button
                          onClick={() => setWords(words.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePack}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 shadow-md"
              >
                💾 Lưu Chủ Đề
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
