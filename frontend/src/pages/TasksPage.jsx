import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TaskList from '../components/TaskList';
import FilterBar from '../components/FilterBar';
import api from '../services/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Build filters from URL params and local state
  const filters = {
    dimension: searchParams.get('dimension') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  };

  useEffect(() => {
    fetchTasks();
    
    // Listen for global refresh
    const handleRefresh = () => fetchTasks();
    window.addEventListener('task-created', handleRefresh);
    return () => window.removeEventListener('task-created', handleRefresh);
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const activeFilters = {};
      if (filters.dimension) activeFilters.dimension = filters.dimension;
      if (filters.status) activeFilters.status = filters.status;
      if (filters.search) activeFilters.search = filters.search;

      const data = await api.getTasks(activeFilters);
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.dimension) params.set('dimension', newFilters.dimension);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const handleCreateTask = async (taskData) => {
    try {
      const result = await api.createTask(taskData);
      const newTask = result.data || result;
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError('Failed to create task: ' + err.message);
      console.error(err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const result = await api.updateTask(taskId, updates);
      const updatedTask = result.data || result;
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Failed to update task: ' + err.message);
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError('Failed to delete task: ' + err.message);
      console.error(err);
    }
  };

  const getPageTitle = () => {
    if (filters.dimension) {
      return `${filters.dimension.charAt(0).toUpperCase() + filters.dimension.slice(1)} Tasks`;
    }
    return 'All Tasks';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
          {getPageTitle()}
        </h2>
        <p className="text-slate-400">
          Managing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-white">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
