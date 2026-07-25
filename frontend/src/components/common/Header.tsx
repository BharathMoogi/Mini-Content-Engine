import React from 'react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { Cpu, Zap, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const { data: healthData, isLoading } = useHealthCheck();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/80 w-full max-w-full">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Mini Content Engine
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-wider">
                  Pro AI v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated Prompt Engineering & Visual Generation Platform
              </p>
            </div>
          </div>

          {/* Live System Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-inner text-xs">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium hidden sm:inline">API Status:</span>
              {isLoading ? (
                <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Probing</span>
                </span>
              ) : healthData?.status === 'healthy' ? (
                <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Standalone</span>
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini 1.5 Flash</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
