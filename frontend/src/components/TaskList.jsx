import React, { useState } from 'react';
import { Plus, Package, ArrowRight, ChevronDown, ChevronRight, Check, Clock } from 'lucide-react';
import TaskCard from './TaskCard';
import { useCreateTask } from '../context/CreateTaskContext';

export default function TaskList({ tasks, onCreate, onUpdate, onDelete }) {
  const { openCreateTask } = useCreateTask();
  const [expandedWorks, setExpandedWorks] = useState({});

  const toggleWork = (id) => {
    setExpandedWorks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderActivity = (activity, parentId, index) => (
      <div key={`${parentId}-act-${index}`} className="ml-8 mt-2 p-3 bg-slate-900/40 border border-slate-700/50 rounded-lg flex items-center gap-3">
          <ArrowRight size={14} className="text-slate-600" />
          <div className="flex-1">
              <span className={`text-sm ${activity.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {activity.title}
              </span>
          </div>
          {activity.timeEstimate && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} /> {activity.timeEstimate}h
              </div>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              activity.status === 'done' ? 'bg-green-900/30 text-green-500' : 'bg-slate-800 text-slate-500'
          }`}>
              {activity.status}
          </span>
      </div>
  );

  return (
    <div>
      <button
        onClick={() => openCreateTask()}
        className="w-full p-4 mb-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-blue-500/50 hover:text-blue-500 transition-all flex items-center justify-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
             <Plus size={20} />
        </div>
        <span className="font-medium">Add New Work</span>
      </button>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
           <div className="text-center py-10 text-slate-500">
               No work found. Create one to get started!
           </div>
        ) : (
            tasks.map((task, index) => {
                const isWork = task.workType || (task.activities && task.activities.length > 0);
                const isExpanded = expandedWorks[task.id];

                return (
                    <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                        {/* Work Container */}
                        <div className={`relative ${isWork ? 'group' : ''}`}>
                            {isWork && (
                                <button 
                                    onClick={() => toggleWork(task.id)}
                                    className="absolute -left-8 top-6 p-1 text-slate-500 hover:text-blue-500 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                            )}
                            
                            <TaskCard 
                                task={task}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                            />
                        </div>

                        {/* Expanded Activities */}
                        {isWork && isExpanded && task.activities && (
                            <div className="mb-4 pl-4 border-l-2 border-slate-800/50 space-y-1">
                                {task.activities.map((act, idx) => renderActivity(act, task.id, idx))}
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
}