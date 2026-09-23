import React from 'react';
import { X } from 'lucide-react';

interface ReferenceModalProps {
  id: string;
  onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({ id, onClose }) => {
  if (id !== 'pre_02') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#131B2E] border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-[#131B2E] p-6 border-b border-slate-800 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-rose-500 flex items-center gap-3">
            <span className="text-3xl">🌸</span> Bảng Hệ thống Đại từ chỉ thị: こ/そ/あ/ど
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-x-auto">
          <div className="min-w-[600px] rounded-xl border border-slate-700 bg-[#0B0F19] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="p-4 border-b border-r border-slate-700 text-slate-300 font-semibold w-1/5"></th>
                  <th className="p-4 border-b border-r border-slate-700 text-slate-300 font-semibold w-1/5 text-center">Nhóm こ</th>
                  <th className="p-4 border-b border-r border-slate-700 text-slate-300 font-semibold w-1/5 text-center">Nhóm そ</th>
                  <th className="p-4 border-b border-r border-slate-700 text-slate-300 font-semibold w-1/5 text-center">Nhóm あ</th>
                  <th className="p-4 border-b border-slate-700 text-slate-300 font-semibold w-1/5 text-center">Nhóm ど</th>
                </tr>
              </thead>
              <tbody className="text-lg">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 border-b border-r border-slate-700 text-slate-400 text-sm font-medium">đồ vật</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">これ</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">それ</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">あれ</td>
                  <td className="p-4 border-b border-slate-700 text-center font-bold text-white">どれ</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 border-b border-r border-slate-700 text-slate-400 text-sm font-medium">đồ vật/người</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">この N</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">その N</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">あの N</td>
                  <td className="p-4 border-b border-slate-700 text-center font-bold text-white">どの N</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 border-b border-r border-slate-700 text-slate-400 text-sm font-medium">địa điểm</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">ここ</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">そこ</td>
                  <td className="p-4 border-b border-r border-slate-700 text-center font-bold text-white">あそこ</td>
                  <td className="p-4 border-b border-slate-700 text-center font-bold text-white">どこ</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 border-r border-slate-700 text-slate-400 text-sm font-medium">phương hướng/<br/>Người/ địa điểm (lịch sự)</td>
                  <td className="p-4 border-r border-slate-700 text-center font-bold text-white">こちら</td>
                  <td className="p-4 border-r border-slate-700 text-center font-bold text-white">そちら</td>
                  <td className="p-4 border-r border-slate-700 text-center font-bold text-white">あちら</td>
                  <td className="p-4 border-slate-700 text-center font-bold text-white">どちら</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
