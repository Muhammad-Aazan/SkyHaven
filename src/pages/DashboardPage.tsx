import React, { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { EmptyState } from '../components/common/EmptyState';
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
import { StorageCard } from '../components/dashboard/StorageCard';
import { WorkspaceOverview } from '../components/dashboard/WorkspaceOverview';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { StoragePlansModal } from '../components/settings/StoragePlansModal';
import { AdminView } from '../components/settings/AdminView';

export const DashboardPage: React.FC = () => {
  const { currentSection, viewMode, files, folders, isLoading } = useFiles();
  const { user } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  const totalItems = files.length + folders.length;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Application Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Collapsible Sidebar */}
        <Sidebar onOpenPlans={() => setIsPlansOpen(true)} />

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Figma Workspace Overview (Good morning Maya, storage widget, library stats, starred) */}
            {currentSection === 'my_files' && (
              <WorkspaceOverview onOpenPlans={() => setIsPlansOpen(true)} />
            )}

            {/* Admin & Security Section */}
            {currentSection === 'admin' ? (
              <AdminView />
            ) : (
              <>
                {/* Breadcrumbs & View Toggle Controls */}
                <Breadcrumb />

                {/* Content States */}
                {isLoading ? (
                  <div className="py-24 text-center">
                    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Loading files from Cloudflare R2 vault...</p>
                  </div>
                ) : totalItems === 0 ? (
                  <EmptyState
                    type={
                      currentSection === 'starred'
                        ? 'starred'
                        : currentSection === 'trash'
                        ? 'trash'
                        : currentSection === 'recent'
                        ? 'recent'
                        : currentSection === 'shared_by_me' || currentSection === 'shared_with_me'
                        ? 'shared'
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

      {/* Global Modals, Drawers & Overlays */}
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
