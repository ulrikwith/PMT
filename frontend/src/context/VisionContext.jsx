import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const VisionContext = createContext();

export function VisionProvider({ children }) {
  const [visions, setVisions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load - refreshVisions is stable (useCallback with [] deps)
  useEffect(() => {
    refreshVisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshVisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllVisions();
      setVisions(data || {});
      setError(null);
    } catch (err) {
      console.error('Failed to load visions:', err);
      setError(err.message);
      // Initialize with empty object on error
      setVisions({});
    } finally {
      setLoading(false);
    }
  }, []);

  const saveVision = async (dimension, data, elementId = null) => {
    // Optimistic update for immediate UI feedback
    const previousVisions = { ...visions };

    // Update local state optimistically
    setVisions((prev) => {
      const updated = { ...prev };
      if (!updated[dimension]) {
        updated[dimension] = { overall: '', elements: {} };
      }

      if (!elementId) {
        // Overall vision
        updated[dimension].overall = data.overall;
      } else {
        // Element vision
        if (!updated[dimension].elements[elementId]) {
          updated[dimension].elements[elementId] = { innerGoals: '', outerGoals: '' };
        }
        if (data.innerGoals !== undefined) {
          updated[dimension].elements[elementId].innerGoals = data.innerGoals;
        }
        if (data.outerGoals !== undefined) {
          updated[dimension].elements[elementId].outerGoals = data.outerGoals;
        }
      }

      return updated;
    });

    try {
      await api.saveVision(dimension, data, elementId);
      // Success - optimistic update was correct
    } catch (err) {
      console.error('Save vision failed, rolling back:', err);
      setVisions(previousVisions);
      throw err;
    }
  };

  const deleteVision = async (dimension, elementId = null, type = null) => {
    const previousVisions = { ...visions };

    // Optimistic delete
    setVisions((prev) => {
      const updated = { ...prev };

      if (!elementId) {
        // Delete entire dimension
        delete updated[dimension];
      } else if (!type) {
        // Delete entire element
        if (updated[dimension]?.elements) {
          delete updated[dimension].elements[elementId];
        }
      } else {
        // Delete specific type (innerGoals/outerGoals)
        if (updated[dimension]?.elements?.[elementId]) {
          updated[dimension].elements[elementId][type] = '';
        }
      }

      return updated;
    });

    try {
      await api.deleteVision(dimension, elementId, type);
    } catch (err) {
      console.error('Delete vision failed, rolling back:', err);
      setVisions(previousVisions);
      throw err;
    }
  };

  const getVision = useCallback(
    (dimension, elementId = null) => {
      if (!visions[dimension]) {
        return elementId
          ? { innerGoals: '', outerGoals: '' }
          : { overall: '', elements: {} };
      }

      if (!elementId) {
        return visions[dimension];
      }

      return visions[dimension].elements?.[elementId] || { innerGoals: '', outerGoals: '' };
    },
    [visions]
  );

  const value = {
    visions,
    loading,
    error,
    refreshVisions,
    saveVision,
    deleteVision,
    getVision,
  };

  return <VisionContext.Provider value={value}>{children}</VisionContext.Provider>;
}

export function useVision() {
  const context = useContext(VisionContext);
  if (!context) {
    throw new Error('useVision must be used within a VisionProvider');
  }
  return context;
}
