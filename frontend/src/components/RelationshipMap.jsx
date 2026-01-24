import React, { useState, useEffect } from 'react';
import { ArrowRight, Link, Trash2 } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import api from '../services/api';

export default function RelationshipMap({ taskId, relationships, onUpdate }) {
  const { tasks } = useTasks();
  const [relatedTasks, setRelatedTasks] = useState([]);

  // Group relationships by type
  const grouped = relationships.reduce((acc, rel) => {
    const type = rel.type;
    if (!acc[type]) acc[type] = [];

    // Determine if this task is 'from' or 'to'
    const isFrom = rel.fromTaskId === taskId;
    const otherId = isFrom ? rel.toTaskId : rel.fromTaskId;

    acc[type].push({
      ...rel,
      otherTaskId: otherId,
      direction: isFrom ? 'outgoing' : 'incoming',
    });
    return acc;
  }, {});

  useEffect(() => {
    // Resolve related task details from global tasks state
    if (relationships.length === 0) {
      setRelatedTasks([]);
      return;
    }

    const related = relationships
      .map((rel) => {
        const otherId = rel.fromTaskId === taskId ? rel.toTaskId : rel.fromTaskId;
        const task = tasks.find((t) => t.id === otherId);
        if (!task) return null;

        return {
          relationshipId: rel.id,
          ...task,
          relationshipType: rel.type,
          direction: rel.fromTaskId === taskId ? 'outgoing' : 'incoming',
        };
      })
      .filter((t) => t !== null);

    setRelatedTasks(related);
  }, [relationships, taskId, tasks]);

  const handleDelete = async (relId) => {
    if (window.confirm('Remove this relationship?')) {
      await api.deleteRelationship(relId);
      onUpdate && onUpdate();
    }
  };

  if (relationships.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Link size={14} /> Related Tasks
      </h4>

      {
        <div className="space-y-3">
          {Object.entries(grouped).map(([type, rels]) => (
            <div key={type}>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
                {type.replace('-', ' ')}
              </span>
              <div className="space-y-1">
                {rels.map((rel) => {
                  const task = relatedTasks.find((t) => t.id === rel.otherTaskId);
                  if (!task) return null;

                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between group p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-slate-400">
                          {rel.direction === 'outgoing' ? (
                            <ArrowRight size={12} />
                          ) : (
                            <ArrowRight size={12} className="rotate-180" />
                          )}
                        </span>
                        <span className="text-sm text-slate-700 truncate">{task.title}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            task.status === 'Done'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(rel.id)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
