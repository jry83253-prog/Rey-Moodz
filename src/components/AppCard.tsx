import React from 'react';
import { Download, Sparkles, HardDrive, Calendar, ArrowRight } from 'lucide-react';
import type { Application } from '../types/index.ts';

interface AppCardProps {
  app: Application;
  onSelect: (slug: string) => void;
  onQuickDownload?: (app: Application) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onSelect, onQuickDownload }) => {
  const isFeatured = Boolean(app.featured);

  // Format date helper
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(app.updatedAt || app.createdAt);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Baru diperbarui';
    }
  }, [app.updatedAt, app.createdAt]);

  return (
    <div
      onClick={() => onSelect(app.slug)}
      className={`group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer overflow-hidden border ${
        isFeatured
          ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20 hover:border-emerald-400 hover:shadow-emerald-500/10'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800/90 text-cyan-400 border border-slate-700/60">
            {app.categoryName || 'App'}
          </span>

          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              FEATURED
            </span>
          )}
        </div>

        {/* Logo and Title */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-md group-hover:scale-105 transition-transform duration-300">
            <img
              src={app.iconUrl}
              alt={app.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Fallback placeholder image
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
              {app.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {app.description}
            </p>
          </div>
        </div>

        {/* Specs Pills: Version, Size, Date */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="truncate">{app.version}</span>
          </div>

          <div className="flex items-center justify-end gap-1 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>{app.size}</span>
          </div>

          <div className="col-span-2 flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 text-emerald-400/80 font-mono">
              <Download className="w-3 h-3" />
              {app.downloadCount.toLocaleString('id-ID')} unduhan
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(app.slug);
          }}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 border border-slate-700/60"
        >
          Lihat Detail
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {onQuickDownload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickDownload(app);
            }}
            title="Download Langsung"
            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition flex items-center justify-center shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
