import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, tagsData, relationshipsData] = await Promise.all([
        api.getTasks(),
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
    // Snapshot current state for rollback
    const previousTasks = [...tasks];

    // Optimistic update for immediate UI feedback
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    try {
      const updatedTask = await api.updateTask(taskId, updates);
      // Confirm with server data
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      console.error('Update failed, rolling back:', err);
      setTasks(previousTasks);
      // Ideally show a toast here
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    // Snapshot
    const previousTasks = [...tasks];
    const previousRelationships = [...relationships];

    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setRelationships((prev) =>
      prev.filter((r) => r.fromTaskId !== taskId && r.toTaskId !== taskId)
    );

    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.error('Delete failed, rolling back:', err);
      setTasks(previousTasks);
      setRelationships(previousRelationships);
      throw err;
    }
  };

  const createRelationship = async (fromTaskId, toTaskId, type) => {
    const newRel = await api.createRelationship({ fromTaskId, toTaskId, type });
    setRelationships((prev) => [...prev, newRel]);
    return newRel;
  };

  const deleteRelationship = async (relationshipId) => {
    // Snapshot for rollback
    const previousRelationships = [...relationships];

    // Optimistic delete
    setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));

    try {
      await api.deleteRelationship(relationshipId);
    } catch (err) {
      console.error('Delete relationship failed, rolling back:', err);
      setRelationships(previousRelationships);
      throw err;
    }
  };

  const getTaskById = (id) => tasks.find((t) => t.id === id);

  // Derived state: Aggregate all unique tools from tasks
  const allTools = [...new Set(tasks.flatMap((t) => t.resources?.tools || []))].sort();

  return (
    <TasksContext.Provider
      value={{
        tasks,
        tags,
        relationships,
        allTools,
        loading,
        error,
        refreshData,
        createTask,
        updateTask,
        deleteTask,
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
