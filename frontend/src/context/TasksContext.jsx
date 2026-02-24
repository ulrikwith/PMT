import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { validateRelationship } from '../utils/relationshipValidator';

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount intentionally

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, tagsData, relationshipsData] = await Promise.all([
        api.getTasks({ includeDeleted: true }), // Include deleted tasks so we can filter in context
        api.getTags(),
        api.getRelationships(),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setRelationships(Array.isArray(relationshipsData) ? relationshipsData : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (taskData) => {
    const newTask = await api.createTask(taskData);
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (taskId, updates) => {
    // Use functional update to avoid race conditions
    let previousTaskState = null;

    setTasks((prev) => {
      // Capture current task state for rollback
      previousTaskState = prev.find((t) => t.id === taskId);
      // Optimistic update
      return prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    });

    try {
      const updatedTask = await api.updateTask(taskId, updates);
      // Confirm with server data
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      console.error('Update failed, rolling back:', err);
      // Rollback to captured state
      if (previousTaskState) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previousTaskState : t)));
      }
      throw err;
    }
  };

  const deleteTask = async (taskId, permanent = false) => {
    // Capture state inside functional updates to avoid race conditions
    let previousTask = null;
    let previousRels = [];

    if (permanent) {
      // Permanent delete - remove from state immediately
      setTasks((prev) => {
        previousTask = prev.find((t) => t.id === taskId);
        return prev.filter((t) => t.id !== taskId);
      });

      setRelationships((prev) => {
        previousRels = prev.filter((r) => r.fromTaskId === taskId || r.toTaskId === taskId);
        return prev.filter((r) => r.fromTaskId !== taskId && r.toTaskId !== taskId);
      });
    } else {
      // Soft delete - mark with deletedAt timestamp
      const deletedAt = new Date().toISOString();
      setTasks((prev) => {
        previousTask = prev.find((t) => t.id === taskId);
        return prev.map((t) => (t.id === taskId ? { ...t, deletedAt } : t));
      });
    }

    try {
      await api.deleteTask(taskId, permanent);
    } catch (err) {
      console.error('Delete failed, rolling back:', err);
      // Rollback changes
      if (permanent) {
        if (previousTask) {
          setTasks((prev) => [...prev, previousTask]);
        }
        if (previousRels.length > 0) {
          setRelationships((prev) => [...prev, ...previousRels]);
        }
      } else {
        // Rollback soft delete by removing deletedAt
        if (previousTask) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? previousTask : t)));
        }
      }
      throw err;
    }
  };

  const createRelationship = async (fromTaskId, toTaskId, type) => {
    // Validate relationship type
    const VALID_TYPES = ['feeds-into', 'comes-from', 'related-to', 'blocks'];
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Invalid relationship type: "${type}"`);
    }

    // Validate relationship before API call
    const validation = validateRelationship(fromTaskId, toTaskId, relationships);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newRel = await api.createRelationship({ fromTaskId, toTaskId, type });
    setRelationships((prev) => [...prev, newRel]);
    return newRel;
  };

  const deleteRelationship = async (relationshipId) => {
    let previousRelationships;

    // Optimistic delete — capture snapshot inside functional update
    setRelationships((prev) => {
      previousRelationships = prev;
      return prev.filter((r) => r.id !== relationshipId);
    });

    try {
      await api.deleteRelationship(relationshipId);
    } catch (err) {
      console.error('Delete relationship failed, rolling back:', err);
      setRelationships(previousRelationships);
      throw err;
    }
  };

  const restoreTask = async (taskId) => {
    let previousTask = null;

    // Optimistically remove deletedAt
    setTasks((prev) => {
      previousTask = prev.find((t) => t.id === taskId);
      return prev.map((t) => {
        if (t.id === taskId) {
          const { deletedAt, ...restored } = t;
          return restored;
        }
        return t;
      });
    });

    try {
      await api.restoreTask(taskId);
    } catch (err) {
      console.error('Restore failed, rolling back:', err);
      if (previousTask) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previousTask : t)));
      }
      throw err;
    }
  };

  const emptyTrash = async (olderThanDays = null) => {
    let previousTasks;

    // Optimistically remove all deleted tasks — capture inside functional update
    setTasks((prev) => {
      previousTasks = prev;
      return prev.filter((t) => !t.deletedAt);
    });

    try {
      await api.emptyTrash(olderThanDays);
    } catch (err) {
      console.error('Empty trash failed, rolling back:', err);
      setTasks(previousTasks);
      throw err;
    }
  };

  const getTaskById = (id) => tasks.find((t) => t.id === id);

  // Derived state: Filter out deleted tasks for main UI
  const activeTasks = useMemo(() =>
    tasks.filter((t) => !t.deletedAt),
    [tasks]
  );

  // Derived state: Get only deleted tasks for trash
  const deletedTasks = useMemo(() =>
    tasks.filter((t) => t.deletedAt),
    [tasks]
  );

  // Derived state: Aggregate all unique tools from active tasks
  const allTools = useMemo(() =>
    [...new Set(activeTasks.flatMap((t) => t.resources?.tools || []))].sort(),
    [activeTasks]
  );

  return (
    <TasksContext.Provider
      value={{
        tasks: activeTasks, // Expose only active tasks by default
        allTasks: tasks, // Expose all tasks (for trash page)
        deletedTasks, // Expose deleted tasks
        tags,
        relationships,
        allTools,
        loading,
        error,
        refreshData,
        createTask,
        updateTask,
        deleteTask,
        restoreTask,
        emptyTrash,
        createRelationship,
        deleteRelationship,
        getTaskById,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}
