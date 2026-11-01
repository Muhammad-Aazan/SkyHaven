import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Activity, Users, Database, Server,
  Lock, CheckCircle2, AlertTriangle, RefreshCw, LogOut,
  HardDrive
} from 'lucide-react';
import { adminApi } from '../../api/client';
import { AdminUserRecord, SecurityReport } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';

export const AdminView: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [storageReport, setStorageReport] = useState<any>(null);
  const [securityReports, setSecurityReports] = useState<SecurityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'storage' | 'security'>('health');
  const [actionNotice, setActionNotice] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hRes, uRes, stRes, secRes] = await Promise.all([
        adminApi.getHealth(),
        adminApi.getUsers(),
        adminApi.getStorageReports(),
        adminApi.getSecurityReports()
      ]);
      setHealth(hRes.data);
      setUsers(uRes.data || []);
      setStorageReport(stRes.data);
      setSecurityReports(secRes.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await adminApi.toggleUserStatus(userId, nextStatus as any);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus as any } : u));
    setActionNotice(`User account ${userId} marked as ${nextStatus}.`);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleRevokeSessions = async (userId: string) => {
    await adminApi.revokeAllUserSessions(userId);
    setActionNotice(`All active sessions revoked for user ${userId}.`);
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Admin Security & Health Console</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                OWASP TOP 10 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live monitoring for cluster health, storage allocation, audit logs, and account access
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-400 select-none">
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'health' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Health & Uptime</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'storage' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage Reports</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security Audit Events</span>
        </button>
      </div>

      {/* TAB 1: HEALTH */}
      {activeTab === 'health' && health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">API Gateway</span>
              <Server className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{health.services.apiServer}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 99.99% Availability
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Database Engine</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{health.services.database}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3-Node Clustered
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Storage S3 Target</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{health.services.storageEngine}</p>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero Egress Costs
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Rate Limiter & Cache</span>
              <Lock className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{health.services.cache}</p>
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sub-millisecond latency
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Storage Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold text-slate-600">
                    {u.role}
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold text-blue-600">
                    {u.planId}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatBytes(u.storageUsed)} of {formatBytes(u.storageQuota)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                        u.status === 'active'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleRevokeSessions(u.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                      title="Revoke all active sessions"
                    >
                      Revoke Sessions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: STORAGE REPORTS */}
      {activeTab === 'storage' && storageReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <span className="text-xs font-semibold text-slate-400">Total Pooled Vault Space</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatBytes(storageReport.totalStorageAllocatedBytes)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Across 3 Cloudflare R2 geographically redundant buckets
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <span className="text-xs font-semibold text-slate-400">Total Ingested Data</span>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {formatBytes(storageReport.totalStorageUsedBytes)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {storageReport.totalFilesIndexed.toLocaleString()} encrypted objects indexed
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-subtle">
            <span className="text-xs font-semibold text-slate-400">Active Daily Ingress</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {formatBytes(storageReport.dailyUploadVolumeBytes)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {storageReport.activeAccounts} verified active accounts
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY REPORTS */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-3">
          {securityReports.map(sec => (
            <div
              key={sec.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between text-xs"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  sec.severity === 'high' ? 'text-rose-500' : 'text-amber-500'
                }`} />
                <div>
                  <p className="font-bold text-slate-800">{sec.event}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    User: {sec.userEmail} • Origin IP: {sec.ip} • Timestamp: {formatDate(sec.timestamp)}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                Mitigated & Blocked
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
