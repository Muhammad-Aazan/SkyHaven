import React from 'react';
import { Cloud, Home, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center px-6 text-center">
      {/* Animated cloud bg blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SkyHeaven</span>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <span
            className="text-[120px] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved. Let's get you back to your cloud storage.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
