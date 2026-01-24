import React, { useState, useEffect } from 'react';
import { Target, Link as LinkIcon, Plus, Check } from 'lucide-react';
import api from '../services/api';

export default function MilestoneLinker({ taskId, onUpdate }) {
  const [milestones, setMilestones] = useState([]);
  const [linkedMilestoneId, setLinkedMilestoneId] = useState(null); // Assuming 1 link for simplicity, but could be many
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchMilestones();
    checkExistingLink();
  }, [taskId]);

  const fetchMilestones = async () => {
    try {
      const data = await api.getMilestones();
      setMilestones(data);
    } catch (e) {
      console.error('Failed to fetch milestones', e);
    }
  };

  const checkExistingLink = async () => {
    // This is a bit inefficient as we have to check each milestone or have an API for it.
    // For V1, let's just assume we don't show existing links here immediately
    // unless we add an endpoint like `getTaskMilestones(taskId)`.
    // The current backend doesn't have `getTaskMilestones`.
    // We can skip this visual indication for now or add the endpoint.
    // Let's rely on the user linking.
  };

  const handleLink = async (milestoneId) => {
    setLoading(true);
    try {
      await api.linkTaskToMilestone(taskId, milestoneId);
      setLinkedMilestoneId(milestoneId);
      setIsExpanded(false);
      onUpdate && onUpdate();
    } catch (e) {
      console.error('Failed to link milestone', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
        <Target size={14} /> Launch Milestone
      </h4>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors border border-dashed border-slate-700 rounded-md px-3 py-2 w-full hover:border-blue-500/50"
        >
          <Plus size={12} /> Link to a Launch Milestone
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-md overflow-hidden animate-in fade-in zoom-in-95">
          <div className="max-h-48 overflow-y-auto">
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => handleLink(m.id)}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex justify-between items-center group"
              >
                <span className="truncate pr-2">{m.name}</span>
                {linkedMilestoneId === m.id && <Check size={14} className="text-green-500" />}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full text-center text-xs text-slate-500 bg-slate-950/50 py-1 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
