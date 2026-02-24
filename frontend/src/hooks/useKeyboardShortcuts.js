import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useKeyboardShortcuts(toggleShortcuts) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore if input/textarea/contentEditable is focused
      const el = document.activeElement;
      if (!el) return;
      if (['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable) {
        return;
      }

      // Escape to close modal (if open) - handled by modal itself or parent usually,
      // but let's ensure we don't block it.

      // Cmd/Ctrl + K: Focus Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        console.log('Search shortcut triggered');
      }

      // Cmd/Ctrl + /: Show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (toggleShortcuts) toggleShortcuts();
      }

      // Navigation Shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        navigate('/');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleShortcuts]);
}
