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
  const [selectedPlanId, setSelectedPlanId] = useState<string>(user?.planId || 'free');

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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-floating overflow-hidden z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 text-center relative border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skyhaven Storage Tiers</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Choose the perfect vault capacity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
              Encrypted, high-performance Cloudflare R2 storage with lightning-fast streaming and zero egress fees.
            </p>
            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl max-w-lg mx-auto">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map(plan => {
              const isCurrent = user?.planId === plan.id;
              const isPro = plan.id === 'pro';

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                    isPro
                      ? 'border-blue-600 bg-blue-50/20 shadow-premium ring-2 ring-blue-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-slate-900">${plan.priceMonthly}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ month</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-center">
                      <span className="text-xs font-bold text-blue-700">{plan.quotaLabel}</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl cursor-default"
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
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
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

          {/* Modal Footer with Cancel Option */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Need custom enterprise requirements? <a href="mailto:support@skyhaven.io" className="text-blue-600 underline">Contact team</a>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              Cancel / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
