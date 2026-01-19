import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowLeftRight, Lock } from 'lucide-react';

const CONNECTION_TYPES = [
  {
    id: 'feeds-into',
    icon: ArrowRight,
    label: 'Feeds Into',
    color: '#3B82F6',
    description: 'This Work flows into the connected Work',
  },
  {
    id: 'comes-from',
    icon: ArrowLeft,
    label: 'Comes From',
    color: '#10B981',
    description: 'This Work is built from the connected Work',
  },
  {
    id: 'related-to',
    icon: ArrowLeftRight,
    label: 'Related To',
    color: '#8B5CF6',
    description: 'Bidirectional relationship',
  },
  {
    id: 'blocks',
    icon: Lock,
    label: 'Blocks',
    color: '#F59E0B',
    description: 'This Work blocks the other from proceeding',
  },
];

export default function ConnectionModal({ connection, onConfirm, onCancel }) {
  const [selectedType, setSelectedType] = useState('feeds-into');
  const [label, setLabel] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Define Connection</h2>
        <p className="text-sm text-slate-400 mb-6">
          How do these Works relate to each other?
        </p>

        {/* Connection Type Selection */}
        <div className="space-y-3 mb-6">
          {CONNECTION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full glass-panel rounded-lg p-4 border-2 transition-all text-left ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}20`, border: `1px solid ${type.color}40` }}
                  >
                    <Icon size={20} style={{ color: type.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{type.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Label */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Connection Label (Optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            placeholder="e.g., 'in 2-3 weeks'"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedType, label)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          >
            Create Connection
          </button>
        </div>
      </div>
    </div>
  );
}
