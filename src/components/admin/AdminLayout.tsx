import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  User,
  Plus,
} from 'lucide-react';
import type { Category } from '../../types/index.ts';
import { AdminDashboard } from './AdminDashboard.tsx';
import { AdminAppManagement } from './AdminAppManagement.tsx';
import { AdminCategoryManagement } from './AdminCategoryManagement.tsx';
import { AdminSettings } from './AdminSettings.tsx';
import { AdminAppModal } from './AdminAppModal.tsx';

interface AdminLayoutProps {
  admin: { id: string; username: string };
  categories: Category[];
  onLogout: () => void;
  onViewSite: () => void;
  onPreviewApp: (slug: string) => void;
  onCategoriesUpdated: () => void;
  onSettingsSaved: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  categories,
  onLogout,
  onViewSite,
  onPreviewApp,
  onCategoriesUpdated,
  onSettingsSaved,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apps' | 'categories' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apps', label: 'Aplikasi', icon: Package },
    { id: 'categories', label: 'Kategori', icon: Layers },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800/80 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
              RM
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight block leading-tight">
                REY MODDER
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                ADMIN PANEL
              </span>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => setAddModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Tambah Aplikasi
          </button>

          {/* Nav Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">{admin.username}</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Online • Session OK</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewSite}
              className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1 border border-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </button>
            <button
              onClick={onLogout}
              className="py-2 px-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-xs font-medium transition flex items-center justify-center gap-1 border border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-white text-sm">REY MODDER Admin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewSite}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
            title="Buka Website Publik"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-red-950/50 text-red-400"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                    RM
                  </div>
                  <span className="font-bold text-white text-sm">REY MODDER</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAddModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Tambah Aplikasi
              </button>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-xs text-slate-400">
                Login sebagai: <span className="font-bold text-white">{admin.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2 rounded-xl bg-red-950/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl overflow-y-auto">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            onNavigateTab={setActiveTab}
            onOpenAddApp={() => setAddModalOpen(true)}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'apps' && (
          <AdminAppManagement
            categories={categories}
            onShowToast={onShowToast}
            onPreviewApp={onPreviewApp}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategoryManagement
            onShowToast={onShowToast}
            onCategoriesUpdated={onCategoriesUpdated}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings
            onShowToast={onShowToast}
            onSettingsSaved={onSettingsSaved}
          />
        )}
      </main>

      {/* Global Add Application Modal */}
      <AdminAppModal
        isOpen={addModalOpen}
        appToEdit={null}
        categories={categories}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          setActiveTab('apps');
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
