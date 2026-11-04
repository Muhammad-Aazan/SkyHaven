import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Shield, Zap, HardDrive } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { storageApi } from '../../api/client';
import { StoragePlan } from '../../types';

interface StoragePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoragePlansModal: React.FC<StoragePlansModalProps> = ({ isOpen, onClose }) => {
  const { user, switchPlan } = useAuth();
  const [plans, setPlans] = useState<StoragePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    storageApi.getPlans().then(res => setPlans(res.data || []));
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async (planId: 'free' | 'pro' | 'business') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await switchPlan(planId);
      if (!res?.checkoutUrl) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change plan. Please try again.');
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
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-floating overflow-hidden z-10 max-h-[92vh] overflow-y-auto transition-colors duration-200"
        >
          {/* Header */}
          <div className="p-6 text-center relative border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-full mb-3 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SkyHeaven Storage Tiers</span>
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Upgrade Your Vault Storage
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Secure, lightning-fast multi-cloud storage with zero file size limits and instant transfers.
            </p>
          </div>

          {/* Feedback error alert */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl text-center">
              {errorMessage}
            </div>
          )}

          {/* Plans Grid */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => {
                const isCurrent = user?.planId === plan.id;
                const isPro = plan.id === 'pro';

                return (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                      isPro
                        ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/30 shadow-premium ring-2 ring-blue-600/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">${plan.priceMonthly}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold">/ month</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 text-center">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{plan.quotaLabel}</span>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-default"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.id as any)}
                          disabled={isLoading}
                          className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all shadow-xs ${
                            isPro
                              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]'
                              : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white'
                          }`}
                        >
                          {isLoading ? 'Processing...' : plan.id === 'free' ? 'Switch to Starter (25 GB)' : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Trust Note */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>AES-256 Multi-Vault Tier Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Cancel or switch tiers anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
