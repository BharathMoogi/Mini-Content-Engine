import React, { useState, useEffect } from 'react';
import { useGenerateJob, useJobDetails, useJobsList } from '../hooks/useJobs';
import { Job, JobStatus } from '../types';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { BeforeAfterSlider } from '../components/common/BeforeAfterSlider';
import { ImageLightbox } from '../components/common/ImageLightbox';
import { LiveTimeline } from '../components/common/LiveTimeline';
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
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sliders,
  Cpu,
  Wand2,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const getImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const relPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${relPath}`;
};

const SAMPLE_PRESETS = [
  {
    name: 'Lumina RGB Mechanical Keyboard',
    description: 'Wireless mechanical keyboard with custom PBT keycaps, per-key RGB lighting, and brushed aluminum chassis in luxury studio setting.',
    category: 'Gaming Tech',
  },
  {
    name: 'Aura Organic Hydrating Serum',
    description: 'Botanical hyaluronic acid facial serum with vitamin C and Rosehip oil in amber glass dropper bottle surrounded by fresh organic botanicals.',
    category: 'Beauty & Skincare',
  },
  {
    name: 'Nordic Artisanal Ceramic Mug',
    description: 'Handcrafted stoneware coffee mug with matte speckled glaze on warm wooden table with soft volumetric morning sunlight reflections.',
    category: 'Lifestyle & Home',
  },
  {
    name: 'Zenith ANC Wireless Headphones',
    description: 'Over-ear active noise cancelling headphones with memory foam earcups and copper accents on sleek minimalist mahogany desk setup.',
    category: 'Audio Gear',
  },
];

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

  // Lightbox Zoom State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Collapsible Prompt Panel State
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

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
        addToast('success', 'Image Generation Completed!', `Job #${activeJob.id} visual is ready.`);
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

  // Apply Preset Handler
  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setProductName(preset.name);
    setProductDescription(preset.description);
    addToast('info', 'Preset Template Loaded', `Pre-filled metadata for ${preset.name}`);
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

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('success', 'Image Download Triggered');
  };

  const downloadPromptText = (prompt: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([prompt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast('success', 'Prompt Text Downloaded');
  };

  // Status Badge Component
  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Processing...</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
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
    <div className="space-y-5 w-full max-w-full flex-1 flex flex-col">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TOP DASHBOARD COCKPIT: HERO & UPLOAD FORM SIDE-BY-SIDE             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
        {/* HERO BANNER CARD (Increased height & padding) */}
        <div className="lg:col-span-4 min-h-[360px] relative rounded-2xl p-6 sm:p-7 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Mini Content Engine SaaS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Automated AI Product <br />
              <span className="gradient-text">Lifestyle Content Engine</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Transform product metadata & uploaded images into studio-grade lifestyle visuals using Gemini AI Vision and FLUX / ComfyUI pipelines.
            </p>
          </div>

          {/* Metric Badges Horizontal Row */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Total</span>
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

        {/* UPLOAD FORM CARD (Increased height & inputs) */}
        <div className="lg:col-span-8 min-h-[360px] glass-card p-6 sm:p-7 rounded-2xl relative overflow-hidden shadow-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Upload Product Asset</h2>
                <p className="text-xs text-slate-400">Input product metadata and optional image asset</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">STEP 1 OF 3</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Inputs */}
              <div className="space-y-4">
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

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
                    placeholder="Provide key features, target audience, color accents, or style preferences..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Right Image Dropzone (Increased height to 190px) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Product Image Asset <span className="text-slate-500 font-normal">(PNG/JPG/WebP)</span>
                </label>

                {previewUrl ? (
                  <div className="relative h-[190px] rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 p-4 flex items-center justify-between shadow-inner">
                    <div className="flex items-center space-x-4">
                      <img
                        src={previewUrl}
                        alt="Uploaded Preview"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-800 shadow-md"
                      />
                      <div className="truncate space-y-1">
                        <p className="text-sm font-bold text-slate-100 truncate max-w-[220px]">{selectedFile?.name}</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs font-mono">
                          {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <p className="text-xs text-emerald-400 font-medium">Ready for AI Vision Analysis</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-red-500/20"
                    >
                      <X className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-[190px] border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 cursor-pointer transition-all duration-200 group p-4">
                    <div className="p-3 rounded-2xl bg-slate-900 group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-400 transition-colors mb-2 border border-slate-800">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">Click or Drag & Drop Product Image</span>
                    <span className="text-xs text-slate-500 mt-1">High resolution PNG, JPG, or WebP up to 10MB</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generateMutation.isPending || !productName.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-sm transition-all duration-300 shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed group mt-3"
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
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ACTIVE JOB PIPELINE STATUS CARD & LIVE WORKFLOW DISPLAY            */}
      {/* ------------------------------------------------------------------ */}
      {activeJobId && activeJob && (
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-slate-900/90 space-y-6 shadow-2xl relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold font-mono text-slate-400 uppercase">Active Job #{activeJob.id}</span>
              <span className="text-slate-700">•</span>
              <span className="text-xs font-bold text-white">{activeJob.product_name}</span>
            </div>
            <div>{getStatusBadge(activeJob.status)}</div>
          </div>

          {/* 1. LIVE WORKFLOW ANIMATED TIMELINE */}
          <LiveTimeline job={activeJob} />

          {/* SUCCESS BANNER ANIMATION */}
          {activeJob.status === 'Completed' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-400 animate-fadeIn shadow-lg">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-extrabold tracking-wide">✓ Image Successfully Generated</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Duration: {activeJob.duration_seconds || 5.2}s
              </span>
            </div>
          )}

          {/* BEFORE / AFTER COMPARISON SLIDER & PRIMARY OUTPUT */}
          {activeJob.status === 'Completed' && activeJob.generated_image_url && (
            <div className="space-y-6 pt-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Content Engine Visual Output</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Click image to open full-screen zoom
                </span>
              </div>

              {/* Slider vs Image View */}
              {activeJob.uploaded_image_path ? (
                <div className="space-y-2">
                  <BeforeAfterSlider
                    beforeImage={getImageUrl(activeJob.uploaded_image_path)}
                    afterImage={getImageUrl(activeJob.generated_image_url)}
                    beforeLabel="1. Original Uploaded Product"
                    afterLabel="2. AI Generated Lifestyle Visual (Primary Output)"
                    onImageClick={() =>
                      setLightboxImage({
                        url: getImageUrl(activeJob.generated_image_url),
                        title: activeJob.product_name,
                      })
                    }
                  />
                  <p className="text-[11px] text-center text-slate-500 flex items-center justify-center space-x-1">
                    <Sliders className="w-3 h-3 text-indigo-400" />
                    <span>Drag slider left/right to compare original vs AI generated visual</span>
                  </p>
                </div>
              ) : (
                <div
                  onClick={() =>
                    setLightboxImage({
                      url: getImageUrl(activeJob.generated_image_url),
                      title: activeJob.product_name,
                    })
                  }
                  className="rounded-2xl overflow-hidden border border-indigo-500/40 bg-slate-950 p-2 shadow-2xl cursor-zoom-in relative group"
                >
                  <img
                    src={getImageUrl(activeJob.generated_image_url)}
                    alt="Generated Result"
                    className="w-full max-h-[500px] object-contain rounded-xl group-hover:scale-[1.01] transition-transform duration-300"
                  />
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Click to Zoom</span>
                  </div>
                </div>
              )}

              {/* IMAGE ACTION TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadImage(getImageUrl(activeJob.generated_image_url), `ai_lifestyle_${activeJob.id}.jpg`)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Image</span>
                  </button>
                  <a
                    href={getImageUrl(activeJob.generated_image_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open High-Res</span>
                  </a>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(getImageUrl(activeJob.generated_image_url), 'active-image-url')}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedId === 'active-image-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'active-image-url' ? 'URL Copied' : 'Copy Image URL'}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(window.location.href, 'active-share')}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* IMAGE METADATA PANEL */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">AI Model</span>
                  <span className="text-slate-200 font-bold flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-indigo-400" />
                    <span>Gemini 1.5 Flash</span>
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Image Generator</span>
                  <span className="text-indigo-400 font-bold">FLUX / ComfyUI</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Resolution</span>
                  <span className="text-slate-200 font-mono font-semibold">1024 x 1024</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Generation Time</span>
                  <span className="text-emerald-400 font-bold">{activeJob.duration_seconds || 5.2}s</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Job ID</span>
                  <span className="text-slate-300 font-mono">#{activeJob.id}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Status</span>
                  <span className="text-emerald-400 font-bold">Completed</span>
                </div>
              </div>

              {/* COLLAPSIBLE PROMPT PANEL */}
              {activeJob.generated_prompt && (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-900/60"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>▼ View Generated FLUX / SD Prompt Payload</span>
                    </div>
                    {isPromptExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isPromptExpanded && (
                    <div className="p-4 space-y-3 border-t border-slate-800/80 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Prompt Metadata Payload
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(activeJob.generated_prompt!, 'expanded-prompt')}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                          >
                            {copiedId === 'expanded-prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === 'expanded-prompt' ? 'Copied' : 'Copy Prompt'}</span>
                          </button>
                          <button
                            onClick={() => downloadPromptText(activeJob.generated_prompt!, `prompt_job_${activeJob.id}.txt`)}
                            className="text-xs text-slate-300 hover:text-white font-semibold flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Prompt</span>
                          </button>
                        </div>
                      </div>

                      <pre className="text-xs font-mono bg-slate-900 p-4 rounded-xl text-indigo-300 border border-slate-800/80 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {activeJob.generated_prompt}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* JOB DASHBOARD HISTORY CARDS & PRESET TEMPLATE GALLERY              */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-5 w-full flex-1 flex flex-col justify-between">
        {/* Section Header with Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Job Dashboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Browse previous jobs or load 1-click sample product templates</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all w-44 sm:w-56"
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

        {/* Jobs Responsive Grid / Preset Gallery */}
        {isJobsLoading ? (
          <div className="glass-panel p-10 rounded-3xl text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading job history...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          /* RICH 1-CLICK PRESET TEMPLATE GALLERY (Height increased to min-h-[260px]) */
          <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-6 flex-1 flex flex-col justify-center min-h-[260px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">1-Click Sample Product Presets</h3>
                  <p className="text-xs text-slate-400">Select a template to pre-fill metadata and launch Gemini & ComfyUI content generation instantly</p>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 w-max font-semibold">
                Click any card to auto-fill
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 cursor-pointer space-y-4 flex flex-col justify-between group transition-all min-h-[200px]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20 uppercase">
                        {preset.category}
                      </span>
                      <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer relative group ${
                  activeJobId === job.id ? 'ring-2 ring-indigo-500/60 border-indigo-500/40' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{job.id}</span>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Generated Lifestyle Image Thumbnail */}
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center relative shadow-inner">
                    {job.generated_image_url ? (
                      <img
                        src={getImageUrl(job.generated_image_url)}
                        alt={job.product_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : job.uploaded_image_path ? (
                      <img
                        src={getImageUrl(job.uploaded_image_path)}
                        alt={job.product_name}
                        loading="lazy"
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

                {/* Footer Duration & View Details Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                    <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {job.duration_seconds && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{job.duration_seconds}s</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-indigo-400 group-hover:translate-x-1 transition-transform font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 text-[11px]">
                    <span>View</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ENHANCED DETAILS MODAL                                             */}
      {/* ------------------------------------------------------------------ */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col border border-slate-700 shadow-2xl animate-fadeIn">
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

              {/* Timeline Component inside Modal */}
              <LiveTimeline job={selectedJob} />

              {/* Uploaded vs Generated Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedJob.uploaded_image_path && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Original Uploaded Product</span>
                    <img
                      src={getImageUrl(selectedJob.uploaded_image_path)}
                      alt="Source"
                      onClick={() =>
                        setLightboxImage({
                          url: getImageUrl(selectedJob.uploaded_image_path),
                          title: `${selectedJob.product_name} (Original)`,
                        })
                      }
                      className="w-full h-48 object-cover rounded-xl border border-slate-800 cursor-zoom-in"
                    />
                  </div>
                )}

                {selectedJob.generated_image_url && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">AI Generated Lifestyle Image</span>
                      <button
                        onClick={() => downloadImage(getImageUrl(selectedJob.generated_image_url), `job_${selectedJob.id}.jpg`)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                    <img
                      src={getImageUrl(selectedJob.generated_image_url)}
                      alt="Generated Result"
                      onClick={() =>
                        setLightboxImage({
                          url: getImageUrl(selectedJob.generated_image_url),
                          title: selectedJob.product_name,
                        })
                      }
                      className="w-full h-48 object-cover rounded-xl border border-indigo-500/40 cursor-zoom-in"
                    />
                  </div>
                )}
              </div>

              {/* ComfyUI Workflow Metadata Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Sampler</span>
                  <span className="text-indigo-400 font-bold">{selectedJob.sampler || 'DPM++ 2M Karras'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Steps / CFG</span>
                  <span className="text-slate-200 font-mono font-semibold">{selectedJob.steps || 25} steps • CFG {selectedJob.cfg || 7.0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Denoise</span>
                  <span className="text-slate-200 font-mono font-semibold">{selectedJob.denoise || 0.65}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Seed</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedJob.seed || 42}</span>
                </div>
              </div>

              {/* Download Workflow JSON Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const workflowObj = {
                      workflow_id: selectedJob.workflow_id || `comfy_wf_${selectedJob.id}`,
                      sampler: selectedJob.sampler || 'dpmpp_2m_karras',
                      steps: selectedJob.steps || 25,
                      cfg: selectedJob.cfg || 7.0,
                      denoise: selectedJob.denoise || 0.65,
                      seed: selectedJob.seed || 42,
                      nodes: [
                        { title: 'Load Checkpoint', model: 'v1-5-pruned-emaonly.safetensors' },
                        { title: 'Load Image', filename: selectedJob.uploaded_image_path || 'reference_product.png' },
                        { title: 'CLIP Text Encode (Positive)', prompt: selectedJob.generated_prompt },
                        { title: 'CLIP Text Encode (Negative)', prompt: 'blurry, low quality, distorted' },
                        { title: 'KSampler (Img2Img)', sampler: selectedJob.sampler || 'dpmpp_2m_karras', steps: selectedJob.steps || 25, cfg: selectedJob.cfg || 7.0, denoise: selectedJob.denoise || 0.65 },
                        { title: 'Image Upscaler (2x)', scale: 2.0 },
                        { title: 'Save Image', output: selectedJob.generated_image_url }
                      ]
                    };
                    const element = document.createElement('a');
                    const file = new Blob([JSON.stringify(workflowObj, null, 2)], { type: 'application/json' });
                    element.href = URL.createObjectURL(file);
                    element.download = `comfyui_workflow_job_${selectedJob.id}.json`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    addToast('success', 'ComfyUI Workflow JSON Downloaded');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Workflow JSON</span>
                </button>
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
