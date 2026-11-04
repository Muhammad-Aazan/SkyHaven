import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, ArrowRight, Check, Sparkles,
  Shield, HardDrive, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onSkip
}) => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  // Avatar presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  ];

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser({
        name: name.trim() || user?.name || 'Explorer',
        avatar: avatar || user?.avatar,
        isOnboarded: true,
      });
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Top Progress bar */}
          <div className="h-1.5 w-full bg-slate-100 flex">
            <div
              className={`h-full bg-blue-600 transition-all duration-300 ${
                step === 1 ? 'w-1/2' : 'w-full'
              }`}
            />
          </div>

          {step === 1 ? (
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-3 border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Step 1 of 2: Profile Setup</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to SkyHeaven!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Let's personalize your workspace before diving in.
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group mb-3">
                  <div className="w-24 h-24 rounded-full ring-4 ring-blue-100 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 shadow-md">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-file"
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title="Upload custom picture"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Click camera or choose a preset:</span>

                {/* Avatar Presets */}
                <div className="flex items-center gap-2 mt-2">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(preset);
                        setAvatarPreview(preset);
                      }}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        avatarPreview === preset
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Form */}
              <form onSubmit={handleFinishProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Your Name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center">
              {/* Step 2: Storage & Workspace Ready */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Profile Ready, {user?.name || name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Your personal vault has been initialized with <strong>25 GB Free Cloud Storage</strong> on zero-knowledge encrypted infrastructure.
              </p>

              <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>25 GB High-Speed Storage Allocation</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>End-to-End Encrypted File Transfer</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Cloudflare Edge Direct-to-Object Streaming</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onComplete}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Storage Plans</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onSkip || onComplete}
                  className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Skip for now & go to Dashboard
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
