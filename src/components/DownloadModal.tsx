import React, { useState } from 'react';
import { Download, CheckCircle, ShieldCheck, ExternalLink, X, MessageCircle } from 'lucide-react';
import type { Application } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface DownloadModalProps {
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl?: string;
  onDownloadLogged?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  app,
  isOpen,
  onClose,
  whatsappUrl = 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39',
  onDownloadLogged,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  React.useEffect(() => {
    if (isOpen && app) {
      setDownloadUrl(null);
      setError(null);
      setHasTriggered(false);
      startDownload();
    }
  }, [isOpen, app?.id]);

  const startDownload = async () => {
    if (!app) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await api.downloadApp(app.id);
      setDownloadUrl(res.downloadUrl);
      setHasTriggered(true);
      if (onDownloadLogged) onDownloadLogged();

      // Initiate download
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses link unduhan');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header App Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
            <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white leading-tight">{app.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                {app.version}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">{app.size}</span>
            </div>
          </div>
        </div>

        {/* Security verification notice */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-200/90 leading-relaxed">
            <span className="font-bold text-emerald-300">File Aman & Terverifikasi:</span> Bebas dari malware berbahaya, iklan menyusup, dan diverifikasi langsung oleh REY MODDER.
          </div>
        </div>

        {/* Status Area */}
        <div className="py-2 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Menyiapkan link unduhan langsung...</p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
              <p>{error}</p>
              <button
                onClick={startDownload}
                className="mt-2.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-800 hover:bg-red-700 text-white transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : hasTriggered ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>Unduhan dimulai secara otomatis</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Jika unduhan tidak mulai otomatis dalam beberapa detik, silakan klik tombol unduh manual di bawah ini.
              </p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-900/40"
                >
                  <Download className="w-4 h-4" />
                  Unduh Manual Sekarang
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}
            </div>
          ) : null}
        </div>

        {/* WhatsApp Channel Promo Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Jangan Ketinggalan Update!
            </h4>
            <p className="text-[11px] text-slate-400">
              Ikuti saluran WhatsApp resmi untuk notifikasi versi baru & request app.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
          >
            📢 Ikuti Saluran
          </a>
        </div>
      </div>
    </div>
  );
};
