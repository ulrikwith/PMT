import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, tagsData, relationshipsData] = await Promise.all([
        api.getTasks(),
        api.getTags(),
        api.getRelationships()
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setRelationships(Array.isArray(relationshipsData) ? relationshipsData : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // CRUD Operations
  const createTask = async (taskData) => {
    try {
      const response = await api.createTask(taskData);
      const newTask = response.data || response;
      // Optimistic / Immediate Update
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error("Create task failed:", err);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      // Optimistic Update (optional, but good for UI responsiveness)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      
      const response = await api.updateTask(taskId, updates);
      const updatedTask = response.data || response;
      
      // Confirm with Server Data
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      console.error("Update task failed:", err);
      // Revert on failure? For now, we rely on refreshData or user retry
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // Also remove relationships involving this task
      setRelationships(prev => prev.filter(r => r.fromTaskId !== taskId && r.toTaskId !== taskId));
      await api.deleteTask(taskId);
    } catch (err) {
      console.error("Delete task failed:", err);
      // Re-fetch to restore if failed
      refreshData();
      throw err;
    }
  };

  const createRelationship = async (fromTaskId, toTaskId, type) => {
    try {
      const response = await api.createRelationship({ fromTaskId, toTaskId, type });
      const newRel = response.data || response;
      setRelationships(prev => [...prev, newRel]);
      return newRel;
    } catch (err) {
      console.error("Create relationship failed:", err);
      throw err;
    }
  };

  const deleteRelationship = async (relationshipId) => {
    try {
      setRelationships(prev => prev.filter(r => r.id !== relationshipId));
      await api.deleteRelationship(relationshipId);
    } catch (err) {
      console.error("Delete relationship failed:", err);
      refreshData();
      throw err;
    }
  };

  const getTaskById = (id) => tasks.find(t => t.id === id);

  return (
    <TasksContext.Provider value={{
      tasks,
      tags,
      relationships,
      loading,
      error,
      refreshData,
      createTask,
      updateTask,
      deleteTask,
      createRelationship,
      deleteRelationship,
      getTaskById
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}
