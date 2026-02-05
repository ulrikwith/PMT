import React, { useState, useEffect, useRef } from 'react';
import {
  Lightbulb, Edit2, Save, X, ChevronRight, ChevronLeft, Download, Upload,
  Book, FileText, Mail, Gem, Globe, Video, Brain, Dumbbell, BookOpen,
  PenTool, Target, Network, Search, GraduationCap, Users, UserCheck,
  Calendar, MessageCircle, Share2, TrendingUp, Handshake, Send,
  DollarSign, Settings, Map, Shield
} from 'lucide-react';
import { getDimensionConfig } from '../../constants/taxonomy';
import {
  getVisionConfig,
  exportVisionData as exportLocalVisionData,
  importVisionData as importLocalVisionData
} from '../../constants/visionConfig';
import { useVision } from '../../context/VisionContext';

// Icon mapping
const iconMap = {
  Book, FileText, Mail, Gem, Globe, Video, Brain, Dumbbell, BookOpen,
  PenTool, Target, Network, Search, GraduationCap, Users, UserCheck,
  Calendar, MessageCircle, Share2, TrendingUp, Handshake, Send,
  DollarSign, Settings, Map, Shield
};

// Static Tailwind class mappings - dynamic interpolation doesn't work with Tailwind's JIT compiler
const dimensionColorClasses = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-500',    border: 'border-blue-500/20',    hoverBg: 'group-hover:bg-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', hoverBg: 'group-hover:bg-emerald-500/20' },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-500',    border: 'border-pink-500/20',    hoverBg: 'group-hover:bg-pink-500/20' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20',   hoverBg: 'group-hover:bg-amber-500/20' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-500',  border: 'border-purple-500/20',  hoverBg: 'group-hover:bg-purple-500/20' },
};

export default function MissionControl({ dimension, onClose }) {
  const [view, setView] = useState('overview'); // 'overview' | 'element'
  const [selectedElement, setSelectedElement] = useState(null);
  const [overallVision, setOverallVision] = useState('');
  const [elementData, setElementData] = useState({ innerGoals: '', outerGoals: '' });
  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [isEditingInner, setIsEditingInner] = useState(false);
  const [isEditingOuter, setIsEditingOuter] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);

  const config = getDimensionConfig(dimension);
  const visionConfig = getVisionConfig(dimension);
  const { getVision, saveVision, visions, loading: visionLoading } = useVision();
  const colorClasses = dimensionColorClasses[config?.color] || dimensionColorClasses.purple;

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  };

  // Load data on mount and dimension change
  useEffect(() => {
    if (visionConfig && !visionLoading) {
      const data = getVision(dimension);
      setOverallVision(data.overall || '');
    }
  }, [dimension, visionConfig, visionLoading, getVision]);

  // Load element data when element is selected
  useEffect(() => {
    if (selectedElement && visionConfig && !visionLoading) {
      const data = getVision(dimension, selectedElement.id);
      setElementData(data);
    }
  }, [selectedElement, dimension, visionConfig, visionLoading, getVision]);

  const handleSaveOverall = async () => {
    try {
      await saveVision(dimension, { overall: overallVision });
      setIsEditingOverall(false);
    } catch (error) {
      showFeedback('error', `Failed to save vision: ${error.message}`);
    }
  };

  const handleSaveElement = async () => {
    try {
      await saveVision(dimension, elementData, selectedElement.id);
      setIsEditingInner(false);
      setIsEditingOuter(false);
    } catch (error) {
      showFeedback('error', `Failed to save vision: ${error.message}`);
    }
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
    setView('element');
  };

  const handleBack = () => {
    setView('overview');
    setSelectedElement(null);
    setIsEditingInner(false);
    setIsEditingOuter(false);
  };

  const handleExport = () => {
    // Export current visions from context
    const data = visions;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // Import all dimensions
          for (const dim of Object.keys(data)) {
            const dimData = data[dim];

            // Save overall vision
            if (dimData.overall) {
              await saveVision(dim, { overall: dimData.overall });
            }

            // Save element visions
            if (dimData.elements) {
              for (const elemId of Object.keys(dimData.elements)) {
                const elemData = dimData.elements[elemId];
                await saveVision(dim, elemData, elemId);
              }
            }
          }

          // Reload current view
          const reloadedData = getVision(dimension);
          setOverallVision(reloadedData.overall || '');
          if (selectedElement) {
            const elementReloaded = getVision(dimension, selectedElement.id);
            setElementData(elementReloaded);
          }

          showFeedback('success', 'Vision data imported successfully!');
        } catch (error) {
          console.error('Import error:', error);
          showFeedback('error', 'Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!config || !visionConfig) return null;

  const IconComponent = iconMap[selectedElement?.icon] || Lightbulb;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-panel rounded-2xl p-6 w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl border-purple-500/20 animate-in fade-in slide-in-from-right-2 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/95 backdrop-blur-sm pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {view === 'element' && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
              {view === 'element' ? <IconComponent size={18} /> : <Lightbulb size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {view === 'element' ? selectedElement.label : `${config.label} Vision`}
              </h3>
              {view === 'overview' && (
                <p className="text-xs text-slate-400 mt-0.5">{visionConfig.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'overview' && (
              <>
                <button
                  onClick={handleExport}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                  title="Export vision data"
                >
                  <Download size={16} />
                </button>
                <label className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer" title="Import vision data">
                  <Upload size={16} />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium animate-in fade-in duration-200 ${
            feedback.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Overview View */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* Overall North Star */}
            <div>
              <div className="mb-3">
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                  North Star Purpose
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {visionConfig.overallVision.prompt}
                </p>
              </div>

              {isEditingOverall ? (
                <div className="animate-in fade-in duration-200">
                  <textarea
                    value={overallVision}
                    onChange={(e) => setOverallVision(e.target.value)}
                    placeholder={visionConfig.overallVision.placeholder}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-4 text-slate-200 text-base focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setIsEditingOverall(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveOverall}
                      className="px-4 py-2 text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingOverall(true)}
                  className="group cursor-pointer relative rounded-lg p-4 hover:bg-white/5 transition-all border border-transparent hover:border-white/10 bg-slate-900/40"
                >
                  {overallVision ? (
                    <p className="text-slate-200 text-base font-medium italic leading-relaxed">
                      "{overallVision}"
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic flex items-center gap-2">
                      <Edit2 size={14} /> Click to define your overall vision...
                    </p>
                  )}
                  {overallVision && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={16} className="text-slate-500" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Elements Grid */}
            <div>
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Tactical Elements
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click each element to define specific inner and outer goals
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visionConfig.elements.map((element) => {
                  const ElementIcon = iconMap[element.icon] || Lightbulb;
                  const data = getVision(dimension, element.id);
                  const hasData = data.innerGoals || data.outerGoals;

                  return (
                    <button
                      key={element.id}
                      onClick={() => handleElementClick(element)}
                      className="group relative p-4 rounded-lg bg-slate-900/40 border border-white/10 hover:border-purple-500/30 hover:bg-slate-800/60 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} ${colorClasses.hoverBg} transition-colors`}>
                          <ElementIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            {element.label}
                            {hasData && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Has vision data" />
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {element.description}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Element Detail View */}
        {view === 'element' && selectedElement && (
          <div className="space-y-6">
            {/* Element Description */}
            <div className="bg-slate-900/40 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-slate-300">{selectedElement.description}</p>
            </div>

            {/* Inner Goals */}
            <div>
              <div className="mb-3">
                <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">
                  {selectedElement.prompts.innerGoals.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedElement.prompts.innerGoals.description}
                </p>
              </div>

              {isEditingInner ? (
                <div className="animate-in fade-in duration-200">
                  <textarea
                    value={elementData.innerGoals}
                    onChange={(e) => setElementData({ ...elementData, innerGoals: e.target.value })}
                    placeholder={selectedElement.prompts.innerGoals.placeholder}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-4 text-slate-200 text-sm focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                    rows={5}
                    autoFocus
                  />

                  {/* Examples */}
                  <div className="mt-3 p-3 bg-slate-900/40 rounded-lg border border-white/5">
                    <p className="text-xs text-slate-400 font-medium mb-2">Examples:</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      {selectedElement.prompts.innerGoals.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setIsEditingInner(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveElement}
                      className="px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingInner(true)}
                  className="group cursor-pointer relative rounded-lg p-4 hover:bg-white/5 transition-all border border-transparent hover:border-white/10 bg-slate-900/40"
                >
                  {elementData.innerGoals ? (
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {elementData.innerGoals}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic flex items-center gap-2">
                      <Edit2 size={14} /> Click to define inner goals...
                    </p>
                  )}
                  {elementData.innerGoals && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={16} className="text-slate-500" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Outer Goals */}
            <div>
              <div className="mb-3">
                <p className="text-xs text-orange-400 font-medium uppercase tracking-wider">
                  {selectedElement.prompts.outerGoals.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedElement.prompts.outerGoals.description}
                </p>
              </div>

              {isEditingOuter ? (
                <div className="animate-in fade-in duration-200">
                  <textarea
                    value={elementData.outerGoals}
                    onChange={(e) => setElementData({ ...elementData, outerGoals: e.target.value })}
                    placeholder={selectedElement.prompts.outerGoals.placeholder}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-4 text-slate-200 text-sm focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all resize-none"
                    rows={5}
                    autoFocus
                  />

                  {/* Examples */}
                  <div className="mt-3 p-3 bg-slate-900/40 rounded-lg border border-white/5">
                    <p className="text-xs text-slate-400 font-medium mb-2">Examples:</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      {selectedElement.prompts.outerGoals.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setIsEditingOuter(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveElement}
                      className="px-4 py-2 text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-2"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingOuter(true)}
                  className="group cursor-pointer relative rounded-lg p-4 hover:bg-white/5 transition-all border border-transparent hover:border-white/10 bg-slate-900/40"
                >
                  {elementData.outerGoals ? (
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {elementData.outerGoals}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic flex items-center gap-2">
                      <Edit2 size={14} /> Click to define outer goals...
                    </p>
                  )}
                  {elementData.outerGoals && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={16} className="text-slate-500" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save All Button */}
            {(elementData.innerGoals || elementData.outerGoals) && !isEditingInner && !isEditingOuter && (
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft size={14} /> Back to Overview
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
