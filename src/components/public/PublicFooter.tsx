import React from 'react';
import { Shield, ExternalLink, Heart, MessageCircle, ArrowUp } from 'lucide-react';
import type { PublicConfig } from '../../types/index.ts';

interface PublicFooterProps {
  config: PublicConfig | null;
  onNavigateAdmin: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ config, onNavigateAdmin }) => {
  const siteName = config?.site_name || 'REY MODDER';
  const tagline = config?.tagline || 'MOD • UPDATE • SHARE';
  const whatsappUrl = config?.whatsapp_url || 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39';
  const footerText = config?.footer_text || `© ${new Date().getFullYear()} REY MODDER. All rights reserved.`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/60 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand Info */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm">
                RM
              </div>
              <span className="text-xl font-black text-white tracking-tight">{siteName}</span>
            </div>
            <p className="text-xs text-emerald-400 font-mono font-bold tracking-wider uppercase">
              {tagline}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Katalog aplikasi pilihan terkurasi dalam satu tempat. Ringan, cepat, aman, dan bebas malware.
            </p>
          </div>

          {/* WhatsApp CTA Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 space-y-3 max-w-md w-full">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Saluran Resmi WhatsApp
            </div>
            <p className="text-xs text-slate-400">
              Dapatkan informasi versi terbaru dan link download cadangan langsung di ponselmu.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition"
            >
              📢 Ikuti Saluran Sekarang
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Disclaimer:</span> Semua aplikasi yang ditampilkan merupakan konten terkurasi dan dibagikan secara transparan untuk kebutuhan evaluasi dan produktivitas pengguna. REY MODDER tidak membypass proteksi DRM, paywall, atau lisensi aplikasi pihak ketiga.
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">{footerText}</p>

          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateAdmin}
              className="hover:text-emerald-400 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </button>
            <button
              onClick={scrollToTop}
              className="hover:text-white transition flex items-center gap-1"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Ke Atas
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
