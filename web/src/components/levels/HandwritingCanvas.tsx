import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Eraser, Volume2, ChevronRight, ChevronLeft } from 'lucide-react';
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
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#06B6D4'; // Cyan stroke

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <h2 className="text-xl font-extrabold text-white">✍️ Luyện Viết Kanji & Kana</h2>
      </div>

      {/* Target Word Info */}
      <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800 mb-6">
        <div className="text-xs text-slate-400 font-bold mb-1">MỤC TIÊU LUYỆN VIẾT ({currentIndex + 1} / {words.length}):</div>
        <div className="text-4xl font-black text-white font-jp mb-2">{currentWord.word}</div>
        <div className="text-sm font-bold text-cyan-400">{currentWord.meaning}</div>
        {currentWord.kana && currentWord.kana !== currentWord.word && (
          <div className="text-xs text-slate-400 mt-1">[{currentWord.kana}]</div>
        )}
      </div>

      {/* HTML5 Canvas Drawing Area */}
      <div className="relative inline-block bg-[#0B0F19] rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden mb-6">
        {/* Background Trace Hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-800/30 text-[180px] font-black font-jp">
          {currentWord.word}
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={360}
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
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          }}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4 inline" /> Từ trước
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
        >
          <Eraser className="w-4 h-4 text-rose-400" />
          <span>Xóa bảng</span>
        </button>

        <button
          onClick={() => speakJapanese(currentWord.word)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-bold text-xs"
        >
          <Volume2 className="w-4 h-4" />
          <span>Phát âm</span>
        </button>

        <button
          onClick={() => {
            if (currentIndex + 1 < words.length) setCurrentIndex(currentIndex + 1);
          }}
          disabled={currentIndex + 1 >= words.length}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-40"
        >
          Từ sau <ChevronRight className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
};
