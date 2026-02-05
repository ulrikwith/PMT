import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Eye,
  Sprout,
  Briefcase,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useTasks } from '../context/TasksContext';
import { useVision } from '../context/VisionContext';
import { useExploration } from '../context/ExplorationContext';
import { DIMENSIONS } from '../constants/taxonomy';
import { useNavigate } from 'react-router-dom';

// Static Tailwind class map for dimension colors
const dimColorClasses = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/20',    dot: 'bg-pink-500' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-500' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  dot: 'bg-purple-500' },
};

function AlivenessDisplay({ score }) {
  if (score === null || score === undefined) return <span className="text-slate-600">--</span>;
  const labels = ['', 'Drained', 'Low', 'Neutral', 'Alive', 'On Fire'];
  return (
    <span className={`text-sm font-medium ${
      score >= 4 ? 'text-amber-400' : score >= 3 ? 'text-slate-300' : 'text-pink-400'
    }`}>
      {score.toFixed(1)} <span className="text-xs text-slate-500">{labels[Math.round(score)]}</span>
    </span>
  );
}

export default function JourneyPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { tasks } = useTasks();
  const { visions } = useVision();
  const { visions: explorations } = useExploration();
  const navigate = useNavigate();
  const [expandedDim, setExpandedDim] = useState(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Journey', icon: Compass }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Compute per-dimension stats
  const dimensionStats = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const dimId = dim.id;
      const colors = dimColorClasses[dim.color] || dimColorClasses.purple;

      // Vision
      const vision = visions?.[dimId];
      const overallVision = vision?.overall || '';
      const hasVision = !!overallVision;

      // Explorations
      const dimExplorations = Array.isArray(explorations)
        ? explorations.filter((v) => {
            // Check if any potential maps to this dimension
            const contentTypes = ['book', 'article-series', 'substack', 'course', 'podcast', 'video-series'];
            const practiceTypes = ['method', 'practice', 'workshop', 'retreat'];
            const communityTypes = ['community', 'circle', 'event', 'facilitation'];
            const hasContentPotential = v.potentials?.some((p) => contentTypes.includes(p.type));
            const hasPracticePotential = v.potentials?.some((p) => practiceTypes.includes(p.type));
            const hasCommunityPotential = v.potentials?.some((p) => communityTypes.includes(p.type));

            if (dimId === 'content') return hasContentPotential;
            if (dimId === 'practice') return hasPracticePotential;
            if (dimId === 'community') return hasCommunityPotential;
            return false;
          })
        : [];

      // Tasks in this dimension
      const dimTasks = tasks.filter((t) =>
        t.tags?.some((tag) => tag.toLowerCase() === dimId)
      );
      const activeTasks = dimTasks.filter((t) => t.status !== 'Done' && !t.deletedAt);
      const completedTasks = dimTasks.filter((t) => t.status === 'Done');
      const reflectedTasks = completedTasks.filter((t) => t.impactReflection);
      const unreflectedCount = completedTasks.length - reflectedTasks.length;

      // Average aliveness
      let avgAliveness = null;
      if (reflectedTasks.length > 0) {
        const total = reflectedTasks.reduce(
          (sum, t) => sum + (t.impactReflection?.alivenessLevel || 0),
          0
        );
        avgAliveness = total / reflectedTasks.length;
      }

      // Tasks with vision origin
      const tasksFromExploration = dimTasks.filter((t) => t.visionOrigin);

      return {
        dim,
        colors,
        overallVision,
        hasVision,
        explorationCount: dimExplorations.length,
        explorations: dimExplorations,
        activeCount: activeTasks.length,
        activeTasks,
        completedCount: completedTasks.length,
        completedTasks,
        reflectedCount: reflectedTasks.length,
        unreflectedCount,
        avgAliveness,
        tasksFromExploration,
      };
    });
  }, [tasks, visions, explorations]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Compass size={28} className="text-blue-400" />
          Journey Overview
        </h1>
        <p className="text-slate-400 mt-2">
          Vision to work to impact — across all dimensions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">Visions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {dimensionStats.filter((s) => s.hasVision).length}
            <span className="text-sm text-slate-500 font-normal"> / 5</span>
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sprout size={16} className="text-emerald-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">Explorations</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {dimensionStats.reduce((s, d) => s + d.explorationCount, 0)}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">Active Work</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {dimensionStats.reduce((s, d) => s + d.activeCount, 0)}
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">Reflected</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {dimensionStats.reduce((s, d) => s + d.reflectedCount, 0)}
            <span className="text-sm text-slate-500 font-normal">
              {' '}/ {dimensionStats.reduce((s, d) => s + d.completedCount, 0)}
            </span>
          </p>
        </div>
      </div>

      {/* Dimension Rows */}
      <div className="space-y-3">
        {dimensionStats.map(({
          dim, colors, overallVision, hasVision,
          explorationCount, activeCount, completedCount,
          unreflectedCount, avgAliveness,
          activeTasks, completedTasks, explorations: dimExplorations,
        }) => {
          const isExpanded = expandedDim === dim.id;
          const DimIcon = dim.icon;

          return (
            <div
              key={dim.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isExpanded ? `${colors.border} bg-slate-900/70` : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {/* Row Header */}
              <button
                onClick={() => setExpandedDim(isExpanded ? null : dim.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                  <DimIcon size={18} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-bold text-white">{dim.label}</h3>
                  {hasVision && (
                    <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">
                      {overallVision}
                    </p>
                  )}
                </div>

                {/* Stats columns */}
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-center w-16">
                    <p className={`font-bold ${hasVision ? 'text-white' : 'text-slate-600'}`}>
                      {hasVision ? 'Set' : 'None'}
                    </p>
                    <p className="text-slate-500">Vision</p>
                  </div>
                  <div className="text-center w-16">
                    <p className={`font-bold ${explorationCount > 0 ? 'text-white' : 'text-slate-600'}`}>
                      {explorationCount}
                    </p>
                    <p className="text-slate-500">Explore</p>
                  </div>
                  <div className="text-center w-16">
                    <p className={`font-bold ${activeCount > 0 ? 'text-white' : 'text-slate-600'}`}>
                      {activeCount}
                    </p>
                    <p className="text-slate-500">Active</p>
                  </div>
                  <div className="text-center w-16">
                    <p className={`font-bold ${completedCount > 0 ? 'text-white' : 'text-slate-600'}`}>
                      {completedCount}
                    </p>
                    <p className="text-slate-500">Done</p>
                  </div>
                  <div className="text-center w-20">
                    <AlivenessDisplay score={avgAliveness} />
                    <p className="text-slate-500">Aliveness</p>
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
                  {/* Full Vision */}
                  {hasVision && (
                    <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={14} className="text-purple-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Vision</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed italic">
                        "{overallVision}"
                      </p>
                    </div>
                  )}

                  {/* Explorations */}
                  {dimExplorations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sprout size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Explorations</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {dimExplorations.map((exp) => (
                          <div key={exp.id} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                            <p className="text-sm font-medium text-white truncate">{exp.title}</p>
                            {exp.potentials?.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">
                                {exp.potentials.length} potential{exp.potentials.length !== 1 ? 's' : ''}
                                {exp.potentials.some((p) => p.createdAsWorkId) && (
                                  <span className="text-emerald-400 ml-1">
                                    ({exp.potentials.filter((p) => p.createdAsWorkId).length} active)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Work */}
                  {activeTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={14} className="text-blue-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Active Work</span>
                      </div>
                      <div className="space-y-1.5">
                        {activeTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center gap-3 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                            <span className="text-sm text-slate-200 truncate flex-1">{task.title}</span>
                            {task.visionOrigin && (
                              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                from exploration
                              </span>
                            )}
                          </div>
                        ))}
                        {activeTasks.length > 5 && (
                          <p className="text-xs text-slate-500 pl-5">
                            +{activeTasks.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Impact Reflections */}
                  {completedTasks.some((t) => t.impactReflection) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Recent Reflections</span>
                      </div>
                      <div className="space-y-1.5">
                        {completedTasks
                          .filter((t) => t.impactReflection)
                          .slice(0, 3)
                          .map((task) => (
                            <div key={task.id} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white truncate">{task.title}</span>
                                <AlivenessDisplay score={task.impactReflection.alivenessLevel} />
                              </div>
                              {task.impactReflection.innerShift && (
                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                  {task.impactReflection.innerShift}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Gaps / Nudges */}
                  {unreflectedCount > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
                      <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-300">
                        {unreflectedCount} completed project{unreflectedCount !== 1 ? 's' : ''} without reflection
                      </p>
                    </div>
                  )}

                  {!hasVision && (
                    <button
                      onClick={() => navigate(`/board?dimension=${dim.id}`)}
                      className="text-xs text-slate-500 hover:text-purple-400 transition-colors flex items-center gap-1"
                    >
                      Set a vision for {dim.label} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
