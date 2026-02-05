import React, { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const PHASES = [
  { id: 'concept', label: 'Concept', color: 'text-slate-400', bg: 'bg-slate-500/10', activeBg: 'bg-slate-500/20' },
  { id: 'development', label: 'Development', color: 'text-blue-400', bg: 'bg-blue-500/10', activeBg: 'bg-blue-500/20' },
  { id: 'launch', label: 'Launch', color: 'text-amber-400', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20' },
  { id: 'growth', label: 'Growth', color: 'text-emerald-400', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20' },
  { id: 'maturity', label: 'Maturity', color: 'text-purple-400', bg: 'bg-purple-500/10', activeBg: 'bg-purple-500/20' },
  { id: 'decline', label: 'Decline', color: 'text-orange-400', bg: 'bg-orange-500/10', activeBg: 'bg-orange-500/20' },
  { id: 'sunset', label: 'Sunset', color: 'text-red-400', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20' },
];

export default function PhaseTransition({ currentPhase, onSelect, onClose }) {
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 glass-panel rounded-lg border border-white/10 shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Lifecycle Phase
      </div>
      {PHASES.map((phase, index) => {
        const isCurrent = phase.id === currentPhase;
        return (
          <button
            key={phase.id}
            onClick={() => {
              if (!isCurrent) onSelect(phase.id);
            }}
            disabled={isCurrent}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all ${
              isCurrent
                ? `${phase.activeBg} ${phase.color} font-medium cursor-default`
                : `text-slate-400 hover:text-white hover:bg-white/5`
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? phase.color.replace('text-', 'bg-') : 'bg-slate-600'}`} />
            <span className="flex-1 text-left">{phase.label}</span>
            {index < PHASES.length - 1 && (
              <ChevronRight size={10} className="text-slate-600 flex-shrink-0" />
            )}
            {isCurrent && (
              <span className="text-xs text-slate-600 flex-shrink-0">current</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
