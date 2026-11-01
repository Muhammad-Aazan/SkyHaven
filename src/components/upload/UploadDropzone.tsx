import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload } from 'lucide-react';
import { useFiles } from '../../context/FileContext';

export const UploadDropzone: React.FC = () => {
  const { queueFilesForUpload } = useFiles();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        queueFilesForUpload(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [queueFilesForUpload]);

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8 bg-blue-600/10 backdrop-blur-md"
        >
          <div className="w-full max-w-2xl h-96 rounded-3xl border-3 border-dashed border-blue-600 bg-white/90 shadow-2xl flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 animate-bounce">
              <CloudUpload className="w-10 h-10 stroke-[2.2]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Drop files to upload instantly
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              Files will be encrypted and streamed directly to Cloudflare R2 storage in your current folder.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
