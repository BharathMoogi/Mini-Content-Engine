import React from 'react';
import { CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Job } from '../../types';

interface LiveTimelineProps {
  job: Job;
}

export const LiveTimeline: React.FC<LiveTimelineProps> = ({ job }) => {
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--:--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const steps = [
    {
      id: 'upload',
      name: 'Uploading Product Asset',
      status: 'complete',
      timestamp: formatTime(job.created_at),
      detail: 'Product metadata & image uploaded successfully',
    },
    {
      id: 'gemini',
      name: 'Gemini Vision & Prompt Analysis',
      status: job.status === 'Pending' ? 'pending' : job.status === 'Processing' ? (job.generated_prompt ? 'complete' : 'active') : 'complete',
      timestamp: formatTime(job.processing_started_at || job.created_at),
      detail: 'Multimodal AI prompt synthesis',
    },
    {
      id: 'flux',
      name: 'FLUX AI Lifestyle Generation',
      status: job.status === 'Completed' ? 'complete' : job.status === 'Failed' ? 'failed' : job.generated_prompt ? 'active' : 'pending',
      timestamp: formatTime(job.completed_at || (job.status === 'Processing' ? job.updated_at : null)),
      detail: 'High-res photorealistic lifestyle synthesis',
    },
    {
      id: 'completed',
      name: 'Job Finalized & Output Ready',
      status: job.status === 'Completed' ? 'complete' : job.status === 'Failed' ? 'failed' : 'pending',
      timestamp: formatTime(job.completed_at),
      detail: job.duration_seconds ? `Total execution time: ${job.duration_seconds}s` : 'Pipeline finalizing',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Live Workflow Timeline</span>
        </h4>
        {job.duration_seconds && (
          <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Duration: {job.duration_seconds}s
          </span>
        )}
      </div>

      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start space-x-3.5 relative z-10">
            <div className="mt-0.5">
              {step.status === 'complete' && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {step.status === 'active' && (
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/60 text-indigo-400 flex items-center justify-center animate-pulse shadow-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              {step.status === 'pending' && (
                <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              )}
              {step.status === 'failed' && (
                <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">{step.name}</span>
                <span className="text-[11px] text-slate-500 block">{step.detail}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                {step.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
