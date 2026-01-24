import React, { useState, useEffect } from 'react';
import { Plus, X, Hash } from 'lucide-react';
import api from '../services/api';

export default function TagSelector({ selectedTags, onChange }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await api.getTags(); // Expected to return array of tags
      setAvailableTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await api.createTag({ name: newTagName.trim(), color: '#888888' });
      setAvailableTags([...availableTags, newTag]);
      onChange([...selectedTags, newTagName.trim()]);
      setNewTagName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  };

  const toggleTag = (tagName) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  // Helper to determine tag color class
  const getTagClass = (tagName, isSelected) => {
    const lower = tagName.toLowerCase();
    const baseClass =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ';

    // Helper for groups
    const isContent = ['substack', 'newsletter', 'books'].some((t) => lower.includes(t));
    const isPractice = ['practice', 'stone', 'walk', 'b2b'].some((t) => lower.includes(t));
    const isCommunity = ['community', 'mission', 'development', 'first30'].some((t) =>
      lower.includes(t)
    );
    const isMarketing = ['marketing', 'bopa', 'website'].some((t) => lower.includes(t));
    const isAdmin = ['admin', 'planning', 'accounting', 'infra'].some((t) => lower.includes(t));

    if (isSelected) {
      if (lower.includes('substack'))
        return (
          baseClass +
          'bg-orange-500/20 text-orange-500 border-orange-500/40 shadow-[0_0_10px_rgba(255,103,25,0.1)]'
        );
      if (lower.includes('newsletter') || lower.includes('content'))
        return (
          baseClass +
          'bg-blue-500/20 text-blue-500 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
        );
      if (lower.includes('books'))
        return (
          baseClass +
          'bg-indigo-500/20 text-indigo-500 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
        );

      if (isPractice)
        return (
          baseClass +
          'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
        );
      if (isAdmin)
        return (
          baseClass +
          'bg-purple-500/20 text-purple-500 border-purple-500/40 shadow-[0_0_10px_rgba(139,92,246,0.1)]'
        );
      if (isMarketing)
        return (
          baseClass +
          'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
        );
      if (isCommunity)
        return (
          baseClass +
          'bg-pink-500/20 text-pink-500 border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
        );

      return baseClass + 'bg-slate-600 text-white border-slate-500';
    } else {
      if (lower.includes('substack'))
        return (
          baseClass +
          'bg-orange-500/5 text-orange-500/70 border-orange-500/10 hover:bg-orange-500/10'
        );
      if (lower.includes('newsletter') || lower.includes('content'))
        return baseClass + 'bg-blue-500/5 text-blue-500/70 border-blue-500/10 hover:bg-blue-500/10';
      if (lower.includes('books'))
        return (
          baseClass +
          'bg-indigo-500/5 text-indigo-500/70 border-indigo-500/10 hover:bg-indigo-500/10'
        );

      if (isPractice)
        return (
          baseClass +
          'bg-emerald-500/5 text-emerald-500/70 border-emerald-500/10 hover:bg-emerald-500/10'
        );
      if (isAdmin)
        return (
          baseClass +
          'bg-purple-500/5 text-purple-500/70 border-purple-500/10 hover:bg-purple-500/10'
        );
      if (isMarketing)
        return (
          baseClass + 'bg-amber-500/5 text-amber-500/70 border-amber-500/10 hover:bg-amber-500/10'
        );
      if (isCommunity)
        return baseClass + 'bg-pink-500/5 text-pink-500/70 border-pink-500/10 hover:bg-pink-500/10';

      return (
        baseClass +
        'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50 hover:text-slate-200'
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {loading && <span className="text-xs text-slate-500">Loading tags...</span>}

      {availableTags.map((tag) => (
        <button
          key={tag.name || tag} // Handle object or string
          type="button"
          onClick={() => toggleTag(tag.name || tag)}
          className={getTagClass(tag.name || tag, selectedTags.includes(tag.name || tag))}
        >
          <Hash size={12} />
          {tag.name || tag}
        </button>
      ))}

      {isCreating ? (
        <div className="flex items-center gap-2">
          <input
            className="px-3 py-1.5 bg-slate-900/60 border border-blue-500/50 rounded-full text-xs text-slate-200 focus:outline-none w-32 animate-fade-in"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTag();
              }
              if (e.key === 'Escape') {
                setIsCreating(false);
              }
            }}
            placeholder="New tag..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-500 transition-all"
        >
          <Plus size={12} />
          Tag
        </button>
      )}
    </div>
  );
}
