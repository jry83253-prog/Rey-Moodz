import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api.ts';

interface AdminLoginProps {
  onSuccess: (admin: { id: string; username: string }) => void;
  onBackToSite: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToSite, onShowToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await api.login(username.trim(), password);
      onShowToast('success', `Selamat datang kembali, ${data.admin.username}!`);
      onSuccess(data.admin);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal');
      onShowToast('error', err.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <button
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Website Publik
        </button>

        {/* Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">REY MODDER Admin</h1>
            <p className="text-xs text-slate-400">Masuk untuk mengelola katalog aplikasi & website</p>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3.5 mb-6 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-medium leading-relaxed animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="adminrey"
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-500">Default: adminrey</span>
              <button
                type="button"
                onClick={() => {
                  setUsername('adminrey');
                  setPassword('adminreykece');
                }}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
              >
                Gunakan Kredensial Default
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            Sesi diamankan dengan HTTP-only cookie, token bertanda tangan kriptografis, dan perlindungan anti brute-force.
          </div>
        </div>
      </div>
    </div>
  );
};
