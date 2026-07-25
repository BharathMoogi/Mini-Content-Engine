import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, title, onClose }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.6));
  const handleResetZoom = () => setZoom(1);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ai_lifestyle_${title.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
      {/* Lightbox Top Control Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-bold uppercase text-indigo-400">Full-Screen Lightbox Zoom</span>
          <span className="text-slate-700">•</span>
          <span className="text-sm font-bold text-white truncate max-w-xs">{title}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center space-x-1.5 text-xs"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Zoom Container */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 my-2">
        <img
          src={imageUrl}
          alt={title}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl border border-slate-800 shadow-2xl origin-center"
        />
      </div>

      {/* Lightbox Footer Note */}
      <div className="flex justify-between items-center text-xs text-slate-500 z-10 border-t border-slate-800/80 pt-3">
        <span>Use zoom controls or scroll to inspect texture & detail</span>
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
        >
          <span>Open Direct Image URL</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
