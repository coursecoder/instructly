'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../../api/src/trpc/routers';

interface ExportData {
  exportDate: string;
  user: any;
  projects: any[];
  aiUsage: any[];
  auditLogs: any[];
  sessions: any[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'account'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Create tRPC client
  const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3001/api/trpc'
          : '/api/trpc',
        headers() {
          const token = typeof window !== 'undefined' 
            ? localStorage.getItem('auth-token')
            : null;
            
          return token ? {
            authorization: `Bearer ${token}`,
          } : {};
        },
      }),
    ],
  });

  const handleExportData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await trpcClient.auth.exportData.mutate();
      setExportData(result);
      
      // Create downloadable file
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `instructly-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Your data has been exported and downloaded successfully.' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      setMessage({ type: 'error', text: 'Email confirmation does not match your account email.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await trpcClient.auth.deleteAccount.mutate({ confirmEmail: deleteConfirmEmail });
      
      // Sign out and redirect
      await signOut();
      router.push('/');
      
      setMessage({ type: 'success', text: 'Your account has been deleted successfully.' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete account. Please try again.' 
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmEmail('');
    }
  };

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account preferences and privacy settings
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile' },
                { id: 'privacy', name: 'Privacy & Data' },
                { id: 'account', name: 'Account Management' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Your basic account information
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 text-sm text-gray-900">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 text-sm text-gray-900 capitalize">{user.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <div className="mt-1 text-sm text-gray-900">{user.organization || 'Not specified'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Privacy & Data Rights</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your personal data and privacy preferences in compliance with GDPR
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Data Export</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a copy of all your personal data stored in our system, including your profile, 
                    projects, AI usage history, and audit logs.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Exporting...' : 'Export My Data'}
                  </button>
                </div>

                {exportData && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-green-900 mb-2">Export Summary</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>Export Date: {new Date(exportData.exportDate).toLocaleString()}</p>
                      <p>Projects: {exportData.projects?.length || 0}</p>
                      <p>AI Usage Records: {exportData.aiUsage?.length || 0}</p>
                      <p>Audit Logs: {exportData.auditLogs?.length || 0}</p>
                      <p>Sessions: {exportData.sessions?.length || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Management</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your account settings and deletion
                  </p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg">
                  <h4 className="text-md font-medium text-red-900 mb-4">Delete Account</h4>
                  <p className="text-sm text-red-800 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    All your projects, lessons, and usage history will be permanently removed.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-red-900 mb-2">
                          Confirm your email address to proceed with account deletion:
                        </label>
                        <input
                          type="email"
                          value={deleteConfirmEmail}
                          onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                          placeholder={user.email}
                          className="block w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isLoading || deleteConfirmEmail !== user.email}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Deleting...' : 'Permanently Delete Account'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmEmail('');
                          }}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}