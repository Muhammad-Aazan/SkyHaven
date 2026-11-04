import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud, ArrowRight, Check, ChevronDown,
  Layers, Lock, Share2, Smartphone, ShieldCheck,
  CheckCircle2, Sparkles, Folder, FileText, Image as ImageIcon, Video, ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (view: 'login' | 'signup') => void;
  onGoToDashboard: () => void;
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onGoToDashboard,
  isAuthenticated = false
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const faqs = [
    {
      q: 'Can I use Skyhaven for free?',
      a: 'Absolutely. Your free account includes 25 GB of secure storage, file sharing, and access on every device. No credit card needed.'
    },
    {
      q: 'Can I share files with people who don’t use Skyhaven?',
      a: 'Yes. Anyone with your shared link can view or download a file. You decide who can edit, and when access expires.'
    },
    {
      q: 'How secure are my files?',
      a: 'Files are encrypted with AES-256 at rest and TLS in transit. Enable two-factor authentication for added account protection.'
    },
    {
      q: 'What happens if I need more storage?',
      a: 'Upgrade your plan anytime in Storage. Your files stay right where they are, with no interruption to your work.'
    }
  ];

  const sponsorLogos = ['Layers', 'Northstar', 'Acme Studio', 'Quotient', 'Sisyphus'];

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#0F172A] font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* 1. Marketing Navigation (Figma: Marketing navigation - 80px) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] h-20 flex items-center transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Wordmark */}
            <div className="flex items-center cursor-pointer py-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/logo.png" alt="SkyHeaven" className="h-12 sm:h-13 w-auto object-contain" />
            </div>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#475569]">
              <a href="#features" className="hover:text-[#0061FE] transition-colors">Features</a>
              <a href="#security" className="hover:text-[#0061FE] transition-colors">Security</a>
              <a href="#pricing" className="hover:text-[#0061FE] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#0061FE] transition-colors">Resources</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.98] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-[13px] font-medium text-[#475569] hover:text-[#0061FE] transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.98] rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>Get started free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero and Product Preview (Figma: Hero and product preview) */}
      <section className="pt-16 pb-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0061FE] text-xs font-medium">
            <Sparkles className="w-3 h-3 fill-blue-500" />
            <span>A little more space. A lot more possibility.</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold text-[#0F172A] tracking-tight leading-[1.08]">
            Your work, together.<br />
            <span className="text-[#0061FE]">Your mind, at ease.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#475569] max-w-2xl mx-auto leading-relaxed">
            A calm, secure home for every file. Store, share, and find what matters—with space to do your best work.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#0061FE] hover:bg-[#0052D4] active:scale-[0.98] rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Skyhaven</span>
              <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <p className="text-xs text-[#64748B] pt-1">
            25 GB free · No credit card required · Yours to keep
          </p>
        </div>

        {/* Realistic Figma Product Preview Frame */}
        <div className="mt-14 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Fake Browser Top Chrome */}
          <div className="h-10 bg-[#F1F5F9] border-b border-[#E2E8F0] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
              <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
            </div>
            <div className="px-5 py-1 rounded-md bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#64748B]">
              app.skyhaven.com
            </div>
            <div className="w-12" />
          </div>

          {/* Dashboard Screen Mockup (Figma layout: Good morning, Maya) */}
          <div className="grid grid-cols-12 min-h-[440px]">
            {/* Mini Sidebar */}
            <div className="col-span-3 border-r border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col justify-between hidden sm:flex">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0061FE] flex items-center justify-center text-white text-[11px] font-bold">S</div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">Studio workspace</p>
                    <p className="text-[10px] text-[#64748B]">Personal Pro</p>
                  </div>
                </div>

                <nav className="space-y-1 text-xs">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-50 text-[#0061FE] font-semibold">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A]">
                    <Folder className="w-3.5 h-3.5" />
                    <span>My files</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A]">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Shared with me</span>
                  </div>
                </nav>
              </div>

              {/* Storage Pill in Figma */}
              <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-[11px] space-y-1.5">
                <div className="flex justify-between font-semibold text-[#0F172A]">
                  <span>Your storage</span>
                  <span className="text-[#0061FE]">64%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0061FE] w-[64%]" />
                </div>
                <p className="text-[10px] text-[#64748B]">128 GB of 200 GB used</p>
              </div>
            </div>

            {/* Mini Main View */}
            <div className="col-span-12 sm:col-span-9 p-6 bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#0F172A]">Good morning, Maya</h3>
                  <p className="text-xs text-[#64748B]">Everything you need. Right where you left it.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0061FE] text-xs font-bold flex items-center justify-center">
                  MC
                </div>
              </div>

              {/* Pick up where you left off (Figma Cards) */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">Pick up where you left off</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#0061FE] transition-colors bg-[#FAFAFB]">
                    <FileText className="w-5 h-5 text-red-500 mb-2" />
                    <p className="text-xs font-medium text-[#0F172A] truncate">Brand guidelines.pdf</p>
                    <p className="text-[10px] text-[#64748B]">8.4 MB · PDF</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#0061FE] transition-colors bg-[#FAFAFB]">
                    <ImageIcon className="w-5 h-5 text-blue-500 mb-2" />
                    <p className="text-xs font-medium text-[#0F172A] truncate">Coastal campaign.jpg</p>
                    <p className="text-[10px] text-[#64748B]">12.8 MB · Image</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#0061FE] transition-colors bg-[#FAFAFB]">
                    <Video className="w-5 h-5 text-purple-500 mb-2" />
                    <p className="text-xs font-medium text-[#0F172A] truncate">Launch teaser.mp4</p>
                    <p className="text-[10px] text-[#64748B]">1.2 GB · Video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor/Loved by Teams Banner */}
        <div className="mt-16 text-center">
          <p className="text-xs font-medium text-[#64748B]">Made for independent minds and teams that move together.</p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 mt-6 opacity-60">
            {sponsorLogos.map((brand, i) => (
              <span key={i} className="text-lg font-bold tracking-tight text-[#475569]">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Section (Figma: Features) */}
      <section id="features" className="py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-semibold text-[#0061FE] uppercase tracking-wider">ROOM FOR YOUR BEST WORK</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              Less searching. More creating.
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              All the essentials, thoughtfully in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-subtle hover:border-[#0061FE] transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0061FE]">
                  <Folder className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">A place for everything</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Keep projects organized with folders, smart search, and favorites. Your files are always a few clicks away.
                </p>
              </div>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); onGoToDashboard(); }} className="text-xs font-semibold text-[#0061FE] hover:underline pt-6 inline-flex items-center gap-1">
                Organize your workspace →
              </a>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-subtle hover:border-[#0061FE] transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0061FE]">
                  <Share2 className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">Share without the friction</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Invite collaborators, set the right permissions, and send a link. Keep everyone on the same page.
                </p>
              </div>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); onGoToDashboard(); }} className="text-xs font-semibold text-[#0061FE] hover:underline pt-6 inline-flex items-center gap-1">
                Work better together →
              </a>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-subtle hover:border-[#0061FE] transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0061FE]">
                  <Smartphone className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">Your files, wherever you are</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Move seamlessly between your laptop, tablet, and phone. Pick up exactly where you left off.
                </p>
              </div>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); onGoToDashboard(); }} className="text-xs font-semibold text-[#0061FE] hover:underline pt-6 inline-flex items-center gap-1">
                Stay in your flow →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Security Section (Figma: Security) */}
      <section id="security" className="py-24 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-semibold text-[#0061FE] uppercase tracking-wider">PRIVATE BY DESIGN</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight">
                Your files are personal.<br />
                We keep them that way.
              </h2>
              <p className="text-base text-[#475569] leading-relaxed">
                From your first upload to your next big collaboration, your work is protected at every step. You stay in control.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-3 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                >
                  Explore our security
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0061FE] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">AES-256 encryption</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Encrypted at rest and in transit.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">Two-factor authentication</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">An extra layer of protection for your account.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">Sharing you control</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Set permissions, passwords, and expiry dates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Figma: Pricing) */}
      <section id="pricing" className="py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center">
          <span className="text-xs font-semibold text-[#0061FE] uppercase tracking-wider">SIMPLE PLANS. MORE POSSIBILITY.</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mt-2">
            A space that grows with you.
          </h2>
          <p className="text-sm text-[#475569] mt-2 mb-8">
            Start free. Upgrade when you need a little more room.
          </p>

          {/* Monthly / Yearly Toggle in Figma */}
          <div className="inline-flex items-center p-1 bg-white border border-[#CBD5E1] rounded-full text-xs font-semibold mb-12 shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-[#0061FE] text-white shadow-xs' : 'text-[#64748B]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-[#0061FE] text-white shadow-xs' : 'text-[#64748B]'}`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">Save 20%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl border border-[#E2E8F0] bg-white flex flex-col justify-between shadow-subtle">
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">Free</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-bold text-[#0F172A]">$0</span>
                  <span className="text-xs text-[#64748B]">Free forever</span>
                </div>
                <p className="text-xs text-[#64748B] mb-4">A home for your everyday files.</p>
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl mb-6">
                  <span className="text-xs font-bold text-[#0061FE]">25 GB of secure storage</span>
                </div>
                <ul className="space-y-3 text-xs text-[#475569] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Secure file storage</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Share files with a link</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Access on any device</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full py-3 px-4 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] transition-colors"
              >
                Start for free
              </button>
            </div>

            {/* Personal Pro */}
            <div className="p-8 rounded-2xl border-2 border-[#0061FE] bg-white flex flex-col justify-between shadow-xl relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#0061FE] text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                Most popular
              </span>
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">Personal Pro</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-bold text-[#0F172A]">{billingCycle === 'monthly' ? '$8' : '$6.5'}</span>
                  <span className="text-xs text-[#64748B]">per month</span>
                </div>
                <p className="text-xs text-[#64748B] mb-4">More room for your next big idea.</p>
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl mb-6">
                  <span className="text-xs font-bold text-[#0061FE]">200 GB of secure storage</span>
                </div>
                <ul className="space-y-3 text-xs text-[#475569] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Password-protected links</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Version history for 30 days</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Priority support</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full py-3 px-4 text-xs font-semibold rounded-xl bg-[#0061FE] hover:bg-[#0052D4] text-white shadow-sm shadow-blue-500/20 transition-colors"
              >
                Try Personal Pro
              </button>
            </div>

            {/* Team Plan */}
            <div className="p-8 rounded-2xl border border-[#E2E8F0] bg-white flex flex-col justify-between shadow-subtle">
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">Team</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-4xl font-bold text-[#0F172A]">{billingCycle === 'monthly' ? '$16' : '$13'}</span>
                  <span className="text-xs text-[#64748B]">per member / month</span>
                </div>
                <p className="text-xs text-[#64748B] mb-4">One shared space. Endless potential.</p>
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl mb-6">
                  <span className="text-xs font-bold text-[#0061FE]">2 TB per member of storage</span>
                </div>
                <ul className="space-y-3 text-xs text-[#475569] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Everything in Personal Pro</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Shared team folders</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Advanced admin controls</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#0061FE]" /> Activity and audit logs</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full py-3 px-4 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Start your team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section (Figma: Frequently asked questions) */}
      <section id="faq" className="py-24 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              A few things you might be wondering.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#FAFAFB] border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#0F172A] hover:text-[#0061FE] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#F1F5F9] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer (Figma: Footer) */}
      <footer className="bg-[#0F172A] text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-12 border-b border-slate-800 gap-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Make room for what’s next.</h3>
              <p className="text-sm text-slate-400 mt-1">Your next idea deserves a better home.</p>
            </div>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3 text-xs font-semibold text-[#0F172A] bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
            >
              Get started free
            </button>
          </div>

          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="flex items-center">
              <img src="/logo.png" alt="SkyHeaven" className="h-10 w-auto object-contain brightness-0 invert" />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#features" className="hover:text-white transition-colors">Product</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">Help center</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>

            <p className="text-[11px] text-slate-500">
              © 2026 Skyhaven, Inc. All rights reserved. · Thoughtfully made for your everyday.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
