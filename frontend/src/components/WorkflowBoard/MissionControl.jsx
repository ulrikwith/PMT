import React, { useState, useEffect } from 'react';
import { Target, Edit2, Save, X, Compass } from 'lucide-react';
import { getDimensionConfig } from '../../constants/taxonomy';

export default function MissionControl({ dimension }) {
  const [mission, setMission] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const config = getDimensionConfig(dimension);

  // Load mission from local storage (or backend later)
  useEffect(() => {
    const saved = localStorage.getItem(`mission_${dimension}`);
    if (saved) setMission(saved);
    else setMission('');
  }, [dimension]);

  const handleSave = () => {
    localStorage.setItem(`mission_${dimension}`, mission);
    setIsEditing(false);
  };

  if (!config) return null;

  return (
    <div className={`
      relative overflow-hidden mb-6 rounded-xl border border-white/5 
      bg-gradient-to-r from-${config.color}-500/5 to-slate-900/50
    `}>
      {/* Decorative background element */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${config.color}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>

      <div className="relative p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        
        {/* Left: Icon & Label */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/20`}>
            <Compass size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {config.label} Vision
            </h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">North Star</p>
          </div>
        </div>

        {/* Right: The Mission Statement */}
        <div className="flex-1 w-full md:w-auto">
          {isEditing ? (
            <div className="animate-in fade-in duration-200">
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder={`What is the core purpose of your ${config.label} work? Why does it matter?`}
                className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-slate-200 text-sm focus:border-blue-500/50 focus:outline-none resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Save size={12} /> Save Vision
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="group cursor-pointer relative rounded-lg p-3 hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
            >
              {mission ? (
                <p className="text-slate-300 text-lg font-medium italic leading-relaxed text-center md:text-left">
                  "{mission}"
                </p>
              ) : (
                <p className="text-slate-500 text-sm italic text-center md:text-left flex items-center gap-2">
                  <Edit2 size={12} /> Click to define the vision for {config.label}...
                </p>
              )}
              
              {/* Hover Edit Icon */}
              {mission && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={14} className="text-slate-500" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
