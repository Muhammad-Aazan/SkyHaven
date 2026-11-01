import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { AuthModal, AuthView } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { StoragePlansModal } from './components/settings/StoragePlansModal';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard' | 'share'>('landing');
  const [shareToken, setShareToken] = useState<string>('sh_preview_72a');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');

  // Modals for post-signup onboarding and premium upgrade
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Initialize initial route based on authentication and URL
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.startsWith('/share/')) {
      const token = path.replace('/share/', '');
      setShareToken(token);
      setCurrentPage('share');
    } else if (search.includes('view=dashboard') || isAuthenticated) {
      setCurrentPage('dashboard');
      if (search.includes('modal=plans')) {
        setIsUpgradeOpen(true);
      }
    } else {
      setCurrentPage('landing');
      if (search.includes('view=login')) {
        setAuthView('login');
        setIsAuthOpen(true);
      } else if (search.includes('view=signup')) {
        setAuthView('signup');
        setIsAuthOpen(true);
      }
    }
  }, [isAuthenticated]);

  // Check if newly logged-in user needs onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      const onboardedLocally = localStorage.getItem(`onboarded_${user.id}`);
      if (!user.isOnboarded && !onboardedLocally) {
        setIsOnboardingOpen(true);
      }
    }
  }, [isAuthenticated, user?.id, user?.isOnboarded]);

  const handleOpenAuth = (view: AuthView) => {
    setAuthView(view);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (mode: 'login' | 'signup') => {
    setIsAuthOpen(false);
    setCurrentPage('dashboard');
    if (mode === 'signup') {
      setIsOnboardingOpen(true);
    }
  };

  const handleOnboardingComplete = () => {
    if (user?.id) {
      localStorage.setItem(`onboarded_${user.id}`, 'true');
    }
    setIsOnboardingOpen(false);
    // After onboarding, prompt user to consider upgrading to premium
    setIsUpgradeOpen(true);
  };

  const handleOnboardingSkip = () => {
    if (user?.id) {
      localStorage.setItem(`onboarded_${user.id}`, 'true');
    }
    setIsOnboardingOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300 tracking-wide">Loading SkyHeaven Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Primary Page Router */}
      {currentPage === 'landing' ? (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onGoToDashboard={() => {
            if (isAuthenticated) {
              setCurrentPage('dashboard');
            } else {
              handleOpenAuth('login');
            }
          }}
          isAuthenticated={isAuthenticated}
        />
      ) : currentPage === 'share' ? (
        <PublicSharePage
          shareToken={shareToken}
          onGoToDashboard={() => setCurrentPage('dashboard')}
        />
      ) : (
        <DashboardPage />
      )}

      {/* Global Auth Modal (Login / Signup / OTP Verify / Forgot) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialView={authView}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding Modal (takes name, avatar picture, workspace details before dashboard) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      {/* Storage & Premium Plans Modal (Triggered after onboarding with Cancel option) */}
      <StoragePlansModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FileProvider>
        <AppContent />
      </FileProvider>
    </AuthProvider>
  );
};

export default App;
