import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Hash, Clock, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TasksContext';

const DIMENSIONS = [
  { id: 'content', label: 'Content', color: 'blue', tags: ['substack', 'newsletter', 'books'] },
  { id: 'practice', label: 'Practices', color: 'emerald', tags: ['practice', 'stone', 'walk', 'b2b'] },
  { id: 'community', label: 'Community', color: 'pink', tags: ['community', 'mission', 'development', 'first30'] },
  { id: 'marketing', label: 'Marketing', color: 'amber', tags: ['marketing', 'bopa', 'website', 'marketing-other'] },
  { id: 'admin', label: 'Admin', color: 'purple', tags: ['admin', 'planning', 'accounting', 'admin-other'] }
];

export default function TimelineView() {
  const { tasks, loading, error } = useTasks(); // Use unified context
  const [groupedTasks, setGroupedTasks] = useState({});
  const [expandedDim, setExpandedDim] = useState('content'); // Default expanded

  // Group tasks whenever the master list changes
  useEffect(() => {
    if (tasks.length > 0) {
        groupTasksByDimension(tasks);
    }
  }, [tasks]);

  const groupTasksByDimension = (allTasks) => {
    const grouped = {};
    
    DIMENSIONS.forEach(dim => {
      // Find tasks that match any tag for this dimension
      // OR if the task matches the dimension ID itself
      const dimTasks = allTasks.filter(task => {
        if (!task.tags || task.tags.length === 0) return false;
        const lowerTags = task.tags.map(t => t.toLowerCase());
        
        // Match explicit dimension tag
        if (lowerTags.includes(dim.id)) return true;
        
        // Match sub-tags
        return dim.tags.some(tag => lowerTags.includes(tag));
      });

      // Sort by due date (tasks with due dates first, then created at)
      dimTasks.sort((a, b) => {
          if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
      });

      grouped[dim.id] = dimTasks;
    });
    
    setGroupedTasks(grouped);
  };

  if (loading && tasks.length === 0) return <div className="text-slate-500">Loading timeline...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-500/20 rounded bg-red-500/10">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Timeline</h2>
        <p className="text-slate-400">Roadmap organized by work dimensions.</p>
      </div>

      {DIMENSIONS.map(dim => (
        <DimensionCard 
          key={dim.id} 
          dimension={dim}
          tasks={groupedTasks[dim.id] || []}
          isExpanded={expandedDim === dim.id}
          onToggle={() => setExpandedDim(expandedDim === dim.id ? null : dim.id)}
        />
      ))}
    </div>
  );
}

function DimensionCard({ dimension, tasks, isExpanded, onToggle }) {
  const getColorClasses = (color) => {
    const map = {
      blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    };
    return map[color] || map.blue;
  };

  return (
    <div className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 border ${
        isExpanded ? 'border-white/10' : 'border-transparent'
    }`}>
      {/* Header */}
      <button 
        onClick={onToggle}
        className="w-full px-6 py-5 flex justify-between items-center hover:bg-slate-800/40 transition-all text-left"
      >
        <div className="flex items-center gap-4">
          <h3 className={`text-xl font-bold tracking-tight ${
              isExpanded ? 'text-white' : 'text-slate-300'
          }`}>
            {dimension.label}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClasses(dimension.color)}`}>
            {tasks.length} items
          </span>
        </div>
        
        <ChevronDown 
          size={24} 
          className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3 border-t border-white/5 animate-fade-in pt-4">
           {tasks.length === 0 ? (
               <div className="text-slate-500 text-sm italic py-2">No tasks scheduled for this dimension.</div>
           ) : (
               <div className="space-y-3">
                   {tasks.map(task => (
                       <TimelineTaskItem key={task.id} task={task} color={dimension.color} />
                   ))}
               </div>
           )}
        </div>
      )}
    </div>
  );
}

function TimelineTaskItem({ task, color }) {
    // Simple visual mapping for color to border/bg
    const accentColor = {
      blue: 'border-blue-500/30 hover:border-blue-500/50',
      emerald: 'border-emerald-500/30 hover:border-emerald-500/50',
      purple: 'border-purple-500/30 hover:border-purple-500/50',
      amber: 'border-amber-500/30 hover:border-amber-500/50',
      pink: 'border-pink-500/30 hover:border-pink-500/50',
    }[color] || 'border-slate-700';

    const isDone = task.status === 'Done';

    return (
        <div className={`p-4 rounded-lg bg-slate-900/40 border transition-all flex justify-between items-start gap-4 ${accentColor} ${isDone ? 'opacity-60' : ''}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.title}
                    </h4>
                    {isDone && <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 rounded">Done</span>}
                </div>
                
                {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
                )}

                <div className="flex gap-2">
                    {task.tags && task.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded flex items-center gap-1">
                            <Hash size={10} /> {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 min-w-[100px]">
                {task.dueDate ? (
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
                        new Date(task.dueDate) < new Date() && !isDone
                            ? 'bg-red-500/10 text-red-400' 
                            : 'bg-slate-800 text-slate-400'
                    }`}>
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                ) : (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock size={12} /> Unscheduled
                    </div>
                )}
            </div>
        </div>
    );
}