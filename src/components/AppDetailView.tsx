import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Calendar,
  HardDrive,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileText,
  Layers,
  Image as ImageIcon,
  Share2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import type { Application } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { ImageLightbox } from './ImageLightbox.tsx';
import { DownloadModal } from './DownloadModal.tsx';
import { AppCard } from './AppCard.tsx';

interface AppDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectApp: (slug: string) => void;
  whatsappUrl?: string;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AppDetailView: React.FC<AppDetailViewProps> = ({
  slug,
  onBack,
  onSelectApp,
  whatsappUrl = 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39',
  onShowToast,
}) => {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Download modal state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => {
    loadAppDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const loadAppDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAppBySlug(slug);
      setApp(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${app?.name} (${app?.version}) — REY MODDER`,
          text: `Download ${app?.name} versi ${app?.version} di REY MODDER`,
          url,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        onShowToast('success', 'Tautan aplikasi berhasil disalin ke clipboard');
      } catch {
        onShowToast('info', 'Tautan: ' + url);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-10 w-32 bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-800/60 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-800/40 rounded-2xl" />
          <div className="h-48 bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Aplikasi Tidak Ditemukan</h2>
        <p className="text-slate-400 text-sm">{error || 'Aplikasi yang Anda cari mungkin telah dihapus atau ditarik.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const featuresList = Array.isArray(app.features)
    ? app.features
    : typeof app.features === 'string'
    ? (app.features as string).split('\n').filter(Boolean)
    : [];

  const changelogList = Array.isArray(app.changelog)
    ? app.changelog
    : typeof app.changelog === 'string'
    ? (app.changelog as string).split('\n').filter(Boolean)
    : [];

  const screenshots = app.screenshots || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Semua Aplikasi
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
        >
          <Share2 className="w-4 h-4" />
          Bagikan
        </button>
      </div>

      {/* Main Header Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
          {/* Large App Icon */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 shadow-2xl shrink-0">
            <img
              src={app.iconUrl}
              alt={app.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
              }}
            />
            {app.featured ? (
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-500 text-slate-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            ) : null}
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold border border-slate-700">
                {app.categoryName || 'Aplikasi'}
              </span>
              {app.featured ? (
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  FEATURED
                </span>
              ) : null}
              <span className="px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20">
                {app.version}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {app.name}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {app.description}
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-slate-500" />
                <span className="font-mono text-slate-200">{app.size}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>
                  {new Date(app.updatedAt || app.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <Download className="w-4 h-4" />
                <span>{app.downloadCount.toLocaleString('id-ID')} Total Unduhan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Terverifikasi Bebas Virus & Script Jahat</span>
          </div>

          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            ⬇ DOWNLOAD {app.version}
          </button>
        </div>
      </div>

      {/* Grid: Fitur & What's New */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fitur Utama */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fitur Unggulan</h2>
              <p className="text-xs text-slate-400">Kemampuan utama pada versi ini</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {featuresList.length > 0 ? (
              featuresList.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Informasi fitur belum ditambahkan.</p>
            )}
          </div>
        </div>

        {/* Changelog / What's New */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Catatan Pembaruan (Changelog)</h2>
              <p className="text-xs text-slate-400">Apa yang baru di versi {app.version}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {changelogList.length > 0 ? (
              changelogList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Catatan pembaruan umum dan peningkatan performa.</p>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots Gallery */}
      {screenshots.length > 0 && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tangkapan Layar (Screenshots)</h2>
              <p className="text-xs text-slate-400">Klik untuk melihat dalam resolusi penuh</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
            {screenshots.map((url, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentImageIndex(idx);
                  setLightboxOpen(true);
                }}
                className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 cursor-pointer shadow-md hover:border-emerald-400 transition"
              >
                <img
                  src={url}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 text-white text-xs font-semibold">
                    Perbesar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Community Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <MessageCircle className="w-3.5 h-3.5" />
            KOMUNITAS REY MODDER
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Ingin Request Aplikasi atau Lapor Link Rusak?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Bergabunglah bersama ribuan anggota lainnya di Saluran WhatsApp resmi untuk mendapatkan update versi tercepat dan link cadangan langsung.
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-6 py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          📢 Ikuti Saluran WhatsApp
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Related Apps */}
      {app.relatedApps && app.relatedApps.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Aplikasi Serupa di {app.categoryName}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {app.relatedApps.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectApp(rel.slug)}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center gap-3.5 group"
              >
                <img
                  src={rel.iconUrl}
                  alt={rel.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0 group-hover:scale-105 transition"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                    {rel.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{rel.version} • {rel.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={screenshots}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setCurrentImageIndex((prev) => (prev + 1) % screenshots.length)}
        onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
      />

      {/* Download Modal */}
      <DownloadModal
        app={app}
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        whatsappUrl={whatsappUrl}
        onDownloadLogged={() => {
          setApp((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null));
        }}
      />
    </div>
  );
};
