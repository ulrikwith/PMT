import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const AssetContext = createContext();

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAssets();
      setAssets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAsset = async (assetData) => {
    const newAsset = await api.createAsset(assetData);
    setAssets((prev) => [newAsset, ...prev]);
    return newAsset;
  };

  const updateAsset = async (assetId, updates) => {
    let previousAsset = null;

    // Optimistic update
    setAssets((prev) => {
      previousAsset = prev.find((a) => a.id === assetId);
      return prev.map((a) => (a.id === assetId ? { ...a, ...updates } : a));
    });

    try {
      const updatedAsset = await api.updateAsset(assetId, updates);
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updatedAsset : a)));
      return updatedAsset;
    } catch (err) {
      console.error('Update asset failed, rolling back:', err);
      if (previousAsset) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? previousAsset : a)));
      }
      throw err;
    }
  };

  const archiveAsset = async (assetId) => {
    let previousAsset = null;

    // Optimistic: mark as archived
    const archivedAt = new Date().toISOString();
    setAssets((prev) => {
      previousAsset = prev.find((a) => a.id === assetId);
      return prev.map((a) => (a.id === assetId ? { ...a, archived_at: archivedAt } : a));
    });

    try {
      await api.archiveAsset(assetId);
    } catch (err) {
      console.error('Archive asset failed, rolling back:', err);
      if (previousAsset) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? previousAsset : a)));
      }
      throw err;
    }
  };

  const restoreAsset = async (assetId) => {
    let previousAsset = null;

    // Optimistic: remove archived_at
    setAssets((prev) => {
      previousAsset = prev.find((a) => a.id === assetId);
      return prev.map((a) => {
        if (a.id === assetId) {
          const { archived_at, ...restored } = a;
          return restored;
        }
        return a;
      });
    });

    try {
      await api.restoreAsset(assetId);
    } catch (err) {
      console.error('Restore asset failed, rolling back:', err);
      if (previousAsset) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? previousAsset : a)));
      }
      throw err;
    }
  };

  const updatePhase = async (assetId, newPhase) => {
    let previousAsset = null;

    // Optimistic update
    setAssets((prev) => {
      previousAsset = prev.find((a) => a.id === assetId);
      return prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              phase: newPhase,
              phase_entered_at: new Date().toISOString(),
              phase_history: [
                ...(a.phase_history || []),
                { from: a.phase, to: newPhase, date: new Date().toISOString() },
              ],
            }
          : a
      );
    });

    try {
      const updatedAsset = await api.updateAssetPhase(assetId, newPhase);
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updatedAsset : a)));
      return updatedAsset;
    } catch (err) {
      console.error('Update phase failed, rolling back:', err);
      if (previousAsset) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? previousAsset : a)));
      }
      throw err;
    }
  };

  const linkTask = async (assetId, taskId) => {
    const result = await api.linkTaskToAsset(assetId, taskId);
    setAssets((prev) => prev.map((a) => (a.id === assetId ? result : a)));
    return result;
  };

  const unlinkTask = async (assetId, taskId) => {
    const result = await api.unlinkTaskFromAsset(assetId, taskId);
    setAssets((prev) => prev.map((a) => (a.id === assetId ? result : a)));
    return result;
  };

  const getAssetById = (id) => assets.find((a) => a.id === id);

  // Derived state: active assets (not archived)
  const activeAssets = useMemo(
    () => assets.filter((a) => !a.archived_at),
    [assets]
  );

  // Derived state: archived assets
  const archivedAssets = useMemo(
    () => assets.filter((a) => a.archived_at),
    [assets]
  );

  return (
    <AssetContext.Provider
      value={{
        assets: activeAssets,
        allAssets: assets,
        archivedAssets,
        loading,
        error,
        refreshData,
        createAsset,
        updateAsset,
        archiveAsset,
        restoreAsset,
        updatePhase,
        linkTask,
        unlinkTask,
        getAssetById,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
}
