import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Book, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function WorkNode({ data, selected }) {
  const isEmpty = data.status === 'empty';
  const isComplete = data.status === 'complete';
  
  return (
    <div
      className={`
        glass-panel rounded-xl p-4 w-64 border-2 transition-all
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
          <div className="flex-1">
            {isEmpty ? (
              <div className="text-slate-500 text-sm py-2 text-center italic">
                New Work (Click to Define)
              </div>
            ) : (
              <>
                <h3 className="text-white font-semibold leading-tight mb-1">
                  {data.label}
                </h3>
                {data.element && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={`w-2 h-2 rounded-full ${getDimensionColor(data.dimension)}`}></div>
                    <span>{data.element}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {!isEmpty && (
            <div className="flex-shrink-0 ml-2">
              {isComplete ? (
                <CheckCircle size={18} className="text-emerald-500" />
              ) : (
                <Clock size={18} className="text-orange-500" />
              )}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {!isEmpty && data.activities && data.activities.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Activities</span>
              <span>
                {data.activities.filter(a => a.status === 'done').length} / {data.activities.length}
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

        {/* Resources Summary */}
        {!isEmpty && data.resources && (
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-white/5">
            {data.resources.timeEstimate && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {data.resources.timeEstimate}h
              </span>
            )}
            {data.resources.tools && data.resources.tools.length > 0 && (
              <span className="flex items-center gap-1">
                <Book size={12} />
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
    content: 'bg-blue-500',
    practice: 'bg-emerald-500',
    community: 'bg-pink-500',
    marketing: 'bg-amber-500',
    admin: 'bg-purple-500',
  };
  return colors[dimension] || 'bg-slate-500';
}

export default memo(WorkNode);
