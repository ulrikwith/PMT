import React, { useState, useEffect } from 'react';
import { Lightbulb, Edit2, Save, X } from 'lucide-react';
import { getDimensionConfig } from '../../constants/taxonomy';

export default function MissionControl({ dimension, onClose }) {
  const [mission, setMission] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const config = getDimensionConfig(dimension);

  // Load mission from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`mission_${dimension}`);
    if (saved) {
      setMission(saved);
    } else {
      setMission('');
    }
  }, [dimension]);

  const handleSave = () => {
    localStorage.setItem(`mission_${dimension}`, mission);
    setIsEditing(false);
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-6 w-96 shadow-2xl border-purple-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/20`}
            >
              <Lightbulb size={18} />
            </div>
            <h3 className="text-lg font-semibold text-white">{config.label} Project Vision</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* North Star Label */}
        <div className="mb-3">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
            North Star Purpose
          </p>
        </div>

        {/* The Mission Statement */}
        <div className="w-full">
          {isEditing ? (
            <div className="animate-in fade-in duration-200">
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder={`What is the core purpose of your ${config.label} work? Why does it matter?`}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-4 text-slate-200 text-base focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                >
                  <Save size={14} /> Save Vision
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="group cursor-pointer relative rounded-lg p-4 hover:bg-white/5 transition-all border border-transparent hover:border-white/10 bg-slate-900/40"
            >
              {mission ? (
                <p className="text-slate-200 text-base font-medium italic leading-relaxed">
                  "{mission}"
                </p>
              ) : (
                <p className="text-slate-500 text-sm italic flex items-center gap-2">
                  <Edit2 size={14} /> Click to define your vision for {config.label}...
                </p>
              )}

              {/* Hover Edit Icon */}
              {mission && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={16} className="text-slate-500" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
