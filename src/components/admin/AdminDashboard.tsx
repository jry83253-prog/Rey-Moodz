import React, { useEffect, useState } from 'react';
import {
  Package,
  Layers,
  Sparkles,
  Download,
  Eye,
  FileCheck,
  FileClock,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { AdminStats } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'apps' | 'categories' | 'settings') => void;
  onOpenAddApp: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenAddApp,
  onShowToast,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Aplikasi',
      value: stats?.totalApps ?? 0,
      icon: Package,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Dipublikasikan',
      value: stats?.publishedApps ?? 0,
      icon: FileCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Draft / Tersimpan',
      value: stats?.draftApps ?? 0,
      icon: FileClock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Featured Apps',
      value: stats?.featuredApps ?? 0,
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Kategori',
      value: stats?.totalCategories ?? 0,
      icon: Layers,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Total Unduhan',
      value: (stats?.totalDownloads ?? 0).toLocaleString('id-ID'),
      icon: Download,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ringkasan Sistem Real-Time</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Metrik langsung dihitung dari database SQLite/PostgreSQL REY MODDER
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadStats}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddApp}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Tambah Aplikasi
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium truncate">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Dual Section: Recently Updated & Recent Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Updated Apps */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Baru Saja Diperbarui</h2>
            </div>
            <button
              onClick={() => onNavigateTab('apps')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              Lihat Semua Aplikasi →
            </button>
          </div>

          <div className="space-y-2.5">
            {stats?.recentlyUpdated && stats.recentlyUpdated.length > 0 ? (
              stats.recentlyUpdated.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{app.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {app.version} • {app.downloadCount} unduhan
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      app.published
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {app.published ? 'Live' : 'Draft'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada aplikasi yang terdaftar.</p>
            )}
          </div>
        </div>

        {/* Recent Download Logs */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Aktivitas Unduhan Terakhir</h2>
            </div>
            <span className="text-xs text-slate-500">Live Activity Feed</span>
          </div>

          <div className="space-y-2.5">
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              stats.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={log.iconUrl}
                      alt={log.appName}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-200 block truncate">{log.appName}</span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        Versi {log.version}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">Berhasil diunduh</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat unduhan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
