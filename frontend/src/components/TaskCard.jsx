import React, { useState, useEffect } from 'react';
import { Hash, Activity, Check, Pause, Clock, Edit2, X, Save, Trash2, ChevronDown } from 'lucide-react';
import TagSelector from './TagSelector';
import RelationshipMap from './RelationshipMap';
import ContentPracticeLinker from './ContentPracticeLinker';
import MilestoneLinker from './MilestoneLinker';
import api from '../services/api';

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDesc, setEditedDesc] = useState(task.description);
  const [editedTags, setEditedTags] = useState(task.tags || []);
  const [relationships, setRelationships] = useState([]);

  // Fetch relationships when expanded
  useEffect(() => {
    if (isExpanded) {
        fetchRelationships();
    }
  }, [isExpanded, task.id]);

  const fetchRelationships = async () => {
      try {
          const data = await api.getTaskRelationships(task.id);
          setRelationships(data);
      } catch (e) {
          console.error("Failed to fetch relationships", e);
      }
  };

  const handleSave = async () => {
    await onUpdate(task.id, {
        title: editedTitle,
        description: editedDesc,
        tags: editedTags
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(task.title);
    setEditedDesc(task.description);
    setEditedTags(task.tags || []);
    setIsEditing(false);
  };

  // Determine status styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'Paused': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done': return <Check size={12} />;
      case 'Paused': return <Pause size={12} />;
      default: return <Activity size={12} className="animate-pulse" />;
    }
  };

  // Determine tag style
  const getTagStyle = (tagName) => {
    const lower = tagName.toLowerCase();
    const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ";
    
    // Groups
    const isPractice = ['practice', 'stone', 'walk', 'b2b'].some(t => lower.includes(t));
    const isCommunity = ['community', 'mission', 'development', 'first30'].some(t => lower.includes(t));
    const isMarketing = ['marketing', 'bopa', 'website'].some(t => lower.includes(t));
    const isAdmin = ['admin', 'planning', 'accounting', 'infra'].some(t => lower.includes(t));

    if (lower.includes('substack')) return base + "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (lower.includes('newsletter') || lower.includes('content')) return base + "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (lower.includes('books')) return base + "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    
    if (isPractice) return base + "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (isAdmin) return base + "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (isMarketing) return base + "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (isCommunity) return base + "bg-pink-500/10 text-pink-500 border-pink-500/20";
    
    return base + "bg-slate-700/30 text-slate-400 border-slate-700/30";
  };

  if (isEditing) {
      return (
        <div className="glass-panel rounded-xl p-5 border border-blue-500/30 bg-blue-500/5 mb-4">
            <div className="space-y-4">
                <input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Task Title"
                    autoFocus
                />
                <textarea
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-slate-300 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Description"
                    rows={3}
                />
                
                <div>
                    <label className="text-xs text-slate-500 block mb-2">Tags</label>
                    <TagSelector selectedTags={editedTags} onChange={setEditedTags} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={handleCancel} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <X size={14} /> Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2">
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={`glass-panel rounded-xl p-5 group hover:border-blue-500/30 transition-all duration-300 mb-4 ${isExpanded ? 'bg-slate-800/60 ring-1 ring-blue-500/20' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2 mb-2">
             <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                {task.title}
             </h3>
          </div>
         
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            {task.description || <span className="italic text-slate-600">No description</span>}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {task.tags && task.tags.map(tag => (
              <span key={tag} className={getTagStyle(tag)}>
                <Hash size={12} />
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Actions & Status */}
        <div className="flex flex-col items-end gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                {getStatusIcon(task.status)}
                <span>{task.status}</span>
            </div>
            
            <div className={`flex gap-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Edit Task"
                 >
                    <Edit2 size={16} />
                 </button>
                 <button 
                    onClick={() => onUpdate(task.id, { status: task.status === 'Done' ? 'In Progress' : 'Done' })} 
                    className="p-2 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                    title={task.status === 'Done' ? 'Mark In Progress' : 'Mark Done'}
                 >
                    <Check size={16} />
                 </button>
                 <button 
                    onClick={() => onDelete(task.id)} 
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Task"
                 >
                    <Trash2 size={16} />
                 </button>
            </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
          <div className="mt-6 pt-6 border-t border-slate-700/50 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Metadata */}
                  <div className="w-full md:w-1/3 space-y-4">
                      <div className="text-xs text-slate-500">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={12}/> Updated {new Date(task.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity size={12}/> ID: {task.id.substring(0, 8)}...
                        </div>
                      </div>
                  </div>

                  {/* Right: Relationships & Linking */}
                  <div className="w-full md:w-2/3">
                      <h4 className="text-sm font-bold text-white mb-2">Connections</h4>
                      
                      <ContentPracticeLinker 
                        taskId={task.id} 
                        taskTags={task.tags || []} 
                        onUpdate={fetchRelationships}
                      />

                      <MilestoneLinker 
                         taskId={task.id}
                         onUpdate={fetchRelationships} // Optional, if we want to refresh something
                      />

                      <RelationshipMap 
                        taskId={task.id} 
                        relationships={relationships} 
                        onUpdate={fetchRelationships}
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}