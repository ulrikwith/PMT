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
  Circle
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
  
  return (
    <div
      className={`
        glass-panel rounded-xl p-4 transition-all border-2
        ${isExpanded ? 'w-80' : 'w-64'}
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-white/10'}
        ${isEmpty ? 'border-dashed border-slate-700 bg-slate-900/40' : 'bg-slate-900/80'}
        hover:border-blue-500/50 cursor-pointer
      `}
    >
      {/* Top Handle - Input */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20"
      />

      {/* Work Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEmpty ? (
              <div className="text-slate-500 text-sm py-2 text-center italic">
                New Work (Click to Define)
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                   <div className={`p-1 rounded-md ${getDimensionColor(data.dimension).bg}`}>
                      <Icon size={14} className={getDimensionColor(data.dimension).text} />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                      {data.element}
                   </span>
                </div>
                <h3 className="text-white font-semibold leading-tight truncate">
                  {data.label}
                </h3>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {!isEmpty && (
              isComplete ? (
                <CheckCircle size={16} className="text-emerald-500" />
              ) : (
                <Clock size={16} className="text-orange-500" />
              )
            )}
            {!isEmpty && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  data.onExpandToggle?.();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        {!isEmpty && data.activities && data.activities.length > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>Progress</span>
              <span>
                {Math.round((data.activities.filter(a => a.status === 'done').length / data.activities.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{
                  width: `${(data.activities.filter(a => a.status === 'done').length / data.activities.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && !isEmpty && (
          <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Target Outcome */}
            {data.targetOutcome && (
              <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <Target size={10} /> Target Outcome
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.targetOutcome}
                </p>
              </div>
            )}

            {/* Activities Checklist */}
            {data.activities && data.activities.length > 0 && (
              <div className="space-y-1">
                 <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activities</div>
                 {data.activities.map((act, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-white/5 transition-colors">
                      {act.status === 'done' ? (
                        <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle size={12} className="text-slate-600 flex-shrink-0" />
                      )}
                      <span className={`truncate ${act.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {act.title}
                      </span>
                   </div>
                 ))}
              </div>
            )}

            {/* Cross-Dimension Links */}
            {data.crossLinks && data.crossLinks.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cross-Board Links</div>
                {data.crossLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onJumpToWork?.(link.targetId, link.targetDimension);
                    }}
                    className="w-full flex items-center justify-between gap-2 text-[10px] py-1.5 px-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${getDimensionColor(link.targetDimension).bg}`} />
                      <span className="text-slate-300 truncate font-medium">{link.targetTitle}</span>
                    </div>
                    <span className="text-slate-500 group-hover:text-blue-400 font-bold uppercase shrink-0">
                      {link.targetDimension} →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/5">
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit?.();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded transition-colors"
               >
                  <Edit2 size={10} /> Edit
               </button>
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete?.();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded transition-colors"
               >
                  <Trash2 size={10} /> Delete
               </button>
            </div>
          </div>
        )}

        {/* Resources Summary (Visible when not expanded or as footer) */}
        {!isEmpty && data.resources && (
          <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-white/5">
            {data.resources.timeEstimate && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {data.resources.timeEstimate}h
              </span>
            )}
            {data.resources.tools && data.resources.tools.length > 0 && (
              <span className="flex items-center gap-1">
                <Book size={10} />
                {data.resources.tools.length} tools
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Handle - Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20"
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

export default memo(WorkNode);
