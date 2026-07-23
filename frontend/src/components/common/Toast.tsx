import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-xl flex items-start justify-between space-x-3 transition-all duration-300 transform translate-y-0 animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-slate-900/90 border-red-500/30 text-red-300'
              : 'bg-slate-900/90 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-start space-x-3 overflow-hidden">
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              {toast.message && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate">{toast.message}</p>}
            </div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-slate-300 shrink-0 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
