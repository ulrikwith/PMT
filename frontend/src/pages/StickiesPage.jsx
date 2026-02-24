import React, { useState, useEffect, useCallback } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useStickies } from '../context/StickiesContext';
import StickyCard from '../components/Stickies/StickyCard';
import StickyEditor from '../components/Stickies/StickyEditor';

export default function StickiesPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { stickies, loading, error, fetchStickies, addSticky, updateSticky, deleteSticky, bringToFront } = useStickies();
  const [editingSticky, setEditingSticky] = useState(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Stickies', icon: StickyNote }]);
    fetchStickies();
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, fetchStickies]);

  const handleAddSticky = useCallback(async () => {
    // Stagger position for new stickies
    const offset = (stickies.length % 8) * 30;
    try {
      const newSticky = await addSticky({
        title: 'New Sticky',
        content: '',
        color: ['sand', 'clay', 'sage', 'rust', 'slate', 'ochre'][stickies.length % 6],
        x: 40 + offset,
        y: 40 + offset,
      });
      setEditingSticky(newSticky);
    } catch {
      // Error handled in context
    }
  }, [addSticky, stickies.length]);

  const handleOpenEditor = useCallback((sticky) => {
    setEditingSticky(sticky);
  }, []);

  const handleSaveEditor = useCallback(async (updates) => {
    if (!editingSticky?.blueId) return;
    try {
      await updateSticky(editingSticky.blueId, updates);
    } catch {
      // Error handled in context
    }
  }, [editingSticky, updateSticky]);

  const handleCloseEditor = useCallback(() => {
    setEditingSticky(null);
  }, []);

  const handleDragEnd = useCallback(async (blueId, newX, newY) => {
    try {
      await updateSticky(blueId, { x: Math.round(newX), y: Math.round(newY) });
    } catch {
      // Error handled in context
    }
  }, [updateSticky]);

  const handleDelete = useCallback(async (blueId) => {
    try {
      await deleteSticky(blueId);
      if (editingSticky?.blueId === blueId) {
        setEditingSticky(null);
      }
    } catch {
      // Error handled in context
    }
  }, [deleteSticky, editingSticky]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-500">
        <div className="animate-pulse">Loading stickies...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-200">Stickies Wall</h2>
          <span className="text-xs text-slate-500">{stickies.length} notes</span>
        </div>
        <button
          onClick={handleAddSticky}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300 transition-all text-sm font-medium"
        >
          <Plus size={16} />
          Add Sticky
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load stickies: {error}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative bg-slate-900/50 rounded-xl border border-white/5 overflow-auto min-h-[500px]">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {stickies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <StickyNote size={48} className="opacity-30" />
            <p className="text-sm">No stickies yet. Click "Add Sticky" to create one.</p>
          </div>
        ) : (
          <div className="relative w-full h-full min-h-[500px]" style={{ minWidth: '100%' }}>
            {stickies.map((sticky) => (
              <StickyCard
                key={sticky.blueId}
                sticky={sticky}
                onOpen={() => handleOpenEditor(sticky)}
                onDelete={() => handleDelete(sticky.blueId)}
                onDragEnd={(newX, newY) => handleDragEnd(sticky.blueId, newX, newY)}
                onBringToFront={() => bringToFront(sticky.blueId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editingSticky && (
        <StickyEditor
          sticky={editingSticky}
          onSave={handleSaveEditor}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
