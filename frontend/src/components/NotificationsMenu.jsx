import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TasksContext';

const DIMENSIONS = [
  { id: 'content', label: 'Content', color: 'blue', tags: ['substack', 'newsletter', 'books'] },
  { id: 'practice', label: 'Practices', color: 'emerald', tags: ['practice', 'stone', 'walk', 'b2b'] },
  { id: 'community', label: 'Community', color: 'pink', tags: ['community', 'mission', 'development', 'first30'] },
  { id: 'marketing', label: 'Marketing', color: 'amber', tags: ['marketing', 'bopa', 'website', 'marketing-other'] },
  { id: 'admin', label: 'Admin', color: 'purple', tags: ['admin', 'planning', 'accounting', 'admin-other'] }
];

export default function NotificationsMenu() {
  const { tasks } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [tasksOfDay, setTasksOfDay] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close on click outside
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute tasksOfDay reactively whenever tasks change or menu opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'Done');
      setTasksOfDay(dueToday);
    }
  }, [isOpen, tasks]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleTaskClick = (task) => {
      setIsOpen(false);
      // Transport to task: Navigate to tasks page with search filter for this task's title
      navigate(`/?search=${encodeURIComponent(task.title)}`);
  };

  const groupedTasks = DIMENSIONS.reduce((acc, dim) => {
      const dimTasks = tasksOfDay.filter(task => {
        if (!task.tags) return false;
        const lowerTags = task.tags.map(t => t.toLowerCase());
        return lowerTags.includes(dim.id) || dim.tags.some(tag => lowerTags.includes(tag));
      });
      if (dimTasks.length > 0) {
          acc[dim.label] = { tasks: dimTasks, color: dim.color };
      }
      return acc;
  }, {});

  const hasTasks = Object.keys(groupedTasks).length > 0;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
            isOpen 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-white hover:border-blue-500/50'
        }`}
        title="Notifications"
      >
        <div className="relative">
            <Bell size={16} />
            {tasksOfDay.length > 0 && !loading && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="px-4 py-3 border-b border-white/5 bg-slate-950/50 flex justify-between items-center">
                <h3 className="font-semibold text-white text-sm">Tasks for Today</h3>
                <span className="text-xs text-slate-500">{new Date().toLocaleDateString()}</span>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
                {!hasTasks ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                        <Check size={24} className="text-emerald-500/50" />
                        <span className="text-sm text-slate-400">All clear for today!</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedTasks).map(([dimLabel, { tasks, color }]) => (
                            <div key={dimLabel}>
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 text-${color}-500`}>
                                    {dimLabel}
                                </div>
                                <div className="space-y-1">
                                    {tasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group flex items-start gap-2"
                                        >
                                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-${color}-500`}></div>
                                            <div>
                                                <div className="text-sm text-slate-300 group-hover:text-white line-clamp-1">{task.title}</div>
                                                {task.description && (
                                                    <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
