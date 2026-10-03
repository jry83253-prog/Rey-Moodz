import React, { useState } from 'react';
import { Shield, Search, Menu, X, ExternalLink, Lock } from 'lucide-react';
import type { PublicConfig } from '../../types/index.ts';

interface PublicHeaderProps {
  config: PublicConfig | null;
  onNavigate: (view: 'home' | 'catalog' | 'categories' | 'admin') => void;
  onSearchFocus: () => void;
  isAdminLoggedIn: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  config,
  onNavigate,
  onSearchFocus,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = config?.site_name || 'REY MODDER';
  const tagline = config?.tagline || 'MOD • UPDATE • SHARE';
  const whatsappUrl = config?.whatsapp_url || 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39';

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 p-[1px] shadow-lg shadow-emerald-950/40 group-hover:shadow-emerald-500/20 transition">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-emerald-400 font-black text-sm tracking-tighter">
              RM
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight group-hover:text-emerald-400 transition">
                {siteName}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">
              {tagline}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-400 transition py-1"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('catalog')}
            className="hover:text-emerald-400 transition py-1"
          >
            Applications
          </button>
          <button
            onClick={() => onNavigate('categories')}
            className="hover:text-emerald-400 transition py-1"
          >
            Categories
          </button>
          <button
            onClick={onSearchFocus}
            className="hover:text-emerald-400 transition py-1 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Search
          </button>
        </nav>

        {/* Right CTA & Admin Shortcut */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 active:scale-95"
          >
            📢 Ikuti Saluran
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>

          <button
            onClick={() => onNavigate('admin')}
            title={isAdminLoggedIn ? 'Buka Admin Panel' : 'Login Admin'}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            {isAdminLoggedIn ? (
              <Shield className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
          >
            📢 Saluran
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 bg-slate-950/95 border-b border-slate-800 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('catalog');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Applications
          </button>
          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg"
          >
            Categories
          </button>
          <button
            onClick={() => {
              onSearchFocus();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-lg flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-slate-400" />
            Search
          </button>
          <button
            onClick={() => {
              onNavigate('admin');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 text-sm font-semibold text-cyan-400 hover:bg-slate-900 rounded-lg flex items-center gap-2 border-t border-slate-800/80 pt-3"
          >
            <Shield className="w-4 h-4" />
            {isAdminLoggedIn ? 'Buka Admin Panel' : 'Login Admin (/admin)'}
          </button>
        </div>
      )}
    </header>
  );
};
