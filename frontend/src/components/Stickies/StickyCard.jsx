import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GripVertical, X } from 'lucide-react';

const STICKY_COLORS = {
  sand:    { bg: 'bg-[#D4C5A9]', header: 'bg-[#C4B393]', text: 'text-[#3D3526]', border: 'border-[#C4B393]/50', dot: 'bg-[#C4B393]' },
  clay:    { bg: 'bg-[#C9A88A]', header: 'bg-[#B8926E]', text: 'text-[#3A2A1A]', border: 'border-[#B8926E]/50', dot: 'bg-[#B8926E]' },
  sage:    { bg: 'bg-[#A8B8A0]', header: 'bg-[#8FA585]', text: 'text-[#2A3328]', border: 'border-[#8FA585]/50', dot: 'bg-[#8FA585]' },
  rust:    { bg: 'bg-[#C4917A]', header: 'bg-[#B07A62]', text: 'text-[#3A2218]', border: 'border-[#B07A62]/50', dot: 'bg-[#B07A62]' },
  slate:   { bg: 'bg-[#A8A8A0]', header: 'bg-[#918F85]', text: 'text-[#2C2C28]', border: 'border-[#918F85]/50', dot: 'bg-[#918F85]' },
  ochre:   { bg: 'bg-[#D4B86A]', header: 'bg-[#C4A44E]', text: 'text-[#3D3218]', border: 'border-[#C4A44E]/50', dot: 'bg-[#C4A44E]' },
};

export { STICKY_COLORS };

const DRAG_THRESHOLD = 5; // px — must move this far before a drag starts

export default function StickyCard({
  sticky,
  onOpen,
  onDelete,
  onDragEnd,
  onBringToFront,
}) {
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs to track drag state without re-renders during move
  const dragState = useRef({
    active: false,       // pointer is down
    dragging: false,     // moved past threshold — real drag
    startX: 0,          // clientX at pointer-down
    startY: 0,          // clientY at pointer-down
    offsetX: 0,         // pointer offset from card left edge
    offsetY: 0,         // pointer offset from card top edge
    pointerId: null,
  });

  const colors = STICKY_COLORS[sticky.color] || STICKY_COLORS.sand;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCanvasPosition = useCallback((clientX, clientY) => {
    const parent = cardRef.current?.parentElement;
    if (!parent) return { x: 0, y: 0 };
    const parentRect = parent.getBoundingClientRect();
    return {
      x: Math.max(0, clientX - parentRect.left + parent.scrollLeft - dragState.current.offsetX),
      y: Math.max(0, clientY - parentRect.top + parent.scrollTop - dragState.current.offsetY),
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    // Skip if clicking delete button
    if (e.target.closest('[data-no-drag]')) return;
    // Only left button
    if (e.button !== 0) return;

    e.preventDefault();
    onBringToFront?.();

    const rect = cardRef.current.getBoundingClientRect();

    dragState.current = {
      active: true,
      dragging: false,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      pointerId: e.pointerId,
    };

    cardRef.current.setPointerCapture(e.pointerId);
  }, [onBringToFront]);

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.active) return;

    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    // Check drag threshold — prevents accidental drags on click
    if (!ds.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      ds.dragging = true;
      setIsDragging(true);
    }

    e.preventDefault();
    const pos = getCanvasPosition(e.clientX, e.clientY);
    cardRef.current.style.left = `${pos.x}px`;
    cardRef.current.style.top = `${pos.y}px`;
  }, [getCanvasPosition]);

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.active) return;

    if (ds.pointerId != null) {
      try { cardRef.current.releasePointerCapture(ds.pointerId); } catch { /* noop */ }
    }

    if (ds.dragging) {
      // It was a drag — persist the new position
      const pos = getCanvasPosition(e.clientX, e.clientY);
      onDragEnd?.(pos.x, pos.y);
    } else {
      // It was a click — open editor
      if (!e.target.closest('[data-no-drag]')) {
        onOpen?.();
      }
    }

    ds.active = false;
    ds.dragging = false;
    setIsDragging(false);
  }, [getCanvasPosition, onDragEnd, onOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dragState.current.active = false;
      dragState.current.dragging = false;
    };
  }, []);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Delete this sticky?')) {
      onDelete?.();
    }
  }, [onDelete]);

  // Strip HTML for preview
  const textPreview = sticky.content
    ? sticky.content.replace(/<[^>]*>/g, '').slice(0, 120)
    : '';

  return (
    <div
      ref={cardRef}
      className={`absolute w-56 rounded-lg shadow-lg ${colors.border} border select-none transition-shadow ${isDragging ? 'opacity-80 shadow-2xl scale-[1.02] cursor-grabbing' : 'cursor-grab hover:shadow-xl'}`}
      style={{
        left: sticky.x,
        top: sticky.y,
        zIndex: sticky.zIndex || 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Header bar — drag handle */}
      <div className={`${colors.header} rounded-t-lg px-3 py-2 flex items-center gap-2`}>
        <GripVertical size={14} className={`${colors.text} opacity-50 shrink-0`} />
        <h3 className={`${colors.text} text-sm font-semibold truncate flex-1`}>
          {sticky.title || 'Untitled'}
        </h3>
        <button
          data-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleDelete}
          className={`${colors.text} opacity-40 hover:opacity-100 transition-opacity shrink-0`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className={`${colors.bg} rounded-b-lg px-3 py-2 min-h-[80px]`}>
        <p className={`${colors.text} opacity-50 text-[10px] mb-1`}>
          {formatDate(sticky.createdAt)}
        </p>
        {textPreview && (
          <p className={`${colors.text} opacity-70 text-xs leading-relaxed line-clamp-4`}>
            {textPreview}
          </p>
        )}
      </div>
    </div>
  );
}
