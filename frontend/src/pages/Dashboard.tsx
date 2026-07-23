import React, { useState, useEffect } from 'react';
import { useGenerateJob, useJobDetails, useJobsList } from '../hooks/useJobs';
import { Job, JobStatus } from '../types';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import {
  Upload,
  X,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Eye,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  // Form State
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Active Job & Inspection Drawer State
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All');

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = { id: Date.now().toString(), type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // API Hooks
  const generateMutation = useGenerateJob();
  const { data: activeJob } = useJobDetails(activeJobId);
  const { data: jobsData, isLoading: isJobsLoading, refetch: refetchJobs, isRefetching } = useJobsList();

  // Watch Active Job completion to trigger success toast
  useEffect(() => {
    if (activeJob) {
      if (activeJob.status === 'Completed' && activeJob.generated_image_url) {
        addToast('success', 'Image Generation Completed!', `Job #${activeJob.id} is ready for download.`);
      } else if (activeJob.status === 'Failed') {
        addToast('error', 'Job Processing Failed', activeJob.generated_prompt || 'Error generating image');
      }
    }
  }, [activeJob?.status]);

  // Image Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      addToast('info', 'Product Image Attached', file.name);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const formData = new FormData();
    formData.append('product_name', productName.trim());
    if (productDescription.trim()) {
      formData.append('product_description', productDescription.trim());
    }
    if (selectedFile) {
      formData.append('product_image', selectedFile);
    }

    generateMutation.mutate(formData, {
      onSuccess: (response) => {
        setActiveJobId(response.job_id);
        addToast('info', 'Job Created Successfully', `Job #${response.job_id} queued. Polling every 5 seconds...`);
        setProductName('');
        setProductDescription('');
        handleRemoveFile();
        refetchJobs();
      },
      onError: (err: any) => {
        addToast('error', 'Submission Failed', err.message || 'Could not connect to backend API.');
      },
    });
  };

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    addToast('success', 'Copied to Clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Badge Component
  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Processing...</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
    }
  };

  // Filter Jobs list
  const filteredJobs = (jobsData?.items || []).filter((job) => {
    const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
    const matchesSearch =
      job.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.product_description && job.product_description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate Stat Counts
  const totalJobsCount = jobsData?.total || 0;
  const completedJobsCount = jobsData?.items.filter((j) => j.status === 'Completed').length || 0;
  const processingJobsCount = jobsData?.items.filter((j) => j.status === 'Processing' || j.status === 'Pending').length || 0;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* ------------------------------------------------------------------ */}
      {/* SAAS HERO HEADER & METRICS COUNTER                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>AI Diffusion Content Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Transform Products into <br />
              <span className="gradient-text">Visual Studio Banners</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Upload product details to trigger Gemini AI prompt engineering and automated image generation pipelines in real time.
            </p>
          </div>

          {/* Metric Badges */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total Jobs</span>
              <span className="text-2xl font-black text-white">{totalJobsCount}</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Completed</span>
              <span className="text-2xl font-black text-emerald-400">{completedJobsCount}</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Active</span>
              <span className="text-2xl font-black text-indigo-400">{processingJobsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. UPLOAD PRODUCT FORM CARD                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="glass-card p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800/80">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upload Product</h2>
              <p className="text-xs text-slate-400">Input product metadata and optional image asset</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">STEP 1 OF 3</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Inputs */}
            <div className="space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Product Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Lumina Wireless RGB Mechanical Keyboard"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Product Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Product Description <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">{productDescription.length}/500</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Provide key product features, target audience, color accents, or style preferences..."
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Image Dropzone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Product Image Asset <span className="text-slate-500 font-normal">(PNG/JPG/WebP)</span>
              </label>

              {previewUrl ? (
                <div className="relative h-[210px] rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 p-4 flex flex-col justify-between group shadow-inner">
                  <div className="flex items-center space-x-4">
                    <img
                      src={previewUrl}
                      alt="Uploaded Preview"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-800 shadow-md"
                    />
                    <div className="truncate space-y-1">
                      <p className="text-xs font-bold text-slate-100 truncate">{selectedFile?.name}</p>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-mono">
                        {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <p className="text-[11px] text-emerald-400 font-medium">Ready for AI Vision Analysis</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="self-end px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-red-500/20"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove File</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-[210px] border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 cursor-pointer transition-all duration-200 group">
                  <div className="p-3.5 rounded-2xl bg-slate-900 group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-400 transition-colors mb-3 border border-slate-800">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">Click or Drag & Drop Product Image</span>
                  <span className="text-[11px] text-slate-500 mt-1">High resolution PNG, JPG, or WebP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={generateMutation.isPending || !productName.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-sm transition-all duration-300 shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Creating Job Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
                <span>Generate Content & Banner</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ACTIVE JOB PIPELINE STATUS CARD (REAL-TIME POLLING)               */}
      {/* ------------------------------------------------------------------ */}
      {activeJobId && activeJob && (
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-slate-900/90 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold font-mono text-slate-400 uppercase">Active Job #{activeJob.id}</span>
              <span className="text-slate-700">•</span>
              <span className="text-xs font-bold text-white">{activeJob.product_name}</span>
            </div>
            <div>{getStatusBadge(activeJob.status)}</div>
          </div>

          {/* Step Progress Tracker */}
          <div className="grid grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase block">Step 1</span>
              <span className="text-xs font-bold text-slate-200 block">Upload Accepted</span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Complete</span>
              </span>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-xl bg-slate-950 border space-y-1 ${
              activeJob.status === 'Processing' ? 'border-indigo-500/60 ring-1 ring-indigo-500/30' : 'border-slate-800'
            }`}>
              <span className="text-[10px] font-bold text-indigo-400 uppercase block">Step 2</span>
              <span className="text-xs font-bold text-slate-200 block">Gemini AI Prompting</span>
              {activeJob.status === 'Pending' && <span className="text-[11px] text-slate-500">Waiting...</span>}
              {activeJob.status === 'Processing' && (
                <span className="text-[11px] text-indigo-400 font-medium flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Synthesizing</span>
                </span>
              )}
              {(activeJob.status === 'Completed' || activeJob.status === 'Failed') && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Done</span>
                </span>
              )}
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-xl bg-slate-950 border space-y-1 ${
              activeJob.status === 'Completed' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'
            }`}>
              <span className="text-[10px] font-bold text-indigo-400 uppercase block">Step 3</span>
              <span className="text-xs font-bold text-slate-200 block">Image Generation</span>
              {activeJob.status === 'Completed' ? (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready</span>
                </span>
              ) : activeJob.status === 'Failed' ? (
                <span className="text-[11px] text-red-400 font-medium">Failed</span>
              ) : (
                <span className="text-[11px] text-slate-500">Processing</span>
              )}
            </div>
          </div>

          {/* Polling Banner */}
          {(activeJob.status === 'Pending' || activeJob.status === 'Processing') && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-200">
                Polling GET /jobs/{activeJob.id} every 5 seconds...
              </p>
              <p className="text-[11px] text-slate-400">
                Status will automatically update when generation completes.
              </p>
            </div>
          )}

          {/* DISPLAY GENERATED IMAGE RESULT */}
          {activeJob.status === 'Completed' && activeJob.generated_image_url && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Generated Visual Result</span>
                </h3>
                <div className="flex items-center space-x-3">
                  {activeJob.generated_prompt && (
                    <button
                      onClick={() => copyToClipboard(activeJob.generated_prompt!, 'active-prompt')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      {copiedId === 'active-prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'active-prompt' ? 'Prompt Copied' : 'Copy FLUX Prompt'}</span>
                    </button>
                  )}
                  <a
                    href={`http://localhost:8000${activeJob.generated_image_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-300 hover:text-white font-semibold flex items-center space-x-1"
                  >
                    <span>Full High-Res</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                <img
                  src={`http://localhost:8000${activeJob.generated_image_url}`}
                  alt="Generated Result"
                  className="w-full max-h-[520px] object-contain rounded-xl"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. JOB HISTORY & DASHBOARD CARDS                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-6">
        {/* Section Header with Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Job History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Browse past generation jobs and inspect AI prompts</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all w-44 sm:w-56"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['All', 'Pending', 'Processing', 'Completed', 'Failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetchJobs()}
              disabled={isRefetching}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
              title="Refresh Jobs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Jobs Grid */}
        {isJobsLoading ? (
          <div className="glass-panel p-12 rounded-3xl text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading job history...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center text-slate-400">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No jobs found matching criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try submitting a new product above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer relative group ${
                  activeJobId === job.id ? 'ring-2 ring-indigo-500/60 border-indigo-500/40' : ''
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{job.id}</span>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Thumbnail Container */}
                  <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center relative shadow-inner">
                    {job.generated_image_url ? (
                      <img
                        src={`http://localhost:8000${job.generated_image_url}`}
                        alt={job.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : job.uploaded_image_path ? (
                      <img
                        src={`http://localhost:8000${job.uploaded_image_path}`}
                        alt={job.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Title & Details */}
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {job.product_name}
                    </h3>
                    {job.product_description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {job.product_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Time & Quick Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center space-x-1.5 text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span className="text-[11px] font-bold">Inspect</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* JOB INSPECTION MODAL DRAWER                                        */}
      {/* ------------------------------------------------------------------ */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col border border-slate-700 shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-bold text-white">Job #{selectedJob.id} Specifications</h3>
                  {getStatusBadge(selectedJob.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedJob.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product Info */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Product Name</span>
                <p className="text-base font-bold text-white">{selectedJob.product_name}</p>
                {selectedJob.product_description && (
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedJob.product_description}
                  </p>
                )}
              </div>

              {/* Uploaded vs Generated Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedJob.uploaded_image_path && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Uploaded Source</span>
                    <img
                      src={`http://localhost:8000${selectedJob.uploaded_image_path}`}
                      alt="Source"
                      className="w-full h-44 object-cover rounded-xl border border-slate-800"
                    />
                  </div>
                )}

                {selectedJob.generated_image_url && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">Generated Visual Result</span>
                    <img
                      src={`http://localhost:8000${selectedJob.generated_image_url}`}
                      alt="Generated Result"
                      className="w-full h-44 object-cover rounded-xl border border-indigo-500/40"
                    />
                  </div>
                )}
              </div>

              {/* Generated Prompt Viewer */}
              {selectedJob.generated_prompt && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generated Text-to-Image Prompt</span>
                    <button
                      onClick={() => copyToClipboard(selectedJob.generated_prompt!, 'modal-prompt')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      {copiedId === 'modal-prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'modal-prompt' ? 'Copied' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-950 p-4 rounded-2xl text-indigo-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
