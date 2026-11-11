import React, { useState, useMemo } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { SmartImportService, ParseResult } from '@/core/parsers/TextImportParser';
import { VocabRepository } from '@/core/repositories/VocabRepository';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (packName: string, wordCount: number) => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Mẫu 1: Excel / Google Sheets (Tab)',
    text: `ねこ\tねこ\tneko\tcon mèo\nいぬ\tいぬ\tinu\tcon chó\nさくら\tさくら\tsakura\thoa anh đào\nみず\tみず\tmizu\tnước`,
  },
  {
    name: 'Mẫu 2: Dấu gạch đứng (|)',
    text: `食べる | たべる | taberu | ăn\n飲む | のむ | nomu | uống\n見る | みる | miru | nhìn, xem\n聞く | きく | kiku | nghe`,
  },
  {
    name: 'Mẫu 3: Đơn giản (Từ : Nghĩa)',
    text: `ありがとう : cảm ơn\nさようなら : tạm biệt\nおはよう : chào buổi sáng\nこんにちは : xin chào`,
  },
];

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [rawText, setRawText] = useState('');

  // Live Parsing with Memoization
  const parseResult: ParseResult = useMemo(() => {
    return SmartImportService.getInstance().parseText(rawText);
  }, [rawText]);

  if (!isOpen) return null;

  const handleApplySample = (sampleText: string) => {
    setRawText(sampleText);
    if (!name) setName('Gói từ vựng mẫu');
    if (!desc) setDesc('Nhập nhanh từ danh sách mẫu');
  };

  const handleImport = () => {
    if (!name.trim()) {
      alert('Vui lòng nhập Tên chủ đề / gói từ!');
      return;
    }

    if (parseResult.validCount === 0) {
      alert('Chưa có từ vựng hợp lệ nào được phát hiện! Vui lòng kiểm tra lại nội dung.');
      return;
    }

    const repo = VocabRepository.getInstance();
    repo.createCustomPack(name.trim(), desc.trim(), parseResult.words);

    onSuccess(name.trim(), parseResult.validCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12131c] border border-[#26283b] rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#212330]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <PixelIcon name="upload" size={16} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Nhập Từ Vựng Siêu Tốc ⚡
              </h3>
              <p className="text-xs text-zinc-400">
                Copy và dán trực tiếp từ Excel, Google Sheets, Quizlet hoặc gõ cú pháp tự nhiên
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-[#1a1b28]">
            <PixelIcon name="close" size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 overflow-y-auto pr-2 py-4 flex-1">
          {/* Metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tên chủ đề / gói từ <span className="text-red-400">*</span>:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: JLPT N5 - Động từ nhóm 1"
                className="w-full px-3.5 py-2 rounded-xl bg-[#171825] border border-[#26283b] text-white text-xs focus:border-red-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Mô tả ngắn:</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="VD: 50 động từ thường gặp trong kỳ thi..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#171825] border border-[#26283b] text-white text-xs focus:border-red-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-zinc-400">Dán từ bảng tính hoặc chọn mẫu thử:</span>
              <div className="flex items-center gap-1.5">
                {SAMPLE_TEMPLATES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySample(sample.text)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1a1c2a] hover:bg-[#25283c] text-zinc-300 border border-[#292c42] transition-colors"
                  >
                    Mẫu {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Paste Textarea */}
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung từ vựng vào đây...&#10;Ví dụ hỗ trợ:&#10;• Excel/Sheets: Kanji [Tab] Kana [Tab] Romaji [Tab] Nghĩa&#10;• Gạch đứng: 食べる | たべる | taberu | ăn&#10;• Đơn giản: ありがとう : cảm ơn"
              className="w-full px-4 py-3 rounded-2xl bg-[#0e0f17] border border-[#232537] text-white font-mono text-xs focus:border-red-500/70 outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
            />
          </div>

          {/* Live Analysis Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#151622] border border-[#222436] text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">
                Định dạng:{' '}
                <strong className="text-cyan-400 font-mono">{parseResult.formatDetected}</strong>
              </span>
              <span className="text-zinc-400">
                Tổng số dòng: <strong className="text-white">{parseResult.totalLines}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Phát hiện từ hợp lệ:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {parseResult.validCount} từ
              </span>
            </div>
          </div>

          {/* Live Preview Table */}
          {parseResult.words.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-zinc-400 mb-2">
                Xem trước kết quả phân tích ({Math.min(parseResult.words.length, 5)} / {parseResult.words.length} từ):
              </div>
              <div className="border border-[#232537] rounded-xl overflow-hidden bg-[#0c0d14]">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#171826] text-zinc-400 text-[10px] font-bold uppercase border-b border-[#232537]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Từ / Kanji</th>
                      <th className="py-2 px-3">Kana</th>
                      <th className="py-2 px-3">Romaji</th>
                      <th className="py-2 px-3">Nghĩa tiếng Việt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2030] font-mono text-[11px]">
                    {parseResult.words.slice(0, 5).map((w, i) => (
                      <tr key={i} className="hover:bg-[#151624]">
                        <td className="py-1.5 px-3 text-zinc-500">{i + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-white font-sans">{w.word}</td>
                        <td className="py-1.5 px-3 text-red-300">{w.kana || '-'}</td>
                        <td className="py-1.5 px-3 text-amber-300">{w.romaji || '-'}</td>
                        <td className="py-1.5 px-3 text-zinc-200 font-sans">{w.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#212330] mt-2">
          <div className="text-xs text-zinc-500">
            {parseResult.validCount > 0 ? (
              <span className="text-emerald-400">✓ Sẵn sàng tạo gói từ</span>
            ) : (
              'Hãy dán ít nhất 1 từ vựng hợp lệ'
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#191a27] text-zinc-300 text-xs font-bold hover:bg-[#232537] transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={parseResult.validCount === 0}
              className={`px-5 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all ${
                parseResult.validCount > 0
                  ? 'bg-[#c93b3b] hover:bg-[#e74c3c] text-white shadow-red-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <PixelIcon name="check" size={12} />
              <span>Tạo Gói ({parseResult.validCount} từ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
