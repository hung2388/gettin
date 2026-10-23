import React, { useRef, useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { WordEntry } from '@/data/types';
import { speakJapanese } from '@/data/tts';

interface HandwritingCanvasProps {
  words: WordEntry[];
  onBack: () => void;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ words, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentWord = words[currentIndex] || null;

  useEffect(() => {
    clearCanvas();
  }, [currentIndex]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw guide grid
    ctx.strokeStyle = '#222535';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 text-center">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161722] hover:bg-[#20222f] text-zinc-300 text-xs font-semibold border border-[#232533] transition-all"
        >
          <PixelIcon name="arrow-left" size={12} />
          <span>Quay lại</span>
        </button>
        <h2 className="text-lg sm:text-xl font-black text-white">
          Luyện Viết Nét Chữ
        </h2>
      </div>

      {/* Target Word Info */}
      <div className="p-5 rounded-3xl bg-[#121319] border border-[#232635] mb-6">
        <div className="text-[11px] text-zinc-400 font-bold mb-1 uppercase tracking-wider">
          Mục tiêu luyện viết ({currentIndex + 1} / {words.length}):
        </div>
        <div className="text-4xl font-black text-white font-jp mb-1">{currentWord.word}</div>
        <div className="text-xs font-bold text-red-400">{currentWord.meaning}</div>
        {currentWord.kana && currentWord.kana !== currentWord.word && (
          <div className="text-xs text-zinc-400 mt-1">[{currentWord.kana}]</div>
        )}
      </div>

      {/* HTML5 Canvas Drawing Area */}
      <div className="relative inline-block bg-[#090a0e] rounded-3xl border-2 border-[#222432] shadow-2xl overflow-hidden mb-6">
        {/* Background Trace Hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-zinc-800/40 text-[180px] font-black font-jp">
          {currentWord.word}
        </div>

        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="relative z-10 cursor-crosshair touch-none"
        />
      </div>

      {/* Canvas Toolbar */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          onClick={() => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          }}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#181924] hover:bg-[#252837] text-white font-bold text-xs border border-[#252837] disabled:opacity-40"
        >
          <PixelIcon name="chevron-left" size={10} />
          <span>Trước</span>
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181924] hover:bg-[#252837] text-zinc-200 font-bold text-xs border border-[#252837]"
        >
          <PixelIcon name="eraser" size={12} className="text-red-400" />
          <span>Xóa bảng</span>
        </button>

        <button
          onClick={() => speakJapanese(currentWord.kana || currentWord.word)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs"
        >
          <PixelIcon name="volume" size={12} />
          <span>Phát âm</span>
        </button>

        <button
          onClick={() => {
            if (currentIndex + 1 < words.length) setCurrentIndex(currentIndex + 1);
          }}
          disabled={currentIndex + 1 >= words.length}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#181924] hover:bg-[#252837] text-white font-bold text-xs border border-[#252837] disabled:opacity-40"
        >
          <span>Sau</span>
          <PixelIcon name="chevron-right" size={10} />
        </button>
      </div>
    </div>
  );
};
