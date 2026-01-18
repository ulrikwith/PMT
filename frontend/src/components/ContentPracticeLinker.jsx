import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Plus } from 'lucide-react';
import api from '../services/api';

export default function ContentPracticeLinker({ taskId, taskTags, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allTasks, setAllTasks] = useState([]);

  // Determine link direction based on current task type
  const isContent = taskTags.some(t => {
    const lower = t.toLowerCase();
    return lower.includes('substack') || lower.includes('newsletter') || lower.includes('books');
  });
  const isPractice = taskTags.some(t => t.includes('practice'));
  
  // If neither or both, we just show a generic "Link Task" interface
  const linkLabel = isContent ? 'Link to Practice' : (isPractice ? 'Link to Content' : 'Link Related Task');
  const defaultRelType = isContent ? 'generated-by' : (isPractice ? 'generates' : 'related-to');

  useEffect(() => {
    // Pre-fetch all tasks for search (client-side search for v1)
    const loadTasks = async () => {
        const data = await api.getTasks();
        setAllTasks(data.filter(t => t.id !== taskId)); // Exclude self
    };
    loadTasks();
  }, [taskId]);

  useEffect(() => {
      if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
      }
      
      const lowerQ = searchQuery.toLowerCase();
      const results = allTasks.filter(t => 
          t.title.toLowerCase().includes(lowerQ) || 
          (t.description && t.description.toLowerCase().includes(lowerQ))
      );
      setSearchResults(results.slice(0, 5)); // Limit to 5
  }, [searchQuery, allTasks]);

  const handleLink = async (targetTask) => {
      setIsSearching(true);
      try {
          await api.createRelationship({
              fromTaskId: taskId,
              toTaskId: targetTask.id,
              type: defaultRelType
          });
          setSearchQuery('');
          setSearchResults([]);
          onUpdate && onUpdate(); // Refresh parent to show new link in RelationshipMap
      } catch (e) {
          console.error("Failed to link", e);
      } finally {
          setIsSearching(false);
      }
  };

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <div className="pl-3 text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder={linkLabel + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {searchResults.map(result => (
              <button
                key={result.id}
                onClick={() => handleLink(result)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between group"
              >
                <div>
                    <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{result.title}</div>
                    <div className="text-xs text-slate-400 flex gap-1 mt-0.5">
                        {result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-slate-100 px-1 rounded">{tag}</span>
                        ))}
                    </div>
                </div>
                <div className="text-slate-300 group-hover:text-blue-500">
                    <Plus size={16} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Helper text */}
      <div className="mt-2 text-xs text-slate-500">
          Tip: {isContent ? 'Find the practice that inspired this.' : (isPractice ? 'Find content generated from this.' : 'Connect related tasks.')}
      </div>
    </div>
  );
}
