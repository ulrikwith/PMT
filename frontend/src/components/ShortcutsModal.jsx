import React, { useEffect } from 'react';
import { X, Command, Search, Plus, Calendar, Target, Layout } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Command size={18} className="text-blue-500" />
            Keyboard Shortcuts
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <ShortcutRow 
            keys={['Cmd', 'K']} 
            description="Focus Search" 
            icon={<Search size={14} />} 
          />
          <ShortcutRow 
            keys={['Cmd', '/']} 
            description="Show Shortcuts" 
            icon={<Command size={14} />} 
          />
          <div className="h-px bg-white/5 my-2"></div>
          <ShortcutRow 
            keys={['Cmd', 'Shift', 'L']} 
            description="Go to Timeline" 
            icon={<Calendar size={14} />} 
          />
          <ShortcutRow 
            keys={['Cmd', 'Shift', 'R']} 
            description="Go to Readiness" 
            icon={<Target size={14} />} 
          />
           <ShortcutRow 
            keys={['Cmd', 'Shift', 'T']} 
            description="Go to Tasks" 
            icon={<Layout size={14} />} 
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/50 text-center text-xs text-slate-500 border-t border-white/5">
          Press <kbd className="font-mono bg-slate-800 px-1 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description, icon }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3 text-slate-300">
        <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
            {icon}
        </div>
        <span>{description}</span>
      </div>
      <div className="flex gap-1.5">
        {keys.map(k => (
          <kbd key={k} className="min-w-[24px] px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-800 border-b-2 border-slate-700 rounded-md">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
