/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  ArrowUpDown,
  Layers,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { Application, Category, PublicConfig, ToastMessage } from './types/index.ts';
import { api, authStorage } from './lib/api.ts';
import { ToastContainer } from './components/Toast.tsx';
import { PublicHeader } from './components/public/PublicHeader.tsx';
import { HeroSection } from './components/public/HeroSection.tsx';
import { CategoryBar } from './components/public/CategoryBar.tsx';
import { AppCard } from './components/AppCard.tsx';
import { AppDetailView } from './components/AppDetailView.tsx';
import { PublicFooter } from './components/public/PublicFooter.tsx';
import { DownloadModal } from './components/DownloadModal.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminLayout } from './components/admin/AdminLayout.tsx';

export default function App() {
  // Navigation & Routing state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'detail' | 'admin'>('home');
  const [selectedAppSlug, setSelectedAppSlug] = useState<string>('');

  // Public data state
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [featuredApps, setFeaturedApps] = useState<Application[]>([]);
  const [totalAppsCount, setTotalAppsCount] = useState(0);
  const [loadingApps, setLoadingApps] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'az' | 'za' | 'popular'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Quick download modal state
  const [quickDownloadApp, setQuickDownloadApp] = useState<Application | null>(null);

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ id: string; username: string } | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Announcement banner dismiss state
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Hero search input ref for auto-focus
  const heroSearchInputRef = useRef<HTMLInputElement>(null);
  const catalogSectionRef = useRef<HTMLDivElement>(null);

  // Toast helper
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Load: Config, Categories, Auth check, and hash-based route parse
  useEffect(() => {
    loadPublicData();
    checkAdminAuth();

    // Parse initial route from URL hash or pathname
    const handleRouteChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const path = window.location.pathname.replace(/^\/+/, '');

      if (hash.startsWith('admin') || path === 'admin') {
        setCurrentRoute('admin');
      } else if (hash.startsWith('app/') || hash.startsWith('apps/')) {
        const slug = hash.split('/')[1];
        if (slug) {
          setSelectedAppSlug(slug);
          setCurrentRoute('detail');
        }
      } else if (path.startsWith('apps/')) {
        const slug = path.split('/')[1];
        if (slug) {
          setSelectedAppSlug(slug);
          setCurrentRoute('detail');
        }
      } else {
        setCurrentRoute('home');
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const loadPublicData = async () => {
    try {
      const [cfg, cats] = await Promise.all([
        api.getConfig(),
        api.getCategories(),
      ]);
      setConfig(cfg);
      setCategories(cats);
    } catch (err: any) {
      console.error('Failed to load initial public data:', err);
    }
  };

  const checkAdminAuth = async () => {
    setIsCheckingAdmin(true);
    try {
      const res = await api.checkAuth();
      if (res.authenticated && res.admin) {
        setAdminUser(res.admin);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  // 2. Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Fetch applications when filters or debounced search changes
  useEffect(() => {
    if (currentRoute === 'home') {
      fetchApplications();
    }
  }, [debouncedSearch, selectedCategory, sortOrder, currentPage, currentRoute]);

  // Also fetch featured apps once
  useEffect(() => {
    api
      .getApps({ featured: true, limit: 6 })
      .then((res) => setFeaturedApps(res.apps))
      .catch((err) => console.error('Failed to fetch featured apps:', err));
  }, []);

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await api.getApps({
        q: debouncedSearch.trim() || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sort: sortOrder,
        page: currentPage,
        limit: 12,
      });
      setApps(res.apps);
      setTotalAppsCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat aplikasi');
    } finally {
      setLoadingApps(false);
    }
  };

  // Route navigation helper
  const navigateTo = (route: 'home' | 'detail' | 'admin', slug?: string) => {
    if (route === 'admin') {
      window.location.hash = '#admin';
      setCurrentRoute('admin');
    } else if (route === 'detail' && slug) {
      window.location.hash = `#app/${slug}`;
      setSelectedAppSlug(slug);
      setCurrentRoute('detail');
    } else {
      window.location.hash = '#';
      setCurrentRoute('home');
      setSelectedAppSlug('');
    }
  };

  const handleSearchFocus = () => {
    navigateTo('home');
    setTimeout(() => {
      heroSearchInputRef.current?.focus();
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAdminLogout = async () => {
    await api.logout();
    setAdminUser(null);
    showToast('info', 'Berhasil keluar dari admin');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ADMIN ROUTE */}
      {currentRoute === 'admin' ? (
        adminUser ? (
          <AdminLayout
            admin={adminUser}
            categories={categories}
            onLogout={handleAdminLogout}
            onViewSite={() => navigateTo('home')}
            onPreviewApp={(slug) => navigateTo('detail', slug)}
            onCategoriesUpdated={() => {
              loadPublicData();
              fetchApplications();
            }}
            onSettingsSaved={() => {
              loadPublicData();
              fetchApplications();
            }}
            onShowToast={showToast}
          />
        ) : (
          <AdminLogin
            onSuccess={(admin) => setAdminUser(admin)}
            onBackToSite={() => navigateTo('home')}
            onShowToast={showToast}
          />
        )
      ) : (
        /* PUBLIC ROUTE */
        <>
          {/* Top Announcement Banner */}
          {config?.announcement_enabled && !bannerDismissed && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 relative">
              <span>{config.announcement_text}</span>
              <a
                href={config.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition ml-1 inline-flex items-center gap-1"
              >
                Gabung Saluran →
              </a>
              <button
                onClick={() => setBannerDismissed(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 p-1"
                aria-label="Tutup Banner"
              >
                ✕
              </button>
            </div>
          )}

          {/* Header */}
          <PublicHeader
            config={config}
            onNavigate={(view) => {
              if (view === 'admin') {
                navigateTo('admin');
              } else if (view === 'categories' || view === 'catalog') {
                navigateTo('home');
                setTimeout(() => {
                  catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                navigateTo('home');
              }
            }}
            onSearchFocus={handleSearchFocus}
            isAdminLoggedIn={Boolean(adminUser)}
          />

          {/* Main Content: Detail View or Home View */}
          <main className="flex-1">
            {currentRoute === 'detail' && selectedAppSlug ? (
              <AppDetailView
                slug={selectedAppSlug}
                onBack={() => navigateTo('home')}
                onSelectApp={(slug) => navigateTo('detail', slug)}
                whatsappUrl={config?.whatsapp_url}
                onShowToast={showToast}
              />
            ) : (
              /* Home View */
              <div className="space-y-12">
                {/* Hero Section */}
                <HeroSection
                  config={config}
                  searchQuery={searchQuery}
                  onSearchChange={(val) => {
                    setSearchQuery(val);
                    if (val && catalogSectionRef.current) {
                      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  onExploreClick={() => {
                    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  searchInputRef={heroSearchInputRef}
                />

                {/* Featured Apps Section */}
                {featuredApps.length > 0 && !debouncedSearch && selectedCategory === 'all' && (
                  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white">Aplikasi Featured</h2>
                          <p className="text-xs text-slate-400">Pilihan terpopuler dan teruji kualitasnya</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {featuredApps.map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(slug) => navigateTo('detail', slug)}
                          onQuickDownload={(a) => setQuickDownloadApp(a)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Main Catalog & Search Results Section */}
                <section
                  ref={catalogSectionRef}
                  id="catalog"
                  className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4"
                >
                  {/* Category Filter Pills */}
                  <CategoryBar
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={(slug) => {
                      setSelectedCategory(slug);
                      setCurrentPage(1);
                    }}
                    totalAllApps={totalAppsCount}
                  />

                  {/* Filter & Sorting Controls Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 pb-2 border-b border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      {debouncedSearch ? (
                        <span>
                          Hasil pencarian untuk <strong className="text-white">"{debouncedSearch}"</strong> ({totalAppsCount} aplikasi)
                        </span>
                      ) : (
                        <span>
                          Menampilkan <strong className="text-white">{apps.length}</strong> dari <strong className="text-white">{totalAppsCount}</strong> aplikasi
                        </span>
                      )}
                    </div>

                    {/* Sorting Select */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Urutkan:
                      </span>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="latest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                        <option value="popular">Terpopuler (Unduhan)</option>
                        <option value="az">Nama A - Z</option>
                        <option value="za">Nama Z - A</option>
                      </select>
                    </div>
                  </div>

                  {/* Application Grid */}
                  {loadingApps ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="h-60 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-5 space-y-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-800 rounded w-3/4" />
                              <div className="h-3 bg-slate-800 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="h-10 bg-slate-800/50 rounded-xl" />
                          <div className="h-8 bg-slate-800/40 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : apps.length === 0 ? (
                    /* Empty State per requirement 8 & 25 */
                    <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4 max-w-md mx-auto my-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">Tidak ada aplikasi yang cocok</h3>
                        <p className="text-xs text-slate-400">
                          {debouncedSearch
                            ? `Tidak ada aplikasi yang sesuai dengan pencarian "${debouncedSearch}". Coba kata kunci lain atau reset filter.`
                            : 'Belum ada aplikasi yang terdaftar di kategori ini.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                      >
                        Reset Pencarian & Kategori
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {apps.map((app) => (
                        <AppCard
                          key={app.id}
                          app={app}
                          onSelect={(slug) => navigateTo('detail', slug)}
                          onQuickDownload={(a) => setQuickDownloadApp(a)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6 pb-4">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition"
                      >
                        ← Sebelumnya
                      </button>

                      <div className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 font-mono">
                        <span>Halaman</span>
                        <strong className="text-emerald-400">{currentPage}</strong>
                        <span>dari</span>
                        <strong className="text-white">{totalPages}</strong>
                      </div>

                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition"
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>

          {/* Footer */}
          <PublicFooter
            config={config}
            onNavigateAdmin={() => navigateTo('admin')}
          />

          {/* Quick Download Modal */}
          <DownloadModal
            app={quickDownloadApp}
            isOpen={Boolean(quickDownloadApp)}
            onClose={() => setQuickDownloadApp(null)}
            whatsappUrl={config?.whatsapp_url}
            onDownloadLogged={() => {
              // Increment count in state if present
              if (quickDownloadApp) {
                setApps((prev) =>
                  prev.map((a) =>
                    a.id === quickDownloadApp.id
                      ? { ...a, downloadCount: a.downloadCount + 1 }
                      : a
                  )
                );
              }
            }}
          />
        </>
      )}
    </div>
  );
}
