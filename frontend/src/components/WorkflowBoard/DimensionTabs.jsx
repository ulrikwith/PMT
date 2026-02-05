import React from 'react';
import { DIMENSIONS } from '../../constants/taxonomy';

// Static Tailwind class maps — dynamic interpolation doesn't work with JIT
const dimTabClasses = {
  blue: {
    active: 'bg-blue-500/10 border-2 border-blue-500/30 text-blue-500',
    inactive: 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20',
  },
  emerald: {
    active: 'bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500',
    inactive: 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20',
  },
  pink: {
    active: 'bg-pink-500/10 border-2 border-pink-500/30 text-pink-500',
    inactive: 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20',
  },
  amber: {
    active: 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-500',
    inactive: 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20',
  },
  purple: {
    active: 'bg-purple-500/10 border-2 border-purple-500/30 text-purple-500',
    inactive: 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20',
  },
};

export default function DimensionTabs({ activeDimension, onDimensionChange }) {
  return (
    <div className="glass-panel border-b border-white/5 px-6 py-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const isActive = activeDimension === dim.id;
          const classes = dimTabClasses[dim.color] || dimTabClasses.blue;

          return (
            <button
              key={dim.id}
              onClick={() => onDimensionChange(dim.id)}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive ? classes.active : classes.inactive
              }`}
            >
              <Icon size={16} />
              {dim.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
