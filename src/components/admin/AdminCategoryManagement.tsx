import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layers, Folder, X } from 'lucide-react';
import type { Category } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { DynamicIcon } from '../DynamicIcon.tsx';
import { ConfirmModal } from '../ConfirmModal.tsx';

interface AdminCategoryManagementProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onCategoriesUpdated: () => void;
}

const COMMON_ICONS = [
  'Scissors',
  'Camera',
  'Video',
  'Music',
  'CheckSquare',
  'Cpu',
  'Wrench',
  'Sliders',
  'Folder',
  'Gamepad2',
  'BookOpen',
  'Shield',
  'Globe',
  'Sparkles',
];

export const AdminCategoryManagement: React.FC<AdminCategoryManagementProps> = ({
  onShowToast,
  onCategoriesUpdated,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminCategories();
      setCategories(data);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('Folder');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || 'Folder');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          icon,
        });
        onShowToast('success', `Kategori "${name}" berhasil diperbarui`);
      } else {
        await api.createCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          icon,
        });
        onShowToast('success', `Kategori "${name}" berhasil ditambahkan`);
      }
      setModalOpen(false);
      await loadCategories();
      onCategoriesUpdated();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      const message = await api.deleteCategory(catToDelete.id);
      onShowToast('success', message);
      setCatToDelete(null);
      await loadCategories();
      onCategoriesUpdated();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menghapus kategori');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Kategori</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Kategori terhubung langsung ke database dan filter pencarian website publik
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Tambah Kategori
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Memuat kategori dari database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const isLainnya = cat.slug === 'lainnya' || cat.id === 'cat-lainnya';

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <DynamicIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{cat.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {cat.appCount ?? 0} aplikasi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition"
                    title="Edit Kategori"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!isLainnya && (
                    <button
                      onClick={() => setCatToDelete(cat)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, '-')
                          .replace(/[^\w\-]+/g, '')
                      );
                    }
                  }}
                  placeholder="Contoh: Gaming & Mod"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Slug URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="gaming-mod"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-300">Pilih Icon Lucide</label>
                <div className="grid grid-cols-7 gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {COMMON_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg flex items-center justify-center transition ${
                        icon === ic
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={ic}
                    >
                      <DynamicIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Safe Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(catToDelete)}
        title="Hapus Kategori?"
        message={`Apakah Anda yakin ingin menghapus kategori "${catToDelete?.name}"? Jika terdapat aplikasi di dalam kategori ini, aplikasi tersebut akan otomatis dipindahkan secara aman ke kategori "Lainnya" sehingga tidak hilang.`}
        confirmLabel="Ya, Hapus Kategori"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
};
