import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  RefreshCw,
} from 'lucide-react';
import type { Application, Category } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { ConfirmModal } from '../ConfirmModal.tsx';
import { AdminAppModal } from './AdminAppModal.tsx';

interface AdminAppManagementProps {
  categories: Category[];
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onPreviewApp: (slug: string) => void;
}

export const AdminAppManagement: React.FC<AdminAppManagementProps> = ({
  categories,
  onShowToast,
  onPreviewApp,
}) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'featured'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppToEdit, setSelectedAppToEdit] = useState<Application | null>(null);

  // Delete modal state
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadApps();
  }, [statusFilter]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminApps({
        status: statusFilter,
        q: searchQuery.trim() || undefined,
      });
      setApps(data);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal memuat aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApps();
  };

  const handleTogglePublish = async (app: Application) => {
    try {
      const res = await api.togglePublish(app.id);
      setApps(apps.map((a) => (a.id === app.id ? { ...a, published: res.published } : a)));
      onShowToast('success', res.published ? `"${app.name}" dipublikasikan` : `"${app.name}" ditarik ke draft`);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal mengubah status publikasi');
    }
  };

  const handleToggleFeatured = async (app: Application) => {
    try {
      const res = await api.toggleFeatured(app.id);
      setApps(apps.map((a) => (a.id === app.id ? { ...a, featured: res.featured } : a)));
      onShowToast('success', res.featured ? `"${app.name}" ditandai Featured` : `Status Featured "${app.name}" dicabut`);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal mengubah status featured');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteAdminApp(appToDelete.id);
      setApps(apps.filter((a) => a.id !== appToDelete.id));
      onShowToast('success', `Aplikasi "${appToDelete.name}" berhasil dihapus dari database`);
      setAppToDelete(null);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menghapus aplikasi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Bar: Title & New App Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Katalog Aplikasi</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Kelola aplikasi, versi update, screenshot, dan tautan download secara real-time
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedAppToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Tambah Aplikasi Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 border border-slate-800 p-3 sm:p-4 rounded-2xl">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'published', 'draft', 'featured'] as const).map((st) => {
            const labels = {
              all: 'Semua Status',
              published: 'Dipublikasikan',
              draft: 'Draft',
              featured: 'Featured',
            };
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aplikasi / versi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Applications List / Table */}
      {loading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Memuat data dari database...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak ada aplikasi yang cocok</h3>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `Tidak ditemukan aplikasi dengan kata kunci "${searchQuery}"`
              : 'Belum ada aplikasi pada status ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Aplikasi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Versi & Ukuran</th>
                  <th className="py-3 px-4">Unduhan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate max-w-xs">{app.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono truncate block">
                            /{app.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {app.categoryName || 'Tanpa Kategori'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{app.version}</div>
                      <div className="text-[11px] text-slate-500">{app.size}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      {app.downloadCount.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(app)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          app.published
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        {app.published ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Live
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(app)}
                        className={`p-1.5 rounded-lg transition ${
                          app.featured
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                            : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                        title={app.featured ? 'Cabut Featured' : 'Jadikan Featured'}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewApp(app.slug)}
                          title="Lihat Halaman Publik"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAppToEdit(app);
                            setIsModalOpen(true);
                          }}
                          title="Edit Aplikasi"
                          className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setAppToDelete(app)}
                          title="Hapus Aplikasi"
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Optimized for Android / Smartphones) */}
          <div className="block md:hidden space-y-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{app.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                        <span>{app.version}</span>
                        <span>•</span>
                        <span>{app.size}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400">
                    {app.categoryName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span className="font-mono text-emerald-400">{app.downloadCount} unduhan</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(app)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        app.published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {app.published ? 'Live' : 'Draft'}
                    </button>

                    <button
                      onClick={() => handleToggleFeatured(app)}
                      className={`p-1.5 rounded-lg ${
                        app.featured
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onPreviewApp(app.slug)}
                    className="py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lihat
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAppToEdit(app);
                      setIsModalOpen(true);
                    }}
                    className="py-1.5 rounded-xl bg-cyan-950/60 text-cyan-400 hover:bg-cyan-900/60 text-xs font-semibold flex items-center justify-center gap-1 border border-cyan-500/20"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => setAppToDelete(app)}
                    className="py-1.5 rounded-xl bg-red-950/60 text-red-400 hover:bg-red-900/60 text-xs font-semibold flex items-center justify-center gap-1 border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit App Modal */}
      <AdminAppModal
        isOpen={isModalOpen}
        appToEdit={selectedAppToEdit}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadApps();
        }}
        onShowToast={onShowToast}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(appToDelete)}
        title="Hapus Aplikasi?"
        message={`Apakah Anda yakin ingin menghapus aplikasi "${appToDelete?.name}"? Tindakan ini akan menghapus semua metadata dan screenshot aplikasi dari database secara permanen.`}
        confirmLabel="Ya, Hapus Aplikasi"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAppToDelete(null)}
      />
    </div>
  );
};
