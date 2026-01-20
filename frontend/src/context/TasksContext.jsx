import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, tagsData] = await Promise.all([
        api.getTasks(),
        api.getTags()
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
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
      await api.deleteTask(taskId);
    } catch (err) {
      console.error("Delete task failed:", err);
      // Re-fetch to restore if failed
      refreshData();
      throw err;
    }
  };

  const getTaskById = (id) => tasks.find(t => t.id === id);

  return (
    <TasksContext.Provider value={{
      tasks,
      tags,
      loading,
      error,
      refreshData,
      createTask,
      updateTask,
      deleteTask,
      getTaskById
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}
