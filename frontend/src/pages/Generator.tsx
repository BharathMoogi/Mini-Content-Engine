import React, { useState } from 'react';
import { useGenerateJob, useJobDetails } from '../hooks/useJobs';
import { GeneratedContent } from '../types';
import {
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Wand2,
} from 'lucide-react';

export const Generator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateMutation = useGenerateJob();
  const { data: jobDetails } = useJobDetails(activeJobId);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

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
      },
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Parse generated JSON copy if available
  let parsedContent: GeneratedContent | null = null;
  if (jobDetails?.generated_prompt) {
    try {
      parsedContent = JSON.parse(jobDetails.generated_prompt);
    } catch {
      parsedContent = null;
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copy & Visual Banner Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-3">
            Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Generator</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Upload your product details and image. Our async AI pipeline synthesizes headline copy, primary text, trending hashtags, and custom 1200x630 ad banner graphics automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Wand2 className="w-5 h-5 text-brand-500" />
              <span>Product Specifications</span>
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Name <span className="text-brand-400">*</span>
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Aura Wireless Noise-Canceling Headphones"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Description <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe key features, target audience, benefits, or promotional offer..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
              />
            </div>

            {/* Image Upload Dropzone */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Image <span className="text-slate-500">(Optional PNG/JPG/WebP)</span>
              </label>

              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-md border border-slate-800" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">{selectedFile?.name}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all group">
                  <div className="p-3 rounded-full bg-slate-800 group-hover:bg-brand-500/10 text-slate-400 group-hover:text-brand-400 transition-colors mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Click to upload product image</span>
                  <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generateMutation.isPending || !productName.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Async Job...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Content & Banner</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Output & Status Column */}
        <div className="lg:col-span-7 space-y-6">
          {!activeJobId ? (
            <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="p-4 rounded-full bg-slate-800/80 text-brand-400 mb-4 shadow-inner">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Generation Job</h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Fill out the product specifications on the left and click <strong>Generate Content & Banner</strong> to trigger live AI copy synthesis and visual ad generation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Status Banner */}
              <div className="glass-panel p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Job #{jobDetails?.id || activeJobId}</span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center space-x-2">
                      {jobDetails?.status === 'Pending' && (
                        <>
                          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Queued (Pending)</span>
                        </>
                      )}
                      {jobDetails?.status === 'Processing' && (
                        <>
                          <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
                          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Synthesizing AI Content...</span>
                        </>
                      )}
                      {jobDetails?.status === 'Completed' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Generation Completed</span>
                        </>
                      )}
                      {jobDetails?.status === 'Failed' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Generation Failed</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500">Auto-polling live updates</span>
                </div>
              </div>

              {/* Generated Content Output */}
              {jobDetails?.status === 'Completed' && parsedContent && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Generated Copy Card */}
                  <div className="glass-panel p-6 rounded-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-brand-400" />
                        <span>AI Marketing Copy</span>
                      </h2>
                    </div>

                    {/* Headline */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Main Headline</span>
                        <button
                          onClick={() => copyToClipboard(parsedContent!.headline, 'headline')}
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                        >
                          {copiedField === 'headline' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'headline' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-lg font-bold text-white leading-snug">{parsedContent.headline}</p>
                    </div>

                    {/* Tagline */}
                    {parsedContent.tagline && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tagline</span>
                        <p className="text-sm italic text-indigo-300 font-medium">"{parsedContent.tagline}"</p>
                      </div>
                    )}

                    {/* Body Copy */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Ad Copy</span>
                        <button
                          onClick={() => copyToClipboard(parsedContent!.body_copy, 'body')}
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                        >
                          {copiedField === 'body' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'body' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                        {parsedContent.body_copy}
                      </p>
                    </div>

                    {/* Call to Action */}
                    {parsedContent.call_to_action && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Recommended Call-To-Action</span>
                        <span className="inline-block px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-600/30">
                          {parsedContent.call_to_action}
                        </span>
                      </div>
                    )}

                    {/* Hashtags */}
                    {parsedContent.hashtags && parsedContent.hashtags.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Trending Hashtags</span>
                        <div className="flex flex-wrap gap-2">
                          {parsedContent.hashtags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-brand-400 text-xs font-mono flex items-center space-x-1"
                            >
                              <Tag className="w-3 h-3 text-slate-500" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generated Visual Banner Card */}
                  {jobDetails.generated_image_url && (
                    <div className="glass-panel p-6 rounded-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span>Generated 1200x630 Banner Visual</span>
                        </h2>
                        <a
                          href={`http://localhost:8000${jobDetails.generated_image_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1 font-medium"
                        >
                          <span>Open High-Res</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative group">
                        <img
                          src={`http://localhost:8000${jobDetails.generated_image_url}`}
                          alt="Generated Ad Banner"
                          className="w-full h-auto object-cover rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
