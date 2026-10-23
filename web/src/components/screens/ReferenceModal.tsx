import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface ReferenceModalProps {
  id: string;
  onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({ id, onClose }) => {
  if (id !== 'pre_02') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121319] border border-[#232634] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-[#20222f] flex justify-between items-center bg-[#15161f]">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold font-jp">
              こ
            </span>
            <span>Bảng Hệ thống Đại từ chỉ thị: こ / そ / あ / ど</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-[#1c1d27] hover:bg-[#282b3a] rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <PixelIcon name="close" size={14} />
          </button>
        </div>

        <div className="p-6 overflow-x-auto flex-1">
          <div className="min-w-[550px] rounded-2xl border border-[#232635] bg-[#0c0d12] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#161720]">
                  <th className="p-3.5 border-b border-r border-[#232635] text-zinc-400 font-semibold w-1/5">
                    Phân loại
                  </th>
                  <th className="p-3.5 border-b border-r border-[#232635] text-red-400 font-semibold w-1/5 text-center">
                    Nhóm こ (Gần mình)
                  </th>
                  <th className="p-3.5 border-b border-r border-[#232635] text-amber-400 font-semibold w-1/5 text-center">
                    Nhóm そ (Gần bạn)
                  </th>
                  <th className="p-3.5 border-b border-r border-[#232635] text-cyan-400 font-semibold w-1/5 text-center">
                    Nhóm あ (Xa cả 2)
                  </th>
                  <th className="p-3.5 border-b border-[#232635] text-purple-400 font-semibold w-1/5 text-center">
                    Nhóm ど (Hỏi)
                  </th>
                </tr>
              </thead>
              <tbody className="text-base">
                <tr className="hover:bg-[#151620] transition-colors">
                  <td className="p-3.5 border-b border-r border-[#232635] text-zinc-400 text-xs font-medium">
                    Đồ vật
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    これ
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    それ
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    あれ
                  </td>
                  <td className="p-3.5 border-b border-[#232635] text-center font-bold text-white font-jp">
                    どれ
                  </td>
                </tr>
                <tr className="hover:bg-[#151620] transition-colors">
                  <td className="p-3.5 border-b border-r border-[#232635] text-zinc-400 text-xs font-medium">
                    Đồ vật / người (+ Danh từ)
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    この N
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    その N
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    あの N
                  </td>
                  <td className="p-3.5 border-b border-[#232635] text-center font-bold text-white font-jp">
                    どの N
                  </td>
                </tr>
                <tr className="hover:bg-[#151620] transition-colors">
                  <td className="p-3.5 border-b border-r border-[#232635] text-zinc-400 text-xs font-medium">
                    Địa điểm
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    ここ
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    そこ
                  </td>
                  <td className="p-3.5 border-b border-r border-[#232635] text-center font-bold text-white font-jp">
                    あそこ
                  </td>
                  <td className="p-3.5 border-b border-[#232635] text-center font-bold text-white font-jp">
                    どこ
                  </td>
                </tr>
                <tr className="hover:bg-[#151620] transition-colors">
                  <td className="p-3.5 border-r border-[#232635] text-zinc-400 text-xs font-medium">
                    Hướng / Lịch sự
                  </td>
                  <td className="p-3.5 border-r border-[#232635] text-center font-bold text-white font-jp">
                    こちら
                  </td>
                  <td className="p-3.5 border-r border-[#232635] text-center font-bold text-white font-jp">
                    そちら
                  </td>
                  <td className="p-3.5 border-r border-[#232635] text-center font-bold text-white font-jp">
                    あちら
                  </td>
                  <td className="p-3.5 text-center font-bold text-white font-jp">
                    どちら
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
