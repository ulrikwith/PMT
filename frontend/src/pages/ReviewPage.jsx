import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Brain,
  Zap,
  Moon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ChevronDown,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import api from '../services/api';

// Static Tailwind class map — dynamic interpolation doesn't work with Tailwind JIT
const stepColorClasses = {
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20',   glow: 'text-amber-500/10' },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-500',    border: 'border-pink-500/20',    glow: 'text-pink-500/10' },
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-500',  border: 'border-indigo-500/20',  glow: 'text-indigo-500/10' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', glow: 'text-emerald-500/10' },
};

const REVIEW_STEPS = [
  {
    id: 'celebration',
    title: 'Aliveness',
    question: 'What felt most alive in your work this week?',
    subtext: 'Focus on the quality of engagement, not just output.',
    icon: Sparkles,
    color: 'amber',
  },
  {
    id: 'friction',
    title: 'Friction',
    question: 'Where did you feel blocked or drained?',
    subtext: 'Identify the "stones" in your path.',
    icon: Brain,
    color: 'pink',
  },
  {
    id: 'incubation',
    title: 'Incubation',
    question: 'What needs to sit and simmer?',
    subtext: 'Not everything is ready for execution. What needs space?',
    icon: Moon,
    color: 'indigo',
  },
  {
    id: 'intention',
    title: 'Next Flow',
    question: 'What is the "next right move" for the coming week?',
    subtext: 'Define the intention, not just the tasks.',
    icon: Zap,
    color: 'emerald',
  },
];

// Calculate review streak
function calculateStreak(reviews) {
  if (reviews.length === 0) return 0;
  const now = new Date();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  let streak = 0;
  let checkDate = new Date(now);

  // Go week by week backwards from now
  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(checkDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + oneWeekMs);

    const hasReview = reviews.some((r) => {
      const d = new Date(r.date);
      return d >= weekStart && d < weekEnd;
    });

    if (hasReview) {
      streak++;
      checkDate = new Date(weekStart.getTime() - 1); // Move to previous week
    } else if (i === 0) {
      // Current week might not have a review yet, skip
      checkDate = new Date(weekStart.getTime() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

// Extract common words from text entries
function extractThemes(reviews, field) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'i', 'my', 'me', 'we', 'our', 'it', 'its',
    'that', 'this', 'what', 'which', 'who', 'how', 'when', 'where', 'not',
    'no', 'so', 'if', 'about', 'up', 'out', 'just', 'like', 'more', 'some',
    'very', 'really', 'also', 'than', 'into', 'feel', 'felt', 'lot', 'much',
  ]);

  const wordCounts = {};
  reviews.forEach((r) => {
    const text = r.answers?.[field] || '';
    text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w))
      .forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
  });

  return Object.entries(wordCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
}

function getWeekLabel(dateStr) {
  const date = new Date(dateStr);
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    celebration: '',
    friction: '',
    incubation: '',
    intention: '',
  });
  const [isComplete, setIsComplete] = useState(false);
  const [pastReviews, setPastReviews] = useState([]);
  const [expandedReview, setExpandedReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Process Review', icon: Sparkles }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Load past reviews
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const data = await api.getReviews();
      setPastReviews(Array.isArray(data) ? data : []);
    } catch {
      // Fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem('pmt_reviews') || '[]');
        setPastReviews(local);
      } catch {
        setPastReviews([]);
      }
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleNext = () => {
    if (currentStep < REVIEW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      saveReview();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveReview = async () => {
    const reviewData = {
      date: new Date().toISOString(),
      answers,
    };

    // Save to localStorage as cache
    const localReviews = JSON.parse(localStorage.getItem('pmt_reviews') || '[]');
    localStorage.setItem('pmt_reviews', JSON.stringify([...localReviews, reviewData]));

    // Save to backend
    try {
      await api.saveReview(reviewData);
    } catch (err) {
      console.error('Failed to save review to backend:', err);
    }

    // Reload reviews
    loadReviews();
  };

  const streak = useMemo(() => calculateStreak(pastReviews), [pastReviews]);
  const alivenessThemes = useMemo(() => extractThemes(pastReviews, 'celebration'), [pastReviews]);
  const frictionThemes = useMemo(() => extractThemes(pastReviews, 'friction'), [pastReviews]);

  const step = REVIEW_STEPS[currentStep];
  const Icon = step.icon;
  const colors = stepColorClasses[step.color];

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Review Complete</h2>
        <p className="text-slate-400 mb-8 leading-relaxed text-lg">
          Your reflections have been woven into the system. <br />
          Trust the process and allow the next week to unfold.
        </p>
        <button
          onClick={() => {
            setIsComplete(false);
            setCurrentStep(0);
            setAnswers({ celebration: '', friction: '', incubation: '', intention: '' });
          }}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/5"
        >
          Start New Review
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Review Form */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Weekly Process Review</h2>
            <p className="text-slate-400 mt-1 italic">
              Honoring the flow between action and reflection.
            </p>
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
                i <= currentStep
                  ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-white/5 relative overflow-hidden">
        {/* Background Icon Glow */}
        <Icon
          className={`absolute -top-12 -right-12 ${colors.glow} opacity-20`}
          size={240}
        />

        <div className="relative space-y-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${colors.bg} ${colors.text} ${colors.border} shadow-lg`}>
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
                currentStep === 0
                  ? 'opacity-0 cursor-default'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft size={20} /> Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all"
            >
              {currentStep === REVIEW_STEPS.length - 1 ? 'Finish Review' : 'Next Step'}{' '}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Past Reviews Section */}
      {!loadingReviews && pastReviews.length > 0 && (
        <div className="mt-16">
          <div className="border-t border-slate-800 pt-8">
            {/* Pattern Indicators */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Streak */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Streak</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {streak} <span className="text-sm font-normal text-slate-500">weeks</span>
                </p>
              </div>

              {/* Aliveness Themes */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aliveness</span>
                </div>
                {alivenessThemes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {alivenessThemes.slice(0, 3).map((t) => (
                      <span key={t.word} className="text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full">
                        {t.word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">More reviews needed</p>
                )}
              </div>

              {/* Friction Themes */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-pink-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Friction</span>
                </div>
                {frictionThemes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {frictionThemes.slice(0, 3).map((t) => (
                      <span key={t.word} className="text-xs bg-pink-500/10 text-pink-300 px-2 py-0.5 rounded-full">
                        {t.word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">More reviews needed</p>
                )}
              </div>
            </div>

            {/* Review History */}
            <h3 className="text-lg font-bold text-white mb-4">
              Past Reviews
              <span className="text-sm font-normal text-slate-500 ml-2">({pastReviews.length})</span>
            </h3>

            <div className="space-y-3">
              {pastReviews.map((review, idx) => (
                <div
                  key={review.id || idx}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedReview(expandedReview === idx ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        Week of {getWeekLabel(review.date)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(review.date).toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform ${expandedReview === idx ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedReview === idx && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                      {REVIEW_STEPS.map((s) => {
                        const answer = review.answers?.[s.id];
                        if (!answer) return null;
                        const sColors = stepColorClasses[s.color];
                        return (
                          <div key={s.id} className="flex gap-3">
                            <div className={`p-1.5 rounded-lg ${sColors.bg} ${sColors.text} flex-shrink-0 mt-0.5`}>
                              <s.icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-400 mb-1">{s.title}</p>
                              <p className="text-sm text-slate-300 leading-relaxed">{answer}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
