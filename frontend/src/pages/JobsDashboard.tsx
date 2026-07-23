import React, { useState } from 'react';
import { useDeleteJob, useJobsList } from '../hooks/useJobs';
import { Job, JobStatus } from '../types';
import {
  ListFilter,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';


export const JobsDashboard: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data, isLoading, isRefetching, refetch } = useJobsList(selectedStatus);
  const deleteMutation = useDeleteJob();

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete Job #${id}?`)) {
      deleteMutation.mutate(id);
      if (selectedJob?.id === id) {
        setSelectedJob(null);
      }
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-3">
            Jobs <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Monitor, inspect, and manage all content generation tasks across your pipeline. Track status, preview generated ad copy, and review synthesized visual banners.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Refresh Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedStatus(undefined)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === undefined
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Jobs ({data?.total || 0})
          </button>
          {(['Pending', 'Processing', 'Completed', 'Failed'] as JobStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Jobs List Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500 mx-auto mb-2" />
            <p className="text-sm">Loading jobs database...</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ListFilter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No jobs found</p>
            <p className="text-xs text-slate-500 mt-1">Submit a new product in the Generator tab to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Job ID</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Banner Output</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {data.items.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 font-mono font-medium text-slate-400">#{job.id}</td>
                    <td className="py-4 px-4 font-semibold text-slate-100 max-w-xs truncate">
                      {job.product_name}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(job.status)}</td>
                    <td className="py-4 px-4">
                      {job.generated_image_url ? (
                        <a
                          href={`http://localhost:8000${job.generated_image_url}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-medium"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Banner</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-400 hover:text-white transition-colors"
                          title="View Job Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(job.id, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details Modal / Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col border border-slate-700 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-white">Job #{selectedJob.id} Details</h3>
                  {getStatusBadge(selectedJob.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedJob.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product Info */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Product Name</span>
                <p className="text-base font-semibold text-white">{selectedJob.product_name}</p>
                {selectedJob.product_description && (
                  <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {selectedJob.product_description}
                  </p>
                )}
              </div>

              {/* Uploaded Source Image */}
              {selectedJob.uploaded_image_path && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">Uploaded Source Image</span>
                  <img
                    src={`http://localhost:8000${selectedJob.uploaded_image_path}`}
                    alt="Source"
                    className="w-32 h-32 object-cover rounded-lg border border-slate-800"
                  />
                </div>
              )}

              {/* Synthesized Banner Image */}
              {selectedJob.generated_image_url && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Synthesized Banner Graphic</span>
                    <a
                      href={`http://localhost:8000${selectedJob.generated_image_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                    >
                      <span>Full Resolution</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <img
                    src={`http://localhost:8000${selectedJob.generated_image_url}`}
                    alt="Synthesized Banner"
                    className="w-full h-auto object-cover rounded-xl border border-slate-800"
                  />
                </div>
              )}

              {/* Generated Copy JSON */}
              {selectedJob.generated_prompt && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">Generated AI Output Payload</span>
                  <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl text-indigo-300 border border-slate-800 overflow-x-auto">
                    {selectedJob.generated_prompt}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
