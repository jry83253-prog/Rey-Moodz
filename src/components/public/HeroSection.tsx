import React from 'react';
import { Search, Sparkles, Download, ArrowDown, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import type { PublicConfig } from '../../types/index.ts';

interface HeroSectionProps {
  config: PublicConfig | null;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onExploreClick: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  searchQuery,
  onSearchChange,
  onExploreClick,
  searchInputRef,
}) => {
  const siteName = config?.site_name || 'REY MODDER';
  const tagline = config?.tagline || 'MOD • UPDATE • SHARE';
  const description = config?.description || 'Temukan aplikasi pilihan dalam satu tempat.';
  const whatsappUrl = config?.whatsapp_url || 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39';

  return (
    <div className="relative pt-8 pb-12 sm:pt-16 sm:pb-20 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[25rem] h-[25rem] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6 sm:space-y-8">
        {/* Brand Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{tagline}</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {siteName}
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300" />
            <div className="relative flex items-center bg-slate-950 rounded-2xl border border-slate-800 p-1.5 shadow-2xl">
              <div className="pl-3.5 text-slate-400">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="🔎 Cari aplikasi..."
                className="w-full px-3 py-2.5 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={onExploreClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Jelajahi Aplikasi</span>
            <ArrowDown className="w-4 h-4 stroke-[3]" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <span>📢 Ikuti Saluran WhatsApp</span>
            <ExternalLink className="w-4 h-4 text-emerald-400" />
          </a>
        </div>

        {/* Feature Badges */}
        <div className="pt-6 border-t border-slate-800/60 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">100% Bersih & Aman</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center sm:text-left">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">Update Tercepat</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center sm:text-left">
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Direct Download</span>
          </div>
        </div>
      </div>
    </div>
  );
};
