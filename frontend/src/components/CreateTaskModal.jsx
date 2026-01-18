import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowRight, ArrowLeft, Calendar, Tag, Layers, FileText } from 'lucide-react';
import TagSelector from './TagSelector';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Placement', icon: Layers, description: 'Select Dimension' },
  { id: 2, title: 'Tagging', icon: Tag, description: 'Add Tags' },
  { id: 3, title: 'Details', icon: FileText, description: 'Resources & Info' },
  { id: 4, title: 'Dates', icon: Calendar, description: 'Schedule' }
];

const DIMENSIONS_STRUCTURE = [
  {
    id: 'content',
    label: 'Content',
    color: 'blue',
    children: [
      { id: 'substack', label: 'Substack' },
      { id: 'newsletter', label: 'Newsletter' },
      { id: 'books', label: 'Books' }
    ]
  },
  {
    id: 'practice',
    label: 'Practices',
    color: 'emerald',
    children: [
      { id: 'stone', label: 'Stone' },
      { id: 'walk', label: 'Walk' },
      { id: 'b2b', label: 'B2B' }
    ]
  },
  {
    id: 'community',
    label: 'Community',
    color: 'pink',
    children: [
      { id: 'mission', label: 'Mission' },
      { id: 'development', label: 'Development' },
      { id: 'first30', label: 'First 30' }
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    color: 'amber',
    children: [
      { id: 'bopa', label: 'BOPA' },
      { id: 'website', label: 'Website' },
      { id: 'marketing-other', label: 'Other' }
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    color: 'purple',
    children: [
      { id: 'planning', label: 'Planning' },
      { id: 'accounting', label: 'Accounting' },
      { id: 'admin-other', label: 'Other' }
    ]
  }
];

export default function CreateTaskModal({ isOpen, onClose, initialData = {}, onTaskCreated }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [selectedSubDimension, setSelectedSubDimension] = useState(null);
  const [tags, setTags] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Initialize with passed data
  useEffect(() => {
      if (isOpen && initialData) {
          // Check if initialData.tag matches a dimension or subdimension
          const tag = initialData.tag;
          if (tag) {
              const parent = DIMENSIONS_STRUCTURE.find(d => d.id === tag || d.children.some(c => c.id === tag));
              if (parent) {
                  setSelectedDimension(parent.id);
                  if (parent.id !== tag) {
                      setSelectedSubDimension(tag);
                  }
              }
          }
      }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setStep(1);
    setSelectedDimension(null);
    setSelectedSubDimension(null);
    setTags([]);
    setTitle('');
    setDescription('');
    setDueDate('');
    onClose();
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Auto-add dimension tags if not already present
      const finalTags = [...new Set([...tags, selectedDimension, selectedSubDimension].filter(Boolean))];
      
      await api.createTask({ 
        title, 
        description, 
        tags: finalTags,
        dueDate
      });
      
      if (onTaskCreated) onTaskCreated();
      resetForm();
    } catch (e) {
        console.error("Failed to create task", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
      <h4 className="text-lg font-medium text-white mb-4">Where does this belong?</h4>
      
      <div className="grid grid-cols-2 gap-3">
        {DIMENSIONS_STRUCTURE.map(dim => (
          <button
            key={dim.id}
            onClick={() => {
                setSelectedDimension(dim.id);
                setSelectedSubDimension(null); // Reset sub
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedDimension === dim.id
                ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/50'
                : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80 hover:border-white/10'
            }`}
          >
            <div className={`text-sm font-semibold mb-1 ${selectedDimension === dim.id ? 'text-blue-400' : 'text-slate-300'}`}>
                {dim.label}
            </div>
          </button>
        ))}
      </div>

      {selectedDimension && (
        <div className="mt-6 pt-4 border-t border-white/5">
            <h5 className="text-sm font-medium text-slate-400 mb-3">Select Category</h5>
            <div className="flex flex-wrap gap-2">
                {DIMENSIONS_STRUCTURE.find(d => d.id === selectedDimension)?.children.map(sub => (
                    <button
                        key={sub.id}
                        onClick={() => setSelectedSubDimension(sub.id)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                            selectedSubDimension === sub.id
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
      <h4 className="text-lg font-medium text-white mb-2">Add Tags</h4>
      <p className="text-sm text-slate-400 mb-4">
          Selected: <span className="text-blue-400">{selectedDimension}</span> {selectedSubDimension && <span>/ <span className="text-emerald-400">{selectedSubDimension}</span></span>}
      </p>
      
      <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <TagSelector selectedTags={tags} onChange={setTags} />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
      <h4 className="text-lg font-medium text-white mb-4">Task Details</h4>
      
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Task Title</label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Resources & Description</label>
        <textarea
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes, resources, links, or context..."
          rows={5}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
      <h4 className="text-lg font-medium text-white mb-4">Schedule</h4>
      
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Due Date</label>
        <input
          type="date"
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      
      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h5 className="text-sm font-semibold text-blue-400 mb-1">Ready to create?</h5>
          <p className="text-xs text-blue-300/80">
              Creating task "{title}" in {selectedDimension}
          </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">Create New Task</h3>
          <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 pt-6">
             <div className="flex justify-between mb-6 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-0 -translate-y-1/2"></div>
                {STEPS.map((s) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;
                    return (
                        <div key={s.id} className="relative z-10 bg-slate-950 px-2 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${
                                isActive ? 'border-blue-500 bg-slate-900 text-blue-500' :
                                isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' :
                                'border-slate-800 bg-slate-900 text-slate-600'
                            }`}>
                                <s.icon size={14} />
                            </div>
                            <span className={`text-[10px] mt-1 font-medium uppercase ${isActive ? 'text-blue-500' : 'text-slate-600'}`}>{s.title}</span>
                        </div>
                    );
                })}
             </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/50 flex justify-between">
          <button 
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                step === 1 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          {step < 4 ? (
             <button 
                onClick={handleNext}
                disabled={step === 1 && !selectedDimension} // Require placement
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
             >
                Next <ArrowRight size={16} />
             </button>
          ) : (
             <button 
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
             >
                {isSubmitting ? 'Creating...' : 'Create Task'} <Plus size={16} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
