import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TaskList from '../components/TaskList';
import FilterBar from '../components/FilterBar';
import { useTasks } from '../context/TasksContext';

export default function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask, refreshData } = useTasks();
  const [searchParams, setSearchParams] = useSearchParams();

  // Build filters from URL params
  const filters = {
    dimension: searchParams.get('dimension') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  };

  // Derived state for filtering
  const filteredTasks = tasks.filter(task => {
      // 1. Dimension Filter
      if (filters.dimension) {
          const dim = filters.dimension.toLowerCase();
          // Check explicit dimension field OR tags
          const hasTag = task.tags && task.tags.some(t => t.toLowerCase().includes(dim));
          // If we had a specific 'dimension' field on task, check that too
          if (!hasTag) return false;
      }
      
      // 2. Status Filter
      if (filters.status && task.status !== filters.status) {
          return false;
      }

      // 3. Search
      if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = (task.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
      }

      return true;
  });

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.dimension) params.set('dimension', newFilters.dimension);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const getPageTitle = () => {
    if (filters.dimension) {
      return `${filters.dimension.charAt(0).toUpperCase() + filters.dimension.slice(1)} Tasks`;
    }
    return 'All Tasks';
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            {getPageTitle()}
            </h2>
            <p className="text-slate-400">
            Managing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </p>
        </div>
        <button onClick={refreshData} className="text-xs text-slate-500 hover:text-white underline">
            Refresh
        </button>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex justify-between items-center">
          <span>{error}</span>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
