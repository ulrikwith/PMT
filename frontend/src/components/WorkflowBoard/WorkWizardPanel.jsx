import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Wrench, Users, BookOpen, Calendar } from 'lucide-react';
import { DIMENSIONS, getDimensionConfig } from '../../constants/taxonomy';
import { useTasks } from '../../context/TasksContext';

export default function WorkWizardPanel({ node, onClose, onSave }) {
  // If node is null, don't render (handled by parent conditional usually)
  if (!node) return null;

  const { allTools } = useTasks();
  const [step, setStep] = useState(1);
  const [newTool, setNewTool] = useState(''); // Controlled input for new tool
  const [workData, setWorkData] = useState({
    label: node.data.label !== 'New Work' ? node.data.label : '',
    description: node.data.description || '',
    element: '', // Will be set in useEffect
    dimension: node.data.dimension || '',
    workType: node.data.workType || 'part-of-element',
    targetOutcome: node.data.targetOutcome || '',
    startDate: '', // Will be set in useEffect
    targetCompletion: '', // Will be set in useEffect
    activities: node.data.activities || [],
    resources: {
      timeEstimate: node.data.resources?.timeEstimate || '',
      energyLevel: node.data.resources?.energyLevel || 'focused',
      tools: node.data.resources?.tools || [],
      materials: node.data.resources?.materials || '',
      people: node.data.resources?.people || [],
      notes: node.data.resources?.notes || '',
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Reset state when node changes
  useEffect(() => {
    // 1. Try to load from localStorage first (Draft Persistence)
    const draftKey = `pmt_draft_${node.id}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setWorkData(parsed);
        // Don't reset step/tool if we found a draft, assume user wants to continue
        // But we might want to reset step if it's undefined in draft? 
        // For now, let's just restore workData and reset step to 1 to be safe, 
        // or we could save step in draft too. Let's keep step 1 for simplicity unless requested.
        setStep(1); 
        setNewTool('');
        return; 
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }

    setStep(1);
    setNewTool(''); // Reset tool input

    // Case-insensitive element matching
    const dimConfig = getDimensionConfig(node.data.dimension);
    const dimElements = dimConfig ? dimConfig.elements.map((e) => e.label) : []; // Use labels for matching/display

    const rawElement = node.data.element || '';
    // Try to find matching label case-insensitively
    const matchedElement =
      dimElements.find((e) => e.toLowerCase() === rawElement.toLowerCase()) || rawElement;

    setWorkData({
      label: node.data.label !== 'New Work' ? node.data.label : '',
      description: node.data.description || '',
      element: matchedElement,
      dimension: node.data.dimension || '',
      workType: node.data.workType || 'part-of-element',
      targetOutcome: node.data.targetOutcome || '',
      startDate: formatDate(node.data.startDate),
      targetCompletion: formatDate(node.data.targetCompletion || node.data.dueDate), // Handle both potential field names
      activities: node.data.activities || [],
      resources: {
        timeEstimate: node.data.resources?.timeEstimate || '',
        energyLevel: node.data.resources?.energyLevel || 'focused',
        tools: node.data.resources?.tools || [],
        materials: node.data.resources?.materials || '',
        people: node.data.resources?.people || [],
        notes: node.data.resources?.notes || '',
      },
    });
  }, [node.id]);

  // Save draft to localStorage whenever workData changes
  useEffect(() => {
    if (node.id) {
      localStorage.setItem(`pmt_draft_${node.id}`, JSON.stringify(workData));
    }
  }, [workData, node.id]);

  // Sync Total Hours when activities change
  useEffect(() => {
    const total = workData.activities.reduce(
      (sum, act) => sum + (parseFloat(act.timeEstimate) || 0),
      0
    );
    if (parseFloat(workData.resources.timeEstimate) !== total) {
      setWorkData((prev) => ({
        ...prev,
        resources: { ...prev.resources, timeEstimate: total.toString() },
      }));
    }
  }, [workData.activities]);

  const handleSave = () => {
    // Check for pending tool input
    let finalTools = [...workData.resources.tools];
    if (newTool.trim() && !finalTools.includes(newTool.trim())) {
      finalTools.push(newTool.trim());
    }

    // If saving 'New Work' with no name, default it
    const finalLabel = workData.label.trim() || 'New Work';

    onSave({
      ...workData,
      label: finalLabel,
      status: finalLabel !== 'New Work' ? 'in-progress' : 'empty',
      resources: {
        ...workData.resources,
        tools: finalTools,
      },
    });
    
    // Clear draft on successful save
    localStorage.removeItem(`pmt_draft_${node.id}`);
  };

  const getElements = (dimId) => {
    const config = getDimensionConfig(dimId);
    return config ? config.elements.map((e) => e.label) : [];
  };

  // Filter out tools already selected
  const suggestedTools = allTools.filter((t) => !workData.resources.tools.includes(t));

  return (
    <div className="absolute top-0 right-0 w-[480px] h-full glass-panel border-l border-white/5 shadow-2xl transform translate-x-0 transition-transform duration-300 flex flex-col z-50 bg-slate-950/90 backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {node.data.status === 'empty' ? 'Define Project' : 'Edit Project'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Step {step} of 4</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${
                s <= step ? 'bg-blue-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium">
          <span className={step >= 1 ? 'text-blue-500' : 'text-slate-500'}>Define</span>
          <span className={step >= 2 ? 'text-blue-500' : 'text-slate-500'}>Activities</span>
          <span className={step >= 3 ? 'text-blue-500' : 'text-slate-500'}>Resources</span>
          <span className={step >= 4 ? 'text-blue-500' : 'text-slate-500'}>Review</span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* STEP 1: Define Work */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={workData.label}
                onChange={(e) => setWorkData({ ...workData, label: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="e.g., Chapter 12: The Body as Classroom"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={workData.description}
                onChange={(e) => setWorkData({ ...workData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                rows={3}
                placeholder="What is this Project about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {workData.dimension.charAt(0).toUpperCase() + workData.dimension.slice(1)} Type
              </label>
              <div className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white">
                {workData.element || 'Not set'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Activities */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Activities</h3>
              <button
                onClick={() => {
                  setWorkData({
                    ...workData,
                    activities: [
                      ...workData.activities,
                      {
                        id: Date.now(),
                        title: '',
                        startDate: '',
                        endDate: '',
                        timeEstimate: '',
                        energyLevel: 'focused',
                        status: 'todo',
                      },
                    ],
                  });
                }}
                className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {workData.activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 rounded-xl p-4 shadow-lg"
                >
                  {/* Row 1: Number + Title + Delete Button */}
                  <div className="flex items-start gap-2.5 mb-4">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-800/80 border border-slate-700/50 text-slate-400 font-medium text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={activity.title}
                      onChange={(e) => {
                        const updated = [...workData.activities];
                        updated[index].title = e.target.value;
                        setWorkData({ ...workData, activities: updated });
                      }}
                      className="flex-1 bg-transparent border-none text-slate-400 focus:outline-none placeholder-slate-600 text-sm font-normal py-0.5"
                      placeholder="Activity name..."
                      autoFocus={!activity.title}
                    />
                    <button
                      onClick={() => {
                        setWorkData({
                          ...workData,
                          activities: workData.activities.filter((_, i) => i !== index),
                        });
                      }}
                      className="p-1 text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Row 2: Dates */}
                  <div className="mb-3">
                    <div className="flex gap-2.5">
                      <div className="flex-1">
                        <label className="text-xs text-slate-400 font-medium mb-1.5 block text-center">
                          Start
                        </label>
                        <input
                          type="date"
                          value={activity.startDate || ''}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].startDate = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-400 font-medium mb-1.5 block text-center">
                          End
                        </label>
                        <input
                          type="date"
                          value={activity.endDate || ''}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].endDate = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Hours, Status, Effort */}
                  <div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Hours */}
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5 text-center">
                          Hours
                        </label>
                        <input
                          type="number"
                          value={activity.timeEstimate}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].timeEstimate = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-md px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 font-medium"
                          placeholder="0"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5 text-center">
                          Status
                        </label>
                        <select
                          value={activity.status}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].status = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-md px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      {/* Effort */}
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5 text-center">
                          Effort
                        </label>
                        <select
                          value={activity.energyLevel || 'focused'}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].energyLevel = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-full bg-slate-800/40 border border-slate-700/60 rounded-md px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                        >
                          <option value="deep">Deep</option>
                          <option value="focused">Focus</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {workData.activities.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No activities yet. Click "Add Activity" to start.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Resources */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-semibold text-white">Resources Needed</h3>

            {/* Time & Energy */}
            <div className="glass-panel rounded-xl p-5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-blue-500" size={20} />
                <h4 className="text-sm font-semibold text-white">Time & Energy</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Total Hours (Auto-calculated)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={workData.resources.timeEstimate}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-slate-400 focus:outline-none cursor-not-allowed font-semibold"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      h
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Energy Level
                  </label>
                  <select
                    value={workData.resources.energyLevel}
                    onChange={(e) =>
                      setWorkData({
                        ...workData,
                        resources: { ...workData.resources, energyLevel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="deep">Deep work</option>
                    <option value="focused">Focused work</option>
                    <option value="light">Light work</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="glass-panel rounded-xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="text-purple-500" size={20} />
                <h4 className="text-sm font-semibold text-white">Tools & Software</h4>
              </div>

              {/* Suggested Tools */}
              {suggestedTools.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">
                    Suggested
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTools.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setWorkData({
                            ...workData,
                            resources: {
                              ...workData.resources,
                              tools: [...workData.resources.tools, t],
                            },
                          })
                        }
                        className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-purple-500/50 hover:text-purple-400 rounded text-xs text-slate-400 transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {workData.resources.tools?.map((tool, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-500 flex items-center gap-2"
                    >
                      {tool}
                      <button
                        onClick={() => {
                          const updated = workData.resources.tools.filter((_, i) => i !== index);
                          setWorkData({
                            ...workData,
                            resources: { ...workData.resources, tools: updated },
                          });
                        }}
                      >
                        <X size={12} className="cursor-pointer hover:text-purple-300" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTool.trim()) {
                      setWorkData({
                        ...workData,
                        resources: {
                          ...workData.resources,
                          tools: [...(workData.resources.tools || []), newTool.trim()],
                        },
                      });
                      setNewTool('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                  placeholder="Type tool name and press Enter..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-semibold text-white">Review Project</h3>

            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Project Name
                </div>
                <div className="text-white font-semibold">{workData.label || 'Untitled'}</div>
              </div>

              {workData.description && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </div>
                  <div className="text-slate-300 text-sm">{workData.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Element
                  </div>
                  <div className="text-white">{workData.element || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Activity Count
                  </div>
                  <div className="text-white">{workData.activities.length} activities</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                Clicking "Save" will update the Project node on the canvas and create{' '}
                {workData.activities.length} activity child nodes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-white/5 flex justify-between bg-slate-900/50">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else onClose();
          }}
          className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all"
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !workData.label.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
          >
            Save Project ✓
          </button>
        )}
      </div>
    </div>
  );
}
