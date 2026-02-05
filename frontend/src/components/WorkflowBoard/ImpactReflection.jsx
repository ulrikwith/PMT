import React, { useState } from 'react';
import { X, Sparkles, Globe, Eye, Heart, RotateCcw, Save } from 'lucide-react';

const ALIVENESS_LABELS = ['Drained', 'Low', 'Neutral', 'Alive', 'On Fire'];

export default function ImpactReflection({ task, onSave, onDismiss }) {
  const [reflection, setReflection] = useState({
    innerShift: '',
    outerReach: '',
    visionConnection: '',
    alivenessLevel: 3,
    wouldRepeat: null,
  });

  const visionOrigin = task?.visionOrigin;

  const handleSave = () => {
    onSave({
      ...reflection,
      reflectedAt: new Date().toISOString(),
    });
  };

  const isValid = reflection.innerShift.trim() || reflection.outerReach.trim();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" />
              Reflect on Impact
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              "{task?.label}" is complete. Take a moment to reflect.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Skip reflection"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vision Context (if task originated from exploration) */}
          {visionOrigin?.crystallizationStatement && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-medium text-amber-400 mb-1">
                Vision Origin: {visionOrigin.visionTitle}
              </p>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{visionOrigin.crystallizationStatement.slice(0, 200)}
                {visionOrigin.crystallizationStatement.length > 200 ? '...' : ''}"
              </p>
            </div>
          )}

          {/* Inner Shift */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Heart size={16} className="text-pink-400" />
              What shifted in you?
            </label>
            <textarea
              value={reflection.innerShift}
              onChange={(e) => setReflection(prev => ({ ...prev, innerShift: e.target.value }))}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 text-sm leading-relaxed focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all resize-none min-h-[100px]"
              placeholder="How did this work change you? What did you learn about yourself?"
            />
          </div>

          {/* Outer Reach */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Globe size={16} className="text-blue-400" />
              What did this put into the world?
            </label>
            <textarea
              value={reflection.outerReach}
              onChange={(e) => setReflection(prev => ({ ...prev, outerReach: e.target.value }))}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 text-sm leading-relaxed focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none min-h-[100px]"
              placeholder="What impact did this work have? Who did it reach or serve?"
            />
          </div>

          {/* Vision Connection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Eye size={16} className="text-emerald-400" />
              How does this connect to your vision?
            </label>
            <textarea
              value={reflection.visionConnection}
              onChange={(e) => setReflection(prev => ({ ...prev, visionConnection: e.target.value }))}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 text-sm leading-relaxed focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all resize-none min-h-[80px]"
              placeholder={visionOrigin
                ? "How did this work serve the vision it came from?"
                : "Does this work connect to a larger purpose?"
              }
            />
          </div>

          {/* Aliveness Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <Sparkles size={16} className="text-amber-400" />
              Aliveness level
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setReflection(prev => ({ ...prev, alivenessLevel: level }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    reflection.alivenessLevel === level
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {ALIVENESS_LABELS[level - 1]}
                </button>
              ))}
            </div>
          </div>

          {/* Would Repeat */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <RotateCcw size={16} className="text-indigo-400" />
              Would you do this again?
            </label>
            <div className="flex items-center gap-2">
              {[
                { value: 'yes', label: 'Yes, gladly' },
                { value: 'with-changes', label: 'With changes' },
                { value: 'no', label: 'No' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setReflection(prev => ({ ...prev, wouldRepeat: option.value }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    reflection.wouldRepeat === option.value
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onDismiss}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save Reflection
          </button>
        </div>
      </div>
    </div>
  );
}
