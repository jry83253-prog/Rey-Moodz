import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Image as ImageIcon, Link, HardDrive } from 'lucide-react';
import type { Application, Category } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

interface AdminAppModalProps {
  isOpen: boolean;
  appToEdit: Application | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: (savedSlug?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminAppModal: React.FC<AdminAppModalProps> = ({
  isOpen,
  appToEdit,
  categories,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const isEditing = Boolean(appToEdit);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [size, setSize] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [changelog, setChangelog] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (appToEdit) {
      setName(appToEdit.name || '');
      setSlug(appToEdit.slug || '');
      setIconUrl(appToEdit.iconUrl || '');
      setDescription(appToEdit.description || '');
      setVersion(appToEdit.version || '');
      setSize(appToEdit.size || '');
      setCategoryId(appToEdit.categoryId || (categories[0]?.id ?? ''));
      setDownloadUrl(appToEdit.downloadUrl || '');

      // Parse features
      const fList = Array.isArray(appToEdit.features)
        ? appToEdit.features
        : typeof appToEdit.features === 'string'
        ? (appToEdit.features as string).split('\n').filter(Boolean)
        : [];
      setFeatures(fList.join('\n'));

      // Parse changelog
      const cList = Array.isArray(appToEdit.changelog)
        ? appToEdit.changelog
        : typeof appToEdit.changelog === 'string'
        ? (appToEdit.changelog as string).split('\n').filter(Boolean)
        : [];
      setChangelog(cList.join('\n'));

      setScreenshots(appToEdit.screenshots || []);
      setFeatured(Boolean(appToEdit.featured));
      setPublished(Boolean(appToEdit.published));
    } else {
      // Defaults for new app
      setName('');
      setSlug('');
      setIconUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80');
      setDescription('');
      setVersion('v1.0.0');
      setSize('50 MB');
      setCategoryId(categories[0]?.id || 'cat-tools');
      setDownloadUrl('');
      setFeatures('Fitur Premium Terbuka\nTanpa Iklan Sponsor\nPerforma Optimal');
      setChangelog('Rilis versi perdana oleh REY MODDER');
      setScreenshots([]);
      setFeatured(false);
      setPublished(true);
    }
    setErrorMessage(null);
  }, [appToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
      setSlug(generated);
    }
  };

  const addScreenshot = () => {
    const trimmed = newScreenshotUrl.trim();
    if (trimmed) {
      setScreenshots([...screenshots, trimmed]);
      setNewScreenshotUrl('');
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama aplikasi wajib diisi');
      return;
    }
    if (!version.trim()) {
      setErrorMessage('Versi wajib diisi');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Kategori wajib dipilih');
      return;
    }
    if (!downloadUrl.trim() || (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://'))) {
      setErrorMessage('Download URL harus diawali dengan http:// atau https://');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        iconUrl: iconUrl.trim(),
        description: description.trim(),
        version: version.trim(),
        size: size.trim(),
        categoryId,
        downloadUrl: downloadUrl.trim(),
        features: features.split('\n').map((s) => s.trim()).filter(Boolean),
        changelog: changelog.split('\n').map((s) => s.trim()).filter(Boolean),
        featured,
        published,
        screenshots,
      };

      if (isEditing && appToEdit) {
        await api.updateAdminApp(appToEdit.id, payload);
        onShowToast('success', `Aplikasi "${payload.name}" berhasil diperbarui`);
        onSuccess(payload.slug);
      } else {
        const res = await api.createAdminApp(payload);
        onShowToast('success', `Aplikasi "${payload.name}" berhasil dipublikasikan`);
        onSuccess(res.slug);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan aplikasi');
      onShowToast('error', err.message || 'Gagal menyimpan aplikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-8 p-6 shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Aplikasi' : 'Tambah Aplikasi Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Perbarui metadata, versi, screenshot, atau tautan unduhan'
                : 'Lengkapi formulir untuk menambahkan aplikasi ke katalog'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Row 1: Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Nama Aplikasi *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: CapCut Pro Video Editor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">URL Slug (Auto/Custom)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="capcut-pro-video-editor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: Category, Version, Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Kategori *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Versi *</label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v12.4.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Ukuran File *</label>
              <input
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="148 MB"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Icon URL & Preview */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Icon / Logo URL *</label>
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 shrink-0 overflow-hidden">
                <img
                  src={iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80'}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                required
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Download URL */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Download URL (Direct / Safe Storage) *</label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                required
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://github.com/reymodder/.../app.apk"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Tautan unduhan diverifikasi di server sebelum diteruskan ke pengunjung.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Deskripsi Lengkap *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi fungsi dan keunggulan aplikasi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Dual Textareas: Features & Changelog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Fitur Utama (1 baris per item)</label>
              <textarea
                rows={3}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Export 4K 60fps&#10;Semua filter aktif&#10;Tanpa Watermark"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">What's New / Changelog (1 baris per item)</label>
              <textarea
                rows={3}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Update base version&#10;Perbaikan bug crash Android 14"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Screenshots Management */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300">Tangkapan Layar (Screenshots)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newScreenshotUrl}
                onChange={(e) => setNewScreenshotUrl(e.target.value)}
                placeholder="Masukkan URL screenshot (https://...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addScreenshot}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {screenshots.map((url, i) => (
                  <div key={i} className="relative group w-20 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={url} alt={`ss-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggles: Featured & Published */}
          <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800"
              />
              <span className="font-semibold text-xs sm:text-sm">Publikasikan Sekarang (Live)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800"
              />
              <span className="font-semibold text-xs sm:text-sm flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Tandai sebagai Featured
              </span>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Menyimpan ke Database...
                </>
              ) : isEditing ? (
                'Simpan Perubahan'
              ) : (
                'Publikasikan Aplikasi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
