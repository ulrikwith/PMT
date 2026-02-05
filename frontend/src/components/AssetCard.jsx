import React, { useState } from 'react';
import { Package, Edit3, Archive, ChevronDown, ChevronUp, Link2, Calendar, Target } from 'lucide-react';
import PhaseTransition from './PhaseTransition';
import { getDimensionConfig } from '../constants/taxonomy';

const PHASE_COLORS = {
  concept: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  development: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  launch: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  growth: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  maturity: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  decline: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  sunset: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const TYPE_LABELS = {
  product: 'Product',
  service: 'Service',
  offering: 'Offering',
  program: 'Program',
};

const DIMENSION_DOT_COLORS = {
  content: 'bg-blue-500',
  practice: 'bg-emerald-500',
  community: 'bg-pink-500',
  marketing: 'bg-amber-500',
  admin: 'bg-purple-500',
};

export default function AssetCard({ asset, onEdit, onArchive, onUpdatePhase }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  const phaseColor = PHASE_COLORS[asset.phase] || PHASE_COLORS.concept;
  const dimConfig = getDimensionConfig(asset.dimension);
  const dotColor = DIMENSION_DOT_COLORS[asset.dimension] || 'bg-slate-500';

  const linkedTaskCount = (asset.linked_task_ids || []).length;
  const hasNextMilestone = asset.next_milestone && asset.next_milestone.trim();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="glass-panel rounded-xl p-5 group hover:border-blue-500/30 transition-all">
      {/* Top Row: Name + Actions */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Dimension dot */}
            {asset.dimension && (
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} title={dimConfig?.label || asset.dimension} />
            )}
            <h3 className="text-lg font-bold text-white truncate">{asset.name}</h3>
          </div>

          {asset.description && (
            <p className="text-slate-400 text-sm line-clamp-2 mt-1">{asset.description}</p>
          )}
        </div>

        {/* Hover Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <button
            onClick={() => onEdit(asset)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onArchive(asset.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
            title="Archive"
          >
            <Archive size={14} />
          </button>
        </div>
      </div>

      {/* Badges Row: Type + Phase */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Type badge */}
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
          {TYPE_LABELS[asset.type] || asset.type}
        </span>

        {/* Phase pill (clickable) */}
        <div className="relative">
          <button
            onClick={() => setShowPhaseMenu(!showPhaseMenu)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all hover:brightness-125 ${phaseColor.bg} ${phaseColor.text} ${phaseColor.border}`}
          >
            {asset.phase.charAt(0).toUpperCase() + asset.phase.slice(1)}
          </button>
          {showPhaseMenu && (
            <PhaseTransition
              currentPhase={asset.phase}
              onSelect={(phase) => {
                onUpdatePhase(asset.id, phase);
                setShowPhaseMenu(false);
              }}
              onClose={() => setShowPhaseMenu(false)}
            />
          )}
        </div>

        {/* Dimension label */}
        {dimConfig && (
          <span className="text-xs text-slate-500">{dimConfig.label}</span>
        )}

        {/* Linked tasks badge */}
        {linkedTaskCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-500" title={`${linkedTaskCount} linked task${linkedTaskCount !== 1 ? 's' : ''}`}>
            <Link2 size={11} />
            {linkedTaskCount}
          </span>
        )}
      </div>

      {/* Focus & Milestone */}
      {(asset.current_focus || hasNextMilestone) && (
        <div className="mt-3 space-y-1">
          {asset.current_focus && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Target size={11} className="flex-shrink-0 text-blue-400" />
              <span className="truncate">{asset.current_focus}</span>
            </div>
          )}
          {hasNextMilestone && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={11} className="flex-shrink-0 text-amber-400" />
              <span className="truncate">
                {asset.next_milestone}
                {asset.next_milestone_date && (
                  <span className="text-slate-500 ml-1">· {formatDate(asset.next_milestone_date)}</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-all"
      >
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {isExpanded ? 'Less' : 'More'}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {asset.purpose && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purpose</span>
              <p className="text-sm text-slate-300 mt-1">{asset.purpose}</p>
            </div>
          )}
          {asset.audience && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience</span>
              <p className="text-sm text-slate-300 mt-1">{asset.audience}</p>
            </div>
          )}
          {asset.phase_history && asset.phase_history.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phase History</span>
              <div className="mt-1 space-y-1">
                {asset.phase_history.map((entry, i) => (
                  <div key={i} className="text-xs text-slate-400">
                    {entry.from} → {entry.to}
                    <span className="text-slate-600 ml-1">· {formatDate(entry.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-slate-600">
            Created {formatDate(asset.created_at)}
            {asset.updated_at !== asset.created_at && ` · Updated ${formatDate(asset.updated_at)}`}
          </div>
        </div>
      )}
    </div>
  );
}
