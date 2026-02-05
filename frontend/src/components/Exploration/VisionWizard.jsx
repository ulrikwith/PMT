import React, { useState, useEffect } from 'react';
import { X, Save, ArrowRight, BookOpen, Users, Sprout, Sparkles, CheckCircle2 } from 'lucide-react';
import { useExploration } from '../../context/ExplorationContext';
import { useTasks } from '../../context/TasksContext';
import { useNavigate } from 'react-router-dom';
import ReflectionPracticesStep from './ReflectionPracticesStep';
import CrystallizationStep from './CrystallizationStep';
import PotentialsStep from './PotentialsStep';
import PeerSessionStep from './PeerSessionStep';

// Passion & Talent Step
const PassionTalentStep = ({ data, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-stone-200">Passion & Talent</h3>
    <p className="text-sm text-stone-500 leading-relaxed">
      Take a moment to sense what deeply matters to you and what you're naturally equipped to do.
    </p>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-400 mb-2">What passion keeps returning to you?</label>
        <textarea
          className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-stone-200 focus:outline-none focus:border-[#8B7355]"
          placeholder="What keeps calling for your attention? What matters deeply?"
          value={data.passion || ''}
          onChange={e => onChange('passion', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-400 mb-2">What talent do you possess that wants fuller expression?</label>
        <textarea
          className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-stone-200 focus:outline-none focus:border-[#8B7355]"
          placeholder="What are you naturally equipped to do? What comes easily?"
          value={data.talent || ''}
          onChange={e => onChange('talent', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-400 mb-2">The Intersection: What emerges?</label>
        <textarea
          className="w-full h-32 bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-stone-200 focus:outline-none focus:border-[#8B7355]"
          placeholder="When passion meets talent, what emerges? Don't force an answer - notice what arises."
          value={data.intersection || ''}
          onChange={e => onChange('intersection', e.target.value)}
        />
      </div>
    </div>
  </div>
);

// Map potential types to default elements within each dimension
const getElement = (type) => {
  const elementMap = {
    'book': 'books', 'article-series': 'substack', 'substack': 'substack',
    'course': 'substack', 'podcast': 'substack', 'video-series': 'substack',
    'method': 'practice', 'practice': 'practice', 'workshop': 'b2b', 'retreat': 'walk',
    'community': 'community', 'circle': 'mission', 'event': 'first30', 'facilitation': 'development',
    'tool': 'substack', 'custom': 'substack',
  };
  return elementMap[type] || 'substack';
};

const getDimension = (type) => {
  const contentTypes = ['book', 'article-series', 'substack', 'course', 'podcast', 'video-series'];
  const practiceTypes = ['method', 'practice', 'workshop', 'retreat'];
  const communityTypes = ['community', 'circle', 'event', 'facilitation'];

  if (contentTypes.includes(type)) return 'content';
  if (practiceTypes.includes(type)) return 'practice';
  if (communityTypes.includes(type)) return 'community';
  return 'content';
};

export default function VisionWizard({ visionId, onClose }) {
  const { getVisionById, updateVision, updatePotential } = useExploration();
  const { createTask } = useTasks();
  const navigate = useNavigate();
  const [vision, setVision] = useState(() => getVisionById(visionId));
  const [activeStep, setActiveStep] = useState('passion');
  const [createFeedback, setCreateFeedback] = useState(null);

  useEffect(() => {
    const data = getVisionById(visionId);
    if (data && JSON.stringify(data) !== JSON.stringify(vision)) {
      setVision(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visionId, getVisionById]);

  if (!vision) return null;

  const handleUpdate = (field, value) => {
    setVision(prev => ({ ...prev, [field]: value }));
    updateVision(visionId, { [field]: value });
  };

  const handleCreateWork = async (potential) => {
    const dimension = getDimension(potential.type);
    const element = getElement(potential.type);

    try {
      const newTask = await createTask({
        label: potential.name,
        description: potential.description || '',
        dimension,
        element,
        workType: 'part-of-element',
        status: 'empty',
        visionOrigin: {
          visionId: vision.id,
          visionTitle: vision.title,
          crystallizationStatement: vision.statement || '',
          potentialId: potential.id,
          potentialType: potential.type,
        },
      });

      // Mark the potential as created with the new task ID
      updatePotential(visionId, potential.id, { createdAsWorkId: newTask.id });

      setCreateFeedback({ type: 'success', message: `"${potential.name}" created on the ${dimension} board` });
      setTimeout(() => {
        setCreateFeedback(null);
        navigate(`/board?dimension=${dimension}`);
      }, 1500);
    } catch (err) {
      setCreateFeedback({ type: 'error', message: `Failed to create work: ${err.message}` });
      setTimeout(() => setCreateFeedback(null), 3000);
    }
  };

  const steps = [
    { id: 'passion', label: 'Passion', icon: Sparkles, component: PassionTalentStep },
    { id: 'reflection', label: 'Reflection', icon: BookOpen, component: ReflectionPracticesStep },
    { id: 'peer', label: 'Peer Sensing', icon: Users, component: PeerSessionStep },
    { id: 'crystal', label: 'Crystallize', icon: Sprout, component: CrystallizationStep },
    { id: 'potentials', label: 'Potentials', icon: ArrowRight, component: PotentialsStep },
  ];

  const ActiveComponent = steps.find(s => s.id === activeStep)?.component || PassionTalentStep;

  return (
    <div className="absolute top-0 right-0 w-[600px] h-full bg-[#1c1917]/95 backdrop-blur-xl border-l border-[#8B7355]/20 shadow-2xl flex flex-col z-50 transition-transform duration-300">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6">
        <h2 className="text-xl font-bold text-[#E8DCC4]">{vision.title}</h2>
        <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-stone-800 -z-10" />
          
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`
                  flex flex-col items-center gap-2 relative z-10 transition-all
                  ${isActive ? 'text-[#C9A961]' : 'text-stone-500 hover:text-stone-300'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 bg-[#1c1917] transition-all
                  ${isActive ? 'border-[#C9A961] bg-[#C9A961]/10' : 'border-stone-700'}
                `}>
                  <step.icon size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {createFeedback && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
          createFeedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {createFeedback.type === 'success' && <CheckCircle2 size={16} />}
          {createFeedback.message}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <ActiveComponent
          data={vision}
          onChange={handleUpdate}
          onCreateWork={activeStep === 'potentials' ? handleCreateWork : undefined}
        />
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 bg-[#1c1917]">
        <div className="flex justify-between items-center text-xs text-stone-500">
          <span>Auto-saving...</span>
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-[#8B7355] hover:bg-[#A0826D] text-white rounded-lg transition-colors font-medium">
            <Save size={16} />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
