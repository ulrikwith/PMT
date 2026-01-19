import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import api from '../services/api';
import TagSelector from './TagSelector';

export default function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapture = async () => {
    if (!description.trim() || tags.length === 0) {
        alert("Please add a description and at least one tag.");
        return;
    }

    setIsSubmitting(true);
    try {
      // Create task with selected tags, no default "practice" or "insight"
      await api.createTask({
        title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
        description: description,
        tags: tags // User MUST select these
      });

      setDescription('');
      setTags([]);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to capture:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden">
      {isOpen ? (
        <div className="glass-panel rounded-2xl p-6 w-96 shadow-2xl border-blue-500/20 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Quick Add</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <X size={18} />
            </button>
          </div>
          
          <textarea
            className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none mb-4"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you want to add?"
            autoFocus
            disabled={isSubmitting}
          />

          <div className="mb-4">
              <span className="text-xs text-slate-500 mb-2 block">Required: Select Dimensions</span>
              <div className="max-h-32 overflow-y-auto">
                <TagSelector selectedTags={tags} onChange={setTags} />
              </div>
          </div>
          
          <button 
            onClick={handleCapture}
            disabled={isSubmitting || !description.trim() || tags.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Add to System'}
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-full shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
        >
          <Lightbulb size={20} className="group-hover:animate-pulse" />
          Quick Add
        </button>
      )}
    </div>
  );
}