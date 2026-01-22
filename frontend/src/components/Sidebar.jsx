import React, { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { List, Calendar, Target, ChevronRight, LayoutDashboard, Trash2, Sparkles } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { useCreateTask } from '../context/CreateTaskContext';

const DIMENSIONS_STRUCTURE = [
  {
    id: 'content',
    label: 'Content',
    color: 'blue', // Base color
    tags: ['substack', 'newsletter', 'books'],
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
    tags: ['practice', 'stone', 'walk', 'b2b'],
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
    tags: ['community', 'mission', 'development', 'first30'],
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
    tags: ['marketing', 'bopa', 'website', 'marketing-other'],
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
    tags: ['admin', 'planning', 'accounting', 'admin-other'],
    children: [
      { id: 'planning', label: 'Planning' },
      { id: 'accounting', label: 'Accounting' },
      { id: 'admin-other', label: 'Other' }
    ]
  }
];

export default function Sidebar() {
  const { tasks } = useTasks(); // Use unified state
  const [taskCounts, setTaskCounts] = useState({ total: 0 });
  const [expanded, setExpanded] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDimension = searchParams.get('dimension') || '';
  const { openCreateTask } = useCreateTask();

  // Recalculate counts whenever tasks change
  useEffect(() => {
    // Filter out deleted tasks for counts (TasksContext provides all tasks including soft-deleted ones until filtered by page)
    // Actually, TasksContext provides pre-filtered tasks based on 'includeDeleted' flag default false in backend.
    // However, TrashPage requests deleted tasks separately.
    // If TasksContext 'tasks' array contains deleted items, we should filter them here.
    // Looking at backend task.js, getTasks filters out deleted by default.
    // Let's assume 'tasks' here are active tasks.
    const activeTasks = tasks.filter(t => !t.deletedAt);
    
    const counts = { total: activeTasks.length };

    // Calculate counts for each dimension node
    DIMENSIONS_STRUCTURE.forEach(parent => {
        // Parent count: matches any of its tags
        const parentCount = activeTasks.filter(t =>
            t.tags?.some(tag => parent.tags.includes(tag.toLowerCase()))
        ).length;
        counts[parent.id] = parentCount;

          // Children counts
          parent.children.forEach(child => {
              const childCount = activeTasks.filter(t =>
                  t.tags?.some(tag => tag.toLowerCase() === child.id)
              ).length;
              counts[child.id] = childCount;
          });
      });

      setTaskCounts(counts);
  }, [tasks]); // Re-run when tasks change

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDimensionClick = (dimensionId, isParent) => {
    const count = taskCounts[dimensionId];
    
    if (count > 0) {
        // Normal Navigation
        if (activeDimension === dimensionId) {
            searchParams.delete('dimension');
        } else {
            searchParams.set('dimension', dimensionId);
        }
        setSearchParams(searchParams);
    } else {
        // Empty state -> Open Create Task Wizard pre-filled
        openCreateTask({ tag: dimensionId });
    }
    
    if (isParent) {
        toggleExpand(dimensionId);
    }
  };

  const navItems = [
    { to: "/board", icon: LayoutDashboard, label: "Projects" },
    { to: "/", icon: List, label: "List", count: taskCounts.total },
    { to: "/timeline", icon: Calendar, label: "Timeline" },
    { to: "/readiness", icon: Target, label: "Readiness" },
    { to: "/review", icon: Sparkles, label: "Process Review" },
  ];

  const bottomNavItems = [
    { to: "/trash", icon: Trash2, label: "Trash" },
  ];

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'text-blue-500 bg-blue-500/10' : 'hover:text-blue-500 hover:bg-blue-500/10',
      emerald: isActive ? 'text-emerald-500 bg-emerald-500/10' : 'hover:text-emerald-500 hover:bg-emerald-500/10',
      purple: isActive ? 'text-purple-500 bg-purple-500/10' : 'hover:text-purple-500 hover:bg-purple-500/10',
      amber: isActive ? 'text-amber-500 bg-amber-500/10' : 'hover:text-amber-500 hover:bg-amber-500/10',
      pink: isActive ? 'text-pink-500 bg-pink-500/10' : 'hover:text-pink-500 hover:bg-pink-500/10',
    };
    return colors[color] || '';
  };

  const getDotColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      pink: 'bg-pink-500',
    };
    return colors[color] || 'bg-slate-500';
  };

  return (
    <aside className="w-64 glass-panel border-r border-white/5 p-4 space-y-2 flex-shrink-0 h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
              isActive
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-500"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`
          }
        >
          <item.icon size={18} />
          <span>{item.label}</span>
          {item.count !== undefined && item.count > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-blue-500/20">
              {item.count}
            </span>
          )}
        </NavLink>
      ))}

      {/* Divider */}
      <div className="h-px bg-white/5 my-4"></div>

      {/* Section Header */}
      <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Dimensions
      </div>

      {/* Nested Dimensions */}
      <div className="space-y-1">
        {DIMENSIONS_STRUCTURE.map((parent) => {
          const isParentActive = activeDimension === parent.id;
          const isExpanded = expanded[parent.id] || isParentActive; 
          const hasActiveChild = parent.children.some(c => activeDimension === c.id);
          const showChildren = expanded[parent.id] || hasActiveChild;

          return (
            <div key={parent.id} className="space-y-1">
              <button
                onClick={() => handleDimensionClick(parent.id, true)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all group ${
                  isParentActive ? getColorClasses(parent.color, true) : `text-slate-400 ${getColorClasses(parent.color, false)}`
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${getDotColor(parent.color)}`}></div>
                <span className="text-sm font-medium flex-1 text-left">{parent.label}</span>
                
                {/* Expand Icon */}
                <span className={`text-slate-600 transition-transform duration-200 ${showChildren ? 'rotate-90' : ''}`}>
                    <ChevronRight size={14} />
                </span>
                
                {taskCounts[parent.id] > 0 && (
                  <span className="ml-2 text-xs text-slate-500">{taskCounts[parent.id]}</span>
                )}
              </button>

              {/* Children Curtain */}
              {showChildren && (
                  <div className="pl-6 space-y-1 border-l border-white/5 ml-4 animate-in slide-in-from-top-2 duration-200">
                      {parent.children.map(child => {
                          const isChildActive = activeDimension === child.id;
                          return (
                              <button
                                key={child.id}
                                onClick={() => handleDimensionClick(child.id, false)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-all ${
                                    isChildActive 
                                        ? 'text-white bg-white/5' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                  <span>{child.label}</span>
                                  {taskCounts[child.id] > 0 && (
                                    <span className="text-xs opacity-60">{taskCounts[child.id]}</span>
                                  )}
                              </button>
                          );
                      })}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom section - Trash */}
      <div className="mt-auto pt-4 border-t border-white/5">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                isActive
                  ? "text-slate-300 bg-slate-800/60"
                  : "text-slate-500 hover:text-slate-400 hover:bg-slate-800/40"
              }`
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}