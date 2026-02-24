import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const StickiesContext = createContext(null);

export function StickiesProvider({ children }) {
  const [stickies, setStickies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  // Lazy fetch — only called when StickiesPage mounts
  const fetchStickies = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    try {
      const data = await api.getStickies();
      setStickies(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stickies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSticky = useCallback(async (stickyData) => {
    const now = new Date().toISOString();
    const newSticky = {
      title: stickyData.title || 'Untitled',
      content: stickyData.content || '',
      color: stickyData.color || 'sand',
      x: stickyData.x ?? 40,
      y: stickyData.y ?? 40,
      zIndex: stickyData.zIndex ?? 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const saved = await api.saveSticky(newSticky);
      setStickies((prev) => [saved, ...prev]);
      return saved;
    } catch (err) {
      console.error('Failed to save sticky:', err);
      throw err;
    }
  }, []);

  const updateSticky = useCallback(async (blueId, updates) => {
    // Optimistic update
    let previousSticky = null;
    setStickies((prev) => {
      previousSticky = prev.find((s) => s.blueId === blueId);
      return prev.map((s) =>
        s.blueId === blueId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
    });

    try {
      const current = previousSticky ? { ...previousSticky, ...updates } : updates;
      const saved = await api.updateSticky(blueId, {
        ...current,
        updatedAt: new Date().toISOString(),
      });
      setStickies((prev) => prev.map((s) => (s.blueId === blueId ? saved : s)));
      return saved;
    } catch (err) {
      // Rollback on failure
      if (previousSticky) {
        setStickies((prev) => prev.map((s) => (s.blueId === blueId ? previousSticky : s)));
      }
      console.error('Failed to update sticky:', err);
      throw err;
    }
  }, []);

  const deleteSticky = useCallback(async (blueId) => {
    let previousStickies;
    setStickies((prev) => {
      previousStickies = prev;
      return prev.filter((s) => s.blueId !== blueId);
    });

    try {
      await api.deleteSticky(blueId);
    } catch (err) {
      setStickies(previousStickies);
      console.error('Failed to delete sticky:', err);
      throw err;
    }
  }, []);

  const bringToFront = useCallback((blueId) => {
    setStickies((prev) => {
      const maxZ = Math.max(...prev.map((s) => s.zIndex || 0), 0);
      return prev.map((s) =>
        s.blueId === blueId ? { ...s, zIndex: maxZ + 1 } : s
      );
    });
  }, []);

  return (
    <StickiesContext.Provider
      value={{
        stickies,
        loading,
        error,
        fetchStickies,
        addSticky,
        updateSticky,
        deleteSticky,
        bringToFront,
      }}
    >
      {children}
    </StickiesContext.Provider>
  );
}

export function useStickies() {
  const context = useContext(StickiesContext);
  if (!context) {
    throw new Error('useStickies must be used within a StickiesProvider');
  }
  return context;
}
