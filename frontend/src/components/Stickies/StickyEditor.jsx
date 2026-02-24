import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { X, Heading1, Heading2, Type, Bold, Italic, Underline as UnderlineIcon, Palette } from 'lucide-react';
import { STICKY_COLORS } from './StickyCard';

const COLOR_KEYS = Object.keys(STICKY_COLORS);

const TEXT_COLORS = [
  { label: 'Default', value: null },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Pink', value: '#ec4899' },
];

export default function StickyEditor({ sticky, onSave, onClose }) {
  const [title, setTitle] = useState(sticky?.title || '');
  const [color, setColor] = useState(sticky?.color || 'sand');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColors, setShowTextColors] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Write something...',
      }),
    ],
    content: sticky?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleSave = useCallback(() => {
    const content = editor?.getHTML() || '';
    onSave({
      title: title.trim() || 'Untitled',
      content,
      color,
    });
  }, [editor, title, color, onSave]);

  const handleClose = useCallback(() => {
    handleSave();
    onClose();
  }, [handleSave, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!editor) return null;

  const colors = STICKY_COLORS[color] || STICKY_COLORS.sand;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Editor Card */}
      <div className={`relative w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden ${colors.border} border`}>
        {/* Header */}
        <div className={`${colors.header} px-4 py-3 flex items-center gap-3`}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sticky title..."
            className={`flex-1 bg-transparent ${colors.text} placeholder:opacity-50 text-lg font-semibold outline-none`}
          />
          <button
            onClick={handleClose}
            className={`${colors.text} opacity-60 hover:opacity-100 transition-opacity`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className={`${colors.bg} border-b ${colors.border} px-3 py-2 flex items-center gap-1 flex-wrap`}>
          <ToolbarButton
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            colors={colors}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>

          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            colors={colors}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>

          <ToolbarButton
            active={!editor.isActive('heading')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            colors={colors}
            title="Body text"
          >
            <Type size={16} />
          </ToolbarButton>

          <div className={`w-px h-5 ${colors.text} opacity-20 mx-1`} />

          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            colors={colors}
            title="Bold"
          >
            <Bold size={16} />
          </ToolbarButton>

          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            colors={colors}
            title="Italic"
          >
            <Italic size={16} />
          </ToolbarButton>

          <ToolbarButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            colors={colors}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>

          <div className={`w-px h-5 ${colors.text} opacity-20 mx-1`} />

          {/* Text Color */}
          <div className="relative">
            <ToolbarButton
              active={showTextColors}
              onClick={() => { setShowTextColors(!showTextColors); setShowColorPicker(false); }}
              colors={colors}
              title="Text color"
            >
              <Palette size={16} />
            </ToolbarButton>
            {showTextColors && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-lg p-2 flex gap-1 z-10 shadow-xl">
                {TEXT_COLORS.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => {
                      if (tc.value) {
                        editor.chain().focus().setColor(tc.value).run();
                      } else {
                        editor.chain().focus().unsetColor().run();
                      }
                      setShowTextColors(false);
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/60 transition-all"
                    style={{ backgroundColor: tc.value || '#94a3b8' }}
                    title={tc.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sticky Color */}
          <div className="relative ml-auto">
            <button
              onClick={() => { setShowColorPicker(!showColorPicker); setShowTextColors(false); }}
              className={`px-2 py-1 rounded text-xs font-medium ${colors.text} opacity-70 hover:opacity-100 transition-opacity`}
              title="Sticky color"
            >
              Color
            </button>
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-white/10 rounded-lg p-2 flex gap-1 z-10 shadow-xl">
                {COLOR_KEYS.map((key) => {
                  const c = STICKY_COLORS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => { setColor(key); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded-full ${c.bg} border-2 ${color === key ? 'border-white' : 'border-white/20'} hover:border-white/60 transition-all`}
                      title={key}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div className={`${colors.bg} max-h-[60vh] overflow-y-auto`}>
          <EditorContent editor={editor} className={colors.text} />
        </div>

        {/* Footer */}
        <div className={`${colors.bg} border-t ${colors.border} px-4 py-2 flex items-center justify-between`}>
          <span className={`${colors.text} opacity-40 text-xs`}>
            {sticky?.createdAt
              ? new Date(sticky.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'New sticky'}
          </span>
          <button
            onClick={handleClose}
            className={`px-4 py-1.5 rounded-lg ${colors.header} ${colors.text} text-sm font-medium hover:opacity-90 transition-opacity`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ active, onClick, children, colors, title }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-all ${colors.text} ${
        active ? 'opacity-100 bg-black/10' : 'opacity-50 hover:opacity-80 hover:bg-black/5'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
