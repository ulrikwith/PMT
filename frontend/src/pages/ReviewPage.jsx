import React, { useState } from 'react';
import { Sparkles, Brain, Zap, Moon, Save, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useEffect } from 'react';

const REVIEW_STEPS = [
  {
    id: 'celebration',
    title: 'Aliveness',
    question: 'What felt most alive in your work this week?',
    subtext: 'Focus on the quality of engagement, not just output.',
    icon: Sparkles,
    color: 'amber'
  },
  {
    id: 'friction',
    title: 'Friction',
    question: 'Where did you feel blocked or drained?',
    subtext: 'Identify the "stones" in your path.',
    icon: Brain,
    color: 'pink'
  },
  {
    id: 'incubation',
    title: 'Incubation',
    question: 'What needs to sit and simmer?',
    subtext: 'Not everything is ready for execution. What needs space?',
    icon: Moon,
    color: 'indigo'
  },
  {
    id: 'intention',
    title: 'Next Flow',
    question: 'What is the "next right move" for the coming week?',
    subtext: 'Define the intention, not just the tasks.',
    icon: Zap,
    color: 'emerald'
  }
];

export default function ReviewPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    celebration: '',
    friction: '',
    incubation: '',
    intention: ''
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Process Review', icon: Sparkles }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleNext = () => {
    if (currentStep < REVIEW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      // Save review logic
      saveReview();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveReview = () => {
    const reviewData = {
      date: new Date().toISOString(),
      answers
    };
    const reviews = JSON.parse(localStorage.getItem('pmt_reviews') || '[]');
    localStorage.setItem('pmt_reviews', JSON.stringify([...reviews, reviewData]));
  };

  const step = REVIEW_STEPS[currentStep];
  const Icon = step.icon;

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Review Complete</h2>
        <p className="text-slate-400 mb-8 leading-relaxed text-lg">
          Your reflections have been woven into the system. <br/>
          Trust the process and allow the next week to unfold.
        </p>
        <button 
          onClick={() => { setIsComplete(false); setCurrentStep(0); setAnswers({ celebration: '', friction: '', incubation: '', intention: '' }); }}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/5"
        >
          Start New Review
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Weekly Process Review</h2>
            <p className="text-slate-400 mt-1 italic">Honoring the flow between action and reflection.</p>
          </div>
          <div className="text-slate-500 font-mono text-sm tracking-widest uppercase">
            Step {currentStep + 1} / {REVIEW_STEPS.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-1">
          {REVIEW_STEPS.map((_, i) => (
            <div 
              key={i}
              className={`h-full flex-1 transition-all duration-500 ${
                i <= currentStep ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-white/5 relative overflow-hidden">
        {/* Background Icon Glow */}
        <Icon className={`absolute -top-12 -right-12 text-${step.color}-500/10 opacity-20`} size={240} />

        <div className="relative space-y-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-${step.color}-500/10 text-${step.color}-500 border border-${step.color}-500/20 shadow-lg`}>
              <Icon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="text-slate-400 text-sm">{step.subtext}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-2xl font-medium text-slate-200 leading-tight block">
              {step.question}
            </label>
            <textarea
              value={answers[step.id]}
              onChange={(e) => setAnswers({ ...answers, [step.id]: e.target.value })}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-6 text-slate-200 text-lg leading-relaxed focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all resize-none min-h-[240px]"
              placeholder="Speak from the heart..."
              autoFocus
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                currentStep === 0 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft size={20} /> Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all"
            >
              {currentStep === REVIEW_STEPS.length - 1 ? 'Finish Review' : 'Next Step'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
