import React from 'react';
import type { Category } from '../../types/index.ts';
import { DynamicIcon } from '../DynamicIcon.tsx';
import { Layers } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  totalAllApps: number;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalAllApps,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Kategori Aplikasi
        </h3>
        <span className="text-[11px] text-slate-500">Pilih kategori untuk filter</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* 'Semua' virtual option */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition border ${
            selectedCategory === 'all'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/30'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span>Semua</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              selectedCategory === 'all'
                ? 'bg-slate-950 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalAllApps}
          </span>
        </button>

        {/* Dynamic categories from database */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition border ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/30 font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <DynamicIcon
                name={cat.icon}
                className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`}
              />
              <span>{cat.name}</span>
              {typeof cat.appCount === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.appCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
