import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Share2, ZoomIn, ZoomOut, RotateCw,
  ExternalLink, FileText, Info
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { formatBytes, formatFullDateTime, getFileCategory } from '../../utils/formatters';

export const FilePreviewModal: React.FC = () => {
  const { previewFile, setPreviewFile, downloadFile, setShareTarget, setInspectedItem } = useFiles();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!previewFile) return null;

  const category = getFileCategory(previewFile.mimeType, previewFile.extension);

  const handleClose = () => {
    setPreviewFile(null);
    setZoom(1);
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-5xl h-[88vh] bg-slate-900 text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 border border-slate-800"
        >
          {/* Top Bar */}
          <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 truncate">
              <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="truncate">
                <h3 className="text-sm font-semibold text-slate-100 truncate">{previewFile.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {formatBytes(previewFile.size)} • Modified {formatFullDateTime(previewFile.updatedAt)}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {category === 'image' && (
                <div className="flex items-center bg-slate-800 rounded-xl p-1 mr-2 border border-slate-700">
                  <button
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 ml-1"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setShareTarget({ id: previewFile.id, name: previewFile.name, type: 'file' })}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => downloadFile(previewFile.id)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => { handleClose(); setInspectedItem(previewFile); }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="Details"
              >
                <Info className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-slate-800 mx-1" />

              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Media Content Stage */}
          <div className="flex-1 bg-slate-950/70 overflow-auto flex items-center justify-center p-6 select-none relative">
            {category === 'image' && previewFile.previewUrl && (
              <div className="overflow-hidden flex items-center justify-center max-w-full max-h-full">
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.name}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease'
                  }}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}

            {category === 'video' && (
              <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={previewFile.previewUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {category === 'pdf' && (
              <div className="w-full max-w-3xl h-full bg-white text-slate-900 rounded-2xl p-8 shadow-2xl flex flex-col justify-between overflow-y-auto">
                <div className="border-b border-slate-200 pb-4 mb-6">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Document Preview</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{previewFile.name}</h2>
                </div>
                <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
                  <p className="font-semibold text-slate-800">1. Executive Overview</p>
                  <p>
                    Skyhaven delivers enterprise-grade zero-knowledge cloud storage with automated global edge distribution powered by Cloudflare R2 and multi-region replication.
                  </p>
                  <p className="font-semibold text-slate-800 mt-4">2. Cryptographic Security Standards</p>
                  <p>
                    All objects are chunked and encrypted client-side using AES-GCM-256 before streaming. Temporary access tokens employ short-lived asymmetric HMAC signatures with automated rotation.
                  </p>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl my-4 text-xs font-mono text-slate-700">
                    SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Page 1 of 8</span>
                  <button onClick={() => downloadFile(previewFile.id)} className="text-blue-600 font-semibold hover:underline">
                    Download full PDF
                  </button>
                </div>
              </div>
            )}

            {category !== 'image' && category !== 'video' && category !== 'pdf' && (
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center text-blue-400 mx-auto mb-4 border border-slate-700">
                  <FileText className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{previewFile.name}</h4>
                <p className="text-xs text-slate-400 mb-6">
                  Preview not rendered in browser for this format ({previewFile.extension.toUpperCase()}). You can safely download or share the raw object.
                </p>
                <button
                  onClick={() => downloadFile(previewFile.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download file ({formatBytes(previewFile.size)})</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
