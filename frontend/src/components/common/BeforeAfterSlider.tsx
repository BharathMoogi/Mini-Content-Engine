import React, { useState, useRef, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  onImageClick?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original Product',
  afterLabel = 'AI Lifestyle Visual',
  onImageClick,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      className="relative w-full h-[380px] sm:h-[480px] rounded-2xl overflow-hidden select-none border border-indigo-500/30 bg-slate-950 shadow-2xl group cursor-ew-resize"
    >
      {/* After Image (Background - Full Width) */}
      <img
        src={afterImage}
        alt="After AI Generation"
        onClick={onImageClick}
        className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
      />

      {/* Before Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before Original"
          onClick={onImageClick}
          className="absolute inset-0 w-full h-full object-cover cursor-zoom-in max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
        />
      </div>

      {/* Top Labels */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-slate-200 uppercase tracking-wider shadow-md pointer-events-none">
        {beforeLabel}
      </div>

      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-indigo-950/90 backdrop-blur-md border border-indigo-500/40 text-[10px] font-bold text-indigo-300 uppercase tracking-wider shadow-md pointer-events-none">
        {afterLabel}
      </div>

      {/* Drag Slider Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-indigo-600 text-white border-2 border-white shadow-xl flex items-center justify-center pointer-events-none">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
