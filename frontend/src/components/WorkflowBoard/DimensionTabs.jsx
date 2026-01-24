import React from 'react';
import { DIMENSIONS } from '../../constants/taxonomy';

export default function DimensionTabs({ activeDimension, onDimensionChange }) {
  return (
    <div className="glass-panel border-b border-white/5 px-6 py-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const isActive = activeDimension === dim.id;

          return (
            <button
              key={dim.id}
              onClick={() => onDimensionChange(dim.id)}
              className={`
                px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap
                ${
                  isActive
                    ? `bg-${dim.color}-500/10 border-2 border-${dim.color}-500/30 text-${dim.color}-500`
                    : 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }
              `}
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
