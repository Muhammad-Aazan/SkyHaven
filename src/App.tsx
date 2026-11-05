import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthModal, AuthView } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { StoragePlansModal } from './components/settings/StoragePlansModal';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard' | 'share' | '404'>('landing');
  const [shareToken, setShareToken] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.startsWith('/share/')) {
      const token = path.replace('/share/', '');
      if (token) { setShareToken(token); setCurrentPage('share'); }
      else setCurrentPage('404');
    } else if (path === '/dashboard') {
      // Stripe & direct dashboard links — always go to dashboard (or login if not authed)
      if (isAuthenticated) {
        setCurrentPage('dashboard');
        if (search.includes('modal=plans')) setIsUpgradeOpen(true);
      } else if (!isLoading) {
        // Not logged in — show landing with login modal
        setCurrentPage('landing');
        setAuthView('login');
        setIsAuthOpen(true);
      }
    } else if (path === '/' || path === '') {
      if (search.includes('view=dashboard') || isAuthenticated) {
        setCurrentPage('dashboard');
        if (search.includes('modal=plans')) setIsUpgradeOpen(true);
      } else {
        setCurrentPage('landing');
        if (search.includes('view=login')) { setAuthView('login'); setIsAuthOpen(true); }
        else if (search.includes('view=signup')) { setAuthView('signup'); setIsAuthOpen(true); }
      }
    } else {
      setCurrentPage('404');
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const onboardedLocally = localStorage.getItem(`onboarded_${user.id}`);
      if (!user.isOnboarded && !onboardedLocally) setIsOnboardingOpen(true);
    }
  }, [isAuthenticated, user?.id, user?.isOnboarded]);

  const handleOpenAuth = (view: AuthView) => { setAuthView(view); setIsAuthOpen(true); };

  const handleAuthSuccess = (mode: 'login' | 'signup') => {
    setIsAuthOpen(false);
    setCurrentPage('dashboard');
    if (mode === 'signup') setIsOnboardingOpen(true);
  };

  const handleOnboardingComplete = () => {
    if (user?.id) localStorage.setItem(`onboarded_${user.id}`, 'true');
    setIsOnboardingOpen(false);
    setIsUpgradeOpen(true);
  };

  const handleOnboardingSkip = () => {
    if (user?.id) localStorage.setItem(`onboarded_${user.id}`, 'true');
    setIsOnboardingOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Ambient atmospheric glow */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with spinning gradient halo */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            {/* Spinning orbit ring */}
            <div className="absolute -inset-2.5 rounded-[28px] border-2 border-transparent border-t-blue-400 border-r-indigo-400 animate-spin" style={{ animationDuration: '1.2s' }} />
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-white font-bold text-lg tracking-tight">SkyHeaven</h1>
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              Initializing your encrypted vault...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {currentPage === 'landing' ? (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onGoToDashboard={() => { if (isAuthenticated) setCurrentPage('dashboard'); else handleOpenAuth('login'); }}
          isAuthenticated={isAuthenticated}
        />
      ) : currentPage === 'share' ? (
        <PublicSharePage shareToken={shareToken} onGoToDashboard={() => setCurrentPage('dashboard')} />
      ) : currentPage === '404' ? (
        <NotFoundPage onGoHome={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'landing')} />
      ) : (
        <DashboardPage />
      )}

      <AuthModal isOpen={isAuthOpen} initialView={authView} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />
      <OnboardingModal isOpen={isOnboardingOpen} onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      <StoragePlansModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <FileProvider>
        <AppContent />
      </FileProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
