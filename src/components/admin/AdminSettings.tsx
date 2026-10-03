import React, { useState, useEffect } from 'react';
import { Settings, Shield, KeyRound, Save, MessageCircle, Globe } from 'lucide-react';
import { api } from '../../lib/api.ts';

interface AdminSettingsProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onSettingsSaved: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onShowToast, onSettingsSaved }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [siteName, setSiteName] = useState('REY MODDER');
  const [tagline, setTagline] = useState('MOD • UPDATE • SHARE');
  const [description, setDescription] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39');
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Admin Account state
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSettings();
      const s = data.settings || {};
      setSiteName(s.site_name || 'REY MODDER');
      setTagline(s.tagline || 'MOD • UPDATE • SHARE');
      setDescription(s.description || '');
      setWhatsappUrl(s.whatsapp_url || 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39');
      setAnnouncementEnabled(s.announcement_enabled === '1');
      setAnnouncementText(s.announcement_text || '');
      setFooterText(s.footer_text || '');

      if (data.admin) {
        setCurrentUsername(data.admin.username);
        setNewUsername(data.admin.username);
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = {
        site_name: siteName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        whatsapp_url: whatsappUrl.trim(),
        announcement_enabled: announcementEnabled ? '1' : '0',
        announcement_text: announcementText.trim(),
        footer_text: footerText.trim(),
      };

      // If user wants to change credentials
      if (newPassword || newUsername !== currentUsername) {
        if (!currentPassword) {
          throw new Error('Masukkan password saat ini untuk memverifikasi perubahan akun admin');
        }
        payload.currentPassword = currentPassword;
        if (newUsername !== currentUsername) {
          payload.newUsername = newUsername.trim();
        }
        if (newPassword) {
          payload.newPassword = newPassword;
        }
      }

      await api.updateAdminSettings(payload);
      onShowToast('success', 'Pengaturan website berhasil disimpan ke database');
      setCurrentPassword('');
      setNewPassword('');
      await loadSettings();
      onSettingsSaved();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Pengaturan Website & Keamanan</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Ubah konfigurasi brand, integrasi saluran komunitas, dan kredensial admin
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Branding & Info */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Identitas & Brand</h2>
              <p className="text-xs text-slate-400">Nama website, tagline, dan deskripsi publik</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Nama Website</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Tagline Website</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-300">Deskripsi Meta / Subtitle</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Community & WhatsApp */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Komunitas & Banner</h2>
              <p className="text-xs text-slate-400">Saluran WhatsApp dan pesan pengumuman publik</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">URL Saluran WhatsApp</label>
              <input
                type="url"
                required
                value={whatsappUrl}
                onChange={(e) => setWhatsappUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Tautan resmi saluran: https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800"
                />
                <span className="font-bold text-slate-200">Tampilkan Banner Pengumuman di Atas Website</span>
              </label>

              {announcementEnabled && (
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Isi teks pengumuman yang tampil di paling atas halaman..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="font-bold text-slate-300">Teks Footer Hak Cipta</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Security & Admin Credentials */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keamanan Akun Admin</h2>
              <p className="text-xs text-slate-400">
                Ganti username dan password admin (di-hash dengan bcrypt di server)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Username Admin</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Saat ini: {currentUsername}</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Password Saat Ini</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Diperlukan untuk ganti akun"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kosongkan jika tak diubah"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-950/40 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                Menyimpan Perubahan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Semua Pengaturan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
