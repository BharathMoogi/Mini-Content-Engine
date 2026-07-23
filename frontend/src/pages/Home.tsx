import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Server, Database, Code, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const Home: React.FC = () => {
  const { data, isLoading, error, refetch, isRefetching } = useHealthCheck();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-3">
            Mini Content Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-indigo-400">Foundation</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-6">
            Production-ready boilerplate foundation with complete layer separation, type-safe API integration, PostgreSQL ORM, and modern React state management.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>{isRefetching ? 'Checking System...' : 'Ping System API'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Card */}
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-brand-500" />
            <span>Backend Integration Status</span>
          </h2>
          <span className="text-xs text-slate-500">Live via React Query & Axios</span>
        </div>

        {isLoading ? (
          <div className="flex items-center space-x-3 py-4 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
            <span className="text-sm">Connecting to backend health endpoint...</span>
          </div>
        ) : error ? (
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Backend connection offline or unreachable</p>
              <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
              <p className="text-xs text-slate-400 mt-2">Start backend server at http://localhost:8000 to enable live connection.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">API Service</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-sm text-slate-200">{data?.service}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">API Health Status</span>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-sm text-emerald-400 uppercase tracking-wide">{data?.status}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">Database Connectivity</span>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className={`font-medium text-sm ${data?.database === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data?.database}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tech Stack Components Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Configured Stack Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl">
            <Code className="w-6 h-6 text-brand-500 mb-3" />
            <h3 className="font-semibold text-white text-sm mb-1">FastAPI Backend</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              API routers, Pydantic data schemas, repositories, and services directory architecture.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl">
            <Database className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-white text-sm mb-1">SQLAlchemy ORM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configured PostgreSQL session dependency, engine creation, and model base classes.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl">
            <Server className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white text-sm mb-1">React + Vite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              TypeScript environment, Tailwind CSS styling, and structured folder layout.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl">
            <RefreshCw className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="font-semibold text-white text-sm mb-1">TanStack Query & Axios</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-configured HTTP client instance, error interceptors, and query provider context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
