/**
 * ExplorationContext - Creative Journey & Vision Discovery
 *
 * Manages the exploration process: passion/talent discovery, reflections,
 * peer sessions, crystallization, and potentials (things that could become work).
 * Persisted to Blue.cc (PMT_EXPLORATION tagged todos) with localStorage fallback.
 *
 * Architecture notes:
 * - VisionContext stores the North Star purpose per dimension
 * - This context stores the creative journey that leads to concrete work
 * - When a Potential is turned into Work (via VisionWizard), the task gets
 *   a visionOrigin metadata field linking back to this exploration
 *
 * State shape: Array<{id, title, passion, talent, intersection, selectedPractices,
 *   reflectionEntries[], peerSessions[], statement, depth90Percent, innerConversation,
 *   potentials[], currentPhase, status, position, createdAt, updatedAt, blueId?}>
 * Consumers: ExplorationPage, VisionWizard, all Exploration/* step components, JourneyPage
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const ExplorationContext = createContext();

const DEBOUNCE_MS = 2000;

export function ExplorationProvider({ children }) {
  const [visions, setVisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncErrors, setSyncErrors] = useState({}); // Track failed syncs per vision
  const syncTimers = useRef({});

  // Initial Load: API first, localStorage fallback
  useEffect(() => {
    const loadExplorations = async () => {
      try {
        const data = await api.getExplorations();
        if (Array.isArray(data) && data.length > 0) {
          // API returned data — use it as source of truth
          setVisions(data);
          localStorage.setItem('pmt_visions', JSON.stringify(data));
        } else {
          // API returned empty — check localStorage for un-synced data
          const saved = localStorage.getItem('pmt_visions');
          if (saved) {
            const parsed = JSON.parse(saved);
            setVisions(parsed);
            // Attempt to sync any un-synced local visions to backend
            for (const v of parsed) {
              if (!v.blueId) {
                try {
                  const result = await api.saveExploration(v);
                  if (result.blueId) {
                    v.blueId = result.blueId;
                  }
                } catch (syncErr) {
                  console.warn('Failed to sync local exploration to backend, will retry next session:', syncErr.message);
                }
              }
            }
            if (parsed.some((v) => v.blueId)) {
              setVisions([...parsed]);
              localStorage.setItem('pmt_visions', JSON.stringify(parsed));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load explorations from API, using localStorage:', err);
        const saved = localStorage.getItem('pmt_visions');
        if (saved) {
          try {
            setVisions(JSON.parse(saved));
          } catch (parseErr) {
            console.error('Corrupted localStorage data, starting fresh:', parseErr.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadExplorations();
  }, []);

  // Persist to localStorage on every change (cache/offline fallback)
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('pmt_visions', JSON.stringify(visions));
      } catch (e) {
        console.error('Failed to persist explorations to localStorage (quota exceeded?):', e.message);
      }
    }
  }, [visions, loading]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(syncTimers.current).forEach(clearTimeout);
    };
  }, []);

  /**
   * Immediately sync a vision to the backend.
   * Reads latest state via setVisions identity trick.
   */
  const syncToBackend = useCallback((visionId) => {
    setVisions((current) => {
      const vision = current.find((v) => v.id === visionId);
      if (vision?.blueId) {
        api.updateExploration(vision.blueId, vision)
          .then(() => {
            // Clear any previous sync error on success
            setSyncErrors((prev) => {
              if (prev[visionId]) {
                const { [visionId]: _, ...rest } = prev;
                return rest;
              }
              return prev;
            });
          })
          .catch((err) => {
            console.error('Background sync failed:', err);
            setSyncErrors((prev) => ({
              ...prev,
              [visionId]: { message: err.message, at: new Date().toISOString() },
            }));
          });
      }
      return current; // No state change — read-only access
    });
  }, []);

  /**
   * Debounced sync for keystroke-driven updates (passion, talent, statement fields).
   */
  const debouncedSync = useCallback(
    (visionId) => {
      if (syncTimers.current[visionId]) {
        clearTimeout(syncTimers.current[visionId]);
      }
      syncTimers.current[visionId] = setTimeout(() => {
        syncToBackend(visionId);
      }, DEBOUNCE_MS);
    },
    [syncToBackend]
  );

  const createVision = useCallback(
    async (position = { x: 400, y: 300 }) => {
      const newVision = {
        id: `vis_${Date.now()}`,
        title: 'Emerging Vision',
        passion: '',
        talent: '',
        intersection: '',
        selectedPractices: [],
        reflectionEntries: [],
        peerSessions: [],
        statement: '',
        depth90Percent: '',
        innerConversation: '',
        potentials: [],
        currentPhase: 'passion-talent',
        status: 'emerging', // emerging | maturing | crystallized | creating
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setVisions((prev) => [...prev, newVision]);

      // Async sync to backend
      try {
        const result = await api.saveExploration(newVision);
        if (result.blueId) {
          setVisions((prev) =>
            prev.map((v) => (v.id === newVision.id ? { ...v, blueId: result.blueId } : v))
          );
        }
      } catch (err) {
        console.error('Failed to save new exploration to backend:', err);
      }

      return newVision;
    },
    []
  );

  /**
   * Auto-update phase and status logic — extracted for reuse.
   */
  const applyAutoStatusUpdates = (updated) => {
    const hasPassionTalent = updated.passion || updated.talent || updated.intersection;
    const hasReflections = (updated.reflectionEntries || []).length > 0;
    const hasPeerSessions = (updated.peerSessions || []).length > 0;
    const hasCrystallization =
      updated.statement || updated.depth90Percent || updated.innerConversation;
    const hasPotentials = (updated.potentials || []).length > 0;

    // Update current phase based on latest activity
    if (hasPotentials && hasCrystallization) {
      updated.currentPhase = 'potentials';
    } else if (hasCrystallization) {
      updated.currentPhase = 'crystallization';
    } else if (hasPeerSessions) {
      updated.currentPhase = 'peer-feedback';
    } else if (hasReflections) {
      updated.currentPhase = 'reflection';
    } else if (hasPassionTalent) {
      updated.currentPhase = 'passion-talent';
    }

    // Update status based on depth of work
    if (hasPotentials && hasCrystallization && updated.statement?.length > 50) {
      updated.status = 'crystallized';
    } else if (hasReflections || hasPeerSessions || hasCrystallization) {
      updated.status = 'maturing';
    } else {
      updated.status = 'emerging';
    }

    return updated;
  };

  const updateVision = useCallback(
    (id, updates) => {
      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === id) {
            let updated = { ...v, ...updates, updatedAt: new Date().toISOString() };
            updated = applyAutoStatusUpdates(updated);
            return updated;
          }
          return v;
        })
      );

      // Debounced sync (updateVision is called on keystroke)
      debouncedSync(id);
    },
    [debouncedSync]
  );

  const deleteVision = useCallback(async (id) => {
    let blueId = null;
    setVisions((prev) => {
      const vision = prev.find((v) => v.id === id);
      if (vision?.blueId) {
        blueId = vision.blueId;
      }
      return prev.filter((v) => v.id !== id);
    });

    // Clear any pending sync timer
    if (syncTimers.current[id]) {
      clearTimeout(syncTimers.current[id]);
      delete syncTimers.current[id];
    }

    if (blueId) {
      try {
        await api.deleteExploration(blueId);
      } catch (err) {
        console.error('Failed to delete exploration from backend:', err);
      }
    }
  }, []);

  const addReflection = useCallback(
    (visionId, entry) => {
      const newEntry = {
        id: `ref_${Date.now()}`,
        date: new Date().toISOString(),
        ...entry,
      };

      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            const updated = {
              ...v,
              reflectionEntries: [newEntry, ...(v.reflectionEntries || [])],
              updatedAt: new Date().toISOString(),
            };

            // Update phase and status
            if (!v.currentPhase || v.currentPhase === 'passion-talent') {
              updated.currentPhase = 'reflection';
            }
            if (v.status === 'emerging') {
              updated.status = 'maturing';
            }

            return updated;
          }
          return v;
        })
      );

      // Immediate sync (discrete action)
      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const deleteReflection = useCallback(
    (visionId, reflectionId) => {
      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            return {
              ...v,
              reflectionEntries: (v.reflectionEntries || []).filter((r) => r.id !== reflectionId),
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const addPotential = useCallback(
    (visionId, potential) => {
      const newPotential = {
        id: `pot_${Date.now()}`,
        createdAt: new Date().toISOString(),
        readyToCreate: false,
        ...potential,
      };

      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            return {
              ...v,
              potentials: [...(v.potentials || []), newPotential],
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const updatePotential = useCallback(
    (visionId, potentialId, updates) => {
      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            return {
              ...v,
              potentials: (v.potentials || []).map((p) =>
                p.id === potentialId ? { ...p, ...updates } : p
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const deletePotential = useCallback(
    (visionId, potentialId) => {
      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            return {
              ...v,
              potentials: (v.potentials || []).filter((p) => p.id !== potentialId),
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const addPeerSession = useCallback(
    (visionId, session) => {
      const newSession = {
        id: `ses_${Date.now()}`,
        ...session,
      };

      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            const updated = {
              ...v,
              peerSessions: [...(v.peerSessions || []), newSession],
              updatedAt: new Date().toISOString(),
            };

            // Update phase
            if (['passion-talent', 'reflection'].includes(v.currentPhase)) {
              updated.currentPhase = 'peer-feedback';
            }
            if (v.status === 'emerging') {
              updated.status = 'maturing';
            }

            return updated;
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const updatePeerSession = useCallback(
    (visionId, sessionId, updates) => {
      setVisions((prev) =>
        prev.map((v) => {
          if (v.id === visionId) {
            return {
              ...v,
              peerSessions: (v.peerSessions || []).map((s) =>
                s.id === sessionId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        })
      );

      syncToBackend(visionId);
    },
    [syncToBackend]
  );

  const getVisionById = useCallback(
    (id) => {
      return visions.find((v) => v.id === id);
    },
    [visions]
  );

  return (
    <ExplorationContext.Provider
      value={{
        visions,
        loading,
        syncErrors,
        createVision,
        updateVision,
        deleteVision,
        addReflection,
        deleteReflection,
        addPotential,
        updatePotential,
        deletePotential,
        addPeerSession,
        updatePeerSession,
        getVisionById,
      }}
    >
      {children}
    </ExplorationContext.Provider>
  );
}

export function useExploration() {
  return useContext(ExplorationContext);
}
