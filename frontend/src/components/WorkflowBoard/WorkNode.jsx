import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Book, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Edit2, 
  Trash2,
  User,
  Users,
  Megaphone,
  Settings,
  Circle,
  Wrench
} from 'lucide-react';

const DIMENSION_ICONS = {
  content: Book,
  practice: User,
  community: Users,
  marketing: Megaphone,
  admin: Settings,
};

function WorkNode({ data, selected }) {
  const isEmpty = data.status === 'empty';
  const isComplete = data.status === 'complete';
  const isExpanded = data.isExpanded;
  const Icon = DIMENSION_ICONS[data.dimension] || Book;
  
  // Calculate dynamic dimensions
  const activityCount = data.activities?.length || 0;
  let expandedWidth = 'w-[640px]';
  let gridCols = 'grid-cols-4';

  if (activityCount <= 1) {
      expandedWidth = 'w-64';
      gridCols = 'grid-cols-1';
  } else if (activityCount === 2) {
      expandedWidth = 'w-[340px]';
      gridCols = 'grid-cols-2';
  } else if (activityCount === 3) {
      expandedWidth = 'w-[500px]';
      gridCols = 'grid-cols-3';
  }

  return (
    <div
      className={`
        glass-panel rounded-xl p-0 transition-all border-2 overflow-hidden flex flex-col
        ${isExpanded ? expandedWidth : 'w-64'}
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-white/10'}
        ${isEmpty ? 'border-dashed border-slate-700 bg-slate-900/40' : 'bg-slate-900/90'}
        hover:border-blue-500/50 cursor-pointer
      `}
    >
      {/* Top Handle - Input */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20 -mt-1.5"
      />

      {/* Decorative Spine/Header Area */}
      {!isEmpty && (
        <div className={`h-1.5 w-full ${getDimensionColor(data.dimension).bg}`} />
      )}

      {/* Work Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEmpty ? (
              <div className="text-slate-500 text-sm py-2 text-center italic">
                New Project (Click to Define)
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                   <div className={`p-1.5 rounded-lg bg-slate-800/50 border border-white/5`}>
                      <Icon size={14} className={getDimensionColor(data.dimension).text} />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                      {data.element}
                   </span>
                </div>
                <h3 className="text-white font-bold text-lg leading-tight truncate tracking-tight">
                  {data.label}
                </h3>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {!isEmpty && (
              isComplete ? (
                <CheckCircle size={18} className="text-emerald-500" />
              ) : (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {Math.round((data.activities?.filter(a => a.status === 'done').length / (data.activities?.length || 1)) * 100)}%
                    </span>
                    <div className="w-12 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(data.activities?.filter(a => a.status === 'done').length / (data.activities?.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>
              )
            )}
            {!isEmpty && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  data.onExpandToggle?.();
                }}
                className="p-1.5 ml-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && !isEmpty && (
          <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-white/5 mt-1">
            
            {/* Target Outcome */}
            {data.targetOutcome && (
              <div className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-white/5 italic">
                <Target size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span>"{data.targetOutcome}"</span>
              </div>
            )}

            {/* Activities Grid */}
            {data.activities && data.activities.length > 0 && (
              <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    Activities ({data.activities.length})
                    <div className="h-px bg-slate-800 flex-1"></div>
                 </div>
                 <div className={`grid ${gridCols} gap-2`}>
                     {data.activities.map((act, i) => (
                       <div 
                            key={i} 
                            className={`
                                flex flex-col p-2 rounded-lg border transition-all
                                ${act.status === 'done' 
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100' 
                                    : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800/60 hover:border-white/10'
                                }
                            `}
                       >
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold opacity-50">#{i+1}</span>
                              {act.status === 'done' && <CheckCircle size={10} className="text-emerald-500" />}
                          </div>
                          <span className={`text-xs font-medium truncate ${act.status === 'done' ? 'line-through opacity-50' : ''}`}>
                            {act.title}
                          </span>
                          {act.timeEstimate && (
                              <div className="mt-1 text-[10px] opacity-50 flex items-center gap-1">
                                  <Clock size={8} /> {act.timeEstimate}h
                              </div>
                          )}
                       </div>
                     ))}
                 </div>
              </div>
            )}

            {/* Resources & Links Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <div className="flex gap-3">
                    {data.resources?.timeEstimate && (
                        <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded">
                            <Clock size={12} className="text-orange-400" />
                            <span className="text-slate-300">{data.resources.timeEstimate}h</span> total
                        </span>
                    )}
                    {data.resources?.tools?.length > 0 && (
                        <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded">
                            <Wrench size={12} className="text-purple-400" />
                            <span className="text-slate-300">{data.resources.tools.length}</span> tools
                        </span>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onEdit?.();
                    }}
                    className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-500 rounded transition-colors"
                    title="Edit Project"
                   >
                      <Edit2 size={14} />
                   </button>
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onDelete?.();
                    }}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-colors"
                    title="Delete Project"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Handle - Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20 -mb-1.5"
      />
    </div>
  );
}

function getDimensionColor(dimension) {
  const colors = {
    content: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    practice: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    community: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
    marketing: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    admin: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  };
  return colors[dimension] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };
}

export default memo(WorkNode);
