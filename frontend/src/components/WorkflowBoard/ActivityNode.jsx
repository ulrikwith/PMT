import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Check, Circle, Clock } from 'lucide-react';

function ActivityNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';

  return (
    <div
      className={`
        glass-panel rounded-lg p-3 w-48 border transition-all
        ${selected ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-white/5'}
        ${isDone ? 'bg-emerald-500/5 border-emerald-500/20' : ''}
        ${isInProgress ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-900/60'}
        hover:border-blue-500/50 cursor-pointer
      `}
    >
      {/* Top Handle - Input from Parent Work */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-slate-500 border border-white/20"
      />

      {/* Activity Content */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Check size={12} className="text-emerald-500" />
            </div>
          ) : isInProgress ? (
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Clock size={12} className="text-blue-500 animate-pulse" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-700/30 border border-slate-700/30 flex items-center justify-center">
              <Circle size={12} className="text-slate-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}
          >
            {data.label}
          </p>
          {data.timeEstimate && (
            <p className="text-xs text-slate-500 mt-0.5">{data.timeEstimate}h</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ActivityNode);
