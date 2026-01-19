import React, { useState, useEffect } from 'react';
import { 
  Plus, X, ArrowRight, ArrowLeft, Calendar, Tag, Layers, FileText, 
  Clock, Zap, Wrench, Users, BookOpen, Link2, Lock, ArrowLeftRight 
} from 'lucide-react';
import TagSelector from './TagSelector';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Placement', icon: Layers },
  { id: 2, title: 'Define', icon: FileText },
  { id: 3, title: 'Activities', icon: Tag }, // Using Tag icon for activities/tasks list for now
  { id: 4, title: 'Resources', icon: Wrench },
  { id: 5, title: 'Connect', icon: Link2 }
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
  const [selectedElement, setSelectedElement] = useState(null); // was selectedSubDimension
  
  // Define
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('part-of-element');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState(''); // targetCompletion

  // Activities
  const [activities, setActivities] = useState([]); // [{id, title, time, energy}]
  const [newActivity, setNewActivity] = useState('');

  // Resources
  const [timeEstimate, setTimeEstimate] = useState('');
  const [energyLevel, setEnergyLevel] = useState('Focused work');
  const [tools, setTools] = useState([]);
  const [newTool, setNewTool] = useState('');
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState('');
  const [materials, setMaterials] = useState('');

  // Connect (Simple list for now, ideally search)
  const [connections, setConnections] = useState([]); 

  // Initialize with passed data
  useEffect(() => {
      if (isOpen) {
          if (initialData && initialData.tag) {
              const tag = initialData.tag;
              const parent = DIMENSIONS_STRUCTURE.find(d => d.id === tag || d.children.some(c => c.id === tag));
              if (parent) {
                  setSelectedDimension(parent.id);
                  if (parent.id !== tag) {
                      setSelectedElement(tag);
                  }
              }
          }
      }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setStep(1);
    setSelectedDimension(null);
    setSelectedElement(null);
    setTitle('');
    setDescription('');
    setActivities([]);
    setTools([]);
    setPeople([]);
    setDueDate('');
    onClose();
  };

  const handleNext = () => { if (step < 5) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const finalTags = [...new Set([selectedDimension, selectedElement].filter(Boolean))];
      
      const resources = {
          timeEstimate,
          energyLevel,
          tools,
          materials,
          people
      };

      await api.createTask({ 
        title, 
        description, 
        tags: finalTags,
        dueDate, // Target completion
        startDate,
        workType,
        targetOutcome,
        activities,
        resources
      });
      
      if (onTaskCreated) onTaskCreated();
      resetForm();
    } catch (e) {
        console.error("Failed to create work", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // --- Step Renderers ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
      <h2 className="text-2xl font-bold text-white mb-4">Where does this Work belong?</h2>
      
      {/* Dimension */}
      <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Dimension</label>
          <div className="grid grid-cols-5 gap-3">
            {DIMENSIONS_STRUCTURE.map(dim => (
              <button
                key={dim.id}
                onClick={() => { setSelectedDimension(dim.id); setSelectedElement(null); }}
                className={`p-4 rounded-lg flex flex-col items-center gap-2 border-2 transition-all ${
                  selectedDimension === dim.id
                    ? `border-${dim.color}-500 bg-${dim.color}-500/10`
                    : 'border-transparent bg-slate-800/40 hover:bg-slate-800/60'
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-${dim.color}-500`}></div>
                <span className={`text-xs font-medium ${selectedDimension === dim.id ? 'text-white' : 'text-slate-400'}`}>
                    {dim.label}
                </span>
              </button>
            ))}
          </div>
      </div>

      {/* Element */}
      {selectedDimension && (
        <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-slate-300 mb-3">Element</label>
            <div className="grid grid-cols-3 gap-3">
                {DIMENSIONS_STRUCTURE.find(d => d.id === selectedDimension)?.children.map(sub => (
                    <button
                        key={sub.id}
                        onClick={() => setSelectedElement(sub.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                            selectedElement === sub.id
                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                        <span className="text-sm font-medium">{sub.label}</span>
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
      <h2 className="text-2xl font-bold text-white mb-4">Define this Work</h2>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Work Name</label>
        <input
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          placeholder="e.g., Chapter 12: The Body as Classroom"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none resize-none"
          rows={3}
          placeholder="What is this Work about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input type="date" className="w-full px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white" 
                value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Completion</label>
            <input type="date" className="w-full px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white" 
                value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Define Activities</h2>
      </div>

      <div className="space-y-3">
          {activities.map((act, idx) => (
              <div key={idx} className="glass-panel p-3 rounded-lg flex justify-between items-center border border-white/5">
                  <span className="text-sm text-slate-200">{act.title}</span>
                  <button onClick={() => setActivities(activities.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-500"><X size={14}/></button>
              </div>
          ))}
          
          <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white"
                placeholder="Add new activity..."
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && newActivity.trim()) {
                        setActivities([...activities, { title: newActivity, status: 'todo' }]);
                        setNewActivity('');
                    }
                }}
              />
              <button 
                onClick={() => {
                    if (newActivity.trim()) {
                        setActivities([...activities, { title: newActivity, status: 'todo' }]);
                        setNewActivity('');
                    }
                }}
                className="p-2 bg-blue-600 rounded-lg text-white"
              ><Plus size={20}/></button>
          </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
      <h2 className="text-2xl font-bold text-white mb-4">Resources Needed</h2>
      
      {/* Time & Energy */}
      <div className="glass-panel p-5 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2 mb-4 text-blue-400 font-semibold"><Clock size={18}/> Time & Energy</div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-slate-400 block mb-1">Est. Hours</label>
                  <input type="number" className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded text-white" placeholder="e.g. 5" value={timeEstimate} onChange={e => setTimeEstimate(e.target.value)} />
              </div>
              <div>
                  <label className="text-xs text-slate-400 block mb-1">Energy</label>
                  <select className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded text-white" value={energyLevel} onChange={e => setEnergyLevel(e.target.value)}>
                      <option>Deep work</option>
                      <option>Focused work</option>
                      <option>Light work</option>
                      <option>Admin</option>
                  </select>
              </div>
          </div>
      </div>

      {/* Tools */}
      <div className="glass-panel p-5 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4 text-purple-400 font-semibold"><Wrench size={18}/> Tools</div>
          <div className="flex flex-wrap gap-2 mb-3">
              {tools.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs flex items-center gap-1">{t} <X size={10} className="cursor-pointer" onClick={() => setTools(tools.filter((_, idx) => idx !== i))} /></span>
              ))}
          </div>
          <input 
            className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded text-white" 
            placeholder="Add tool..." 
            value={newTool}
            onChange={e => setNewTool(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter' && newTool.trim()) {
                    setTools([...tools, newTool.trim()]);
                    setNewTool('');
                }
            }}
          />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
      <h2 className="text-2xl font-bold text-white mb-4">Connect to other Works</h2>
      <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
          <Link2 size={32} className="mx-auto mb-2 opacity-50" />
          <p>Connection management will be available in the Mind Map view.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50">
            <div className="flex gap-4">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s.id ? 'bg-blue-500 text-white' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {step > s.id ? <ArrowRight size={14}/> : s.id}
                        </div>
                        {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>}
                    </div>
                ))}
            </div>
            <button onClick={resetForm}><X className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 flex-1 overflow-y-auto">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-slate-900/50 flex justify-between">
            <button onClick={handleBack} disabled={step === 1} className={`px-6 py-2 rounded-lg font-medium ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-white'}`}>Back</button>
            
            {step < 5 ? (
                <button onClick={handleNext} disabled={step === 1 && !selectedDimension} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50">Next Step</button>
            ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20">Create Work</button>
            )}
        </div>
      </div>
    </div>
  );
}