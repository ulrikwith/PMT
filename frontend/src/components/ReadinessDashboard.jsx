import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { useTasks } from '../context/TasksContext';

export default function ReadinessDashboard() {
  const { tasks, loading, error } = useTasks();

  const readiness = useMemo(() => {
      const completedTasks = tasks.filter(t => t.status === 'Done');
      const check = (keywords) => {
         return completedTasks.some(t => {
             const text = (t.title + ' ' + (t.description || '')).toLowerCase();
             return keywords.some(k => text.includes(k.toLowerCase()));
         });
      };

      return {
         content: {
             label: "Content",
             items: [
                 { name: "Substack Setup", keywords: ['substack setup', 'create substack'], completed: check(['substack setup', 'create substack', 'setup substack']) },
                 { name: "Substack Welcome", keywords: ['substack welcome', 'intro post'], completed: check(['substack welcome', 'intro post']) },
                 { name: "Newsletter Platform", keywords: ['newsletter platform', 'mailing list'], completed: check(['newsletter platform', 'select mailer', 'mailing list']) },
                 { name: "Book Outline", keywords: ['book outline', 'chapter list'], completed: check(['book outline', 'chapter list']) },
                 { name: "Book Draft", keywords: ['first draft', 'manuscript'], completed: check(['first draft', 'manuscript']) }
             ]
         },
         practices: {
             label: "Practices",
             items: [
                 { name: "Stone Concept", keywords: ['stone practice', 'stone concept'], completed: check(['stone practice', 'stone concept', 'define stone']) },
                 { name: "Walk Guide", keywords: ['walking practice', 'walk guide'], completed: check(['walking practice', 'walk guide', 'audio guide']) },
                 { name: "B2B Pitch", keywords: ['b2b pitch', 'corporate offer'], completed: check(['b2b pitch', 'pitch deck', 'corporate offer']) }
             ]
         },
         community: {
             label: "Community",
             items: [
                 { name: "Mission Statement", keywords: ['mission statement', 'values'], completed: check(['mission statement', 'define mission', 'values']) },
                 { name: "Community Guidelines", keywords: ['guidelines', 'code of conduct'], completed: check(['guidelines', 'rules', 'code of conduct']) },
                 { name: "First 30 Plan", keywords: ['first 30', 'onboarding'], completed: check(['first 30', 'onboarding', 'initial cohort']) }
             ]
         },
         marketing: {
             label: "Marketing",
             items: [
                 { name: "BOPA Strategy", keywords: ['bopa', 'borrowed audience'], completed: check(['bopa', 'borrowed audience']) },
                 { name: "Website Domain", keywords: ['domain', 'buy url'], completed: check(['domain', 'buy url', 'dns']) },
                 { name: "Website Launch", keywords: ['launch website', 'publish site'], completed: check(['launch website', 'publish site', 'mvp']) },
                 { name: "Social Profiles", keywords: ['social media', 'linkedin'], completed: check(['social media', 'instagram', 'linkedin', 'twitter']) }
             ]
         }
      };
  }, [tasks]);

  if (loading && tasks.length === 0) return <div className="text-slate-500">Loading readiness data...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-500/20 rounded bg-red-500/10">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(readiness).map(([key, category]) => (
        <ReadinessCard
          key={key}
          title={category.label}
          items={category.items || []}
          requiredCount={category.items?.length || 0}
        />
      ))}
    </div>
  );
}

function ReadinessCard({ title, items, requiredCount }) {
  const completedCount = items.filter(i => i.completed).length;
  const isReady = requiredCount > 0 && completedCount >= requiredCount;

  return (
    <div className={`glass-panel rounded-xl p-6 border-2 transition-all ${
        isReady 
            ? 'border-emerald-500/30 bg-emerald-500/5 shadow-glow-green' 
            : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {isReady && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
            Ready
            </div>
        )}
      </div>
      
      <div className={`text-4xl font-bold mb-6 ${isReady ? 'text-emerald-500' : 'text-slate-500'}`}>
        {completedCount} <span className="text-xl text-slate-600 font-normal">/ {requiredCount}</span>
      </div>
      
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                item.completed 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                  : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}
              title={`Looking for: ${item.keywords?.join(', ')}`}
            >
              {item.completed ? <Check size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>}
            </div>
            <span 
                className={item.completed ? 'text-emerald-400' : 'text-slate-500'}
                title={`Looking for: ${item.keywords?.join(', ')}`}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
