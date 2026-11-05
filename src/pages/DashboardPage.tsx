import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { storageApi } from '../api/client';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { FileGrid } from '../components/files/FileGrid';
import { FileList } from '../components/files/FileList';
import { FileInfoDrawer } from '../components/files/FileInfoDrawer';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { ShareModal } from '../components/files/ShareModal';
import { MoveCopyModal } from '../components/files/MoveCopyModal';
import { NewFolderModal } from '../components/upload/NewFolderModal';
import { CommandPalette } from '../components/common/CommandPalette';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { UploadManager } from '../components/upload/UploadManager';
import { WorkspaceOverview } from '../components/dashboard/WorkspaceOverview';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { StoragePlansModal } from '../components/settings/StoragePlansModal';
import { AdminDashboard } from '../components/admin';

export const DashboardPage: React.FC = () => {
  const { currentSection, viewMode, files, folders, isLoading } = useFiles();
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  // Handle Stripe callback URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const upgraded = params.get('upgraded');
    const modal = params.get('modal');

    if (modal === 'plans') {
      setIsPlansOpen(true);
    }

    if (sessionId) {
      // Verify payment with backend, then refresh user and fire confetti
      storageApi.verifySession(sessionId)
        .then(async (res) => {
          if (res.success) {
            await refreshUser();
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
          } else {
            // Session found but not paid yet — still refresh to get latest plan
            await refreshUser();
          }
        })
        .catch(async () => {
          // Network / backend error — still refresh user silently
          await refreshUser();
        })
        .finally(() => {
          // Always clean the URL regardless of outcome
          window.history.replaceState({}, '', '/dashboard');
        });
    } else if (upgraded) {
      // Non-Stripe / fallback upgrade — just refresh + confetti
      refreshUser().then(() => {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      }).catch(console.error);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems = files.length + folders.length;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenPlans={() => setIsPlansOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {currentSection === 'my_files' && (
              <WorkspaceOverview onOpenPlans={() => setIsPlansOpen(true)} />
            )}

            {/* Admin section — strictly isolated and only available to admins */}
            {currentSection === 'admin' ? (
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">Access Restricted</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500">You don't have permission to view this section.</p>
                </div>
              )
            ) : (
              <>
                <Breadcrumb />

                {/* Smooth skeleton when loading with zero items */}
                {isLoading && totalItems === 0 ? (
                  <SkeletonLoader viewMode={viewMode} />
                ) : totalItems === 0 ? (
                  <EmptyState
                    type={
                      currentSection === 'starred' ? 'starred'
                      : currentSection === 'trash' ? 'trash'
                      : currentSection === 'recent' ? 'recent'
                      : currentSection === 'shared_by_me' || currentSection === 'shared_with_me' ? 'shared'
                      : 'folder'
                    }
                  />
                ) : viewMode === 'grid' ? (
                  <FileGrid />
                ) : (
                  <FileList />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <FileInfoDrawer />
      <FilePreviewModal />
      <ShareModal />
      <MoveCopyModal />
      <NewFolderModal />
      <CommandPalette />
      <UploadDropzone />
      <UploadManager />
      <ProfileSettings isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <StoragePlansModal isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)} />
    </div>
  );
};

export default DashboardPage;
