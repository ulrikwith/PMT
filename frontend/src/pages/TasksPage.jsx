import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TaskList from '../components/TaskList';
import FilterBar from '../components/FilterBar';
import { useTasks } from '../context/TasksContext';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { List } from 'lucide-react';
import { getDimensionConfig } from '../constants/taxonomy';

export default function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, deleteTask, refreshData } = useTasks();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [searchParams, setSearchParams] = useSearchParams();

  // Build filters from URL params
  const filters = {
    dimension: searchParams.get('dimension') || '',
    status: searchParams.get('status') || '',
    energy: searchParams.get('energy') || '',
    search: searchParams.get('search') || '',
  };

  // Update Breadcrumbs
  useEffect(() => {
    const crumbs = [{ label: 'List', icon: List }];

    if (filters.dimension) {
      const config = getDimensionConfig(filters.dimension);
      if (config) {
        crumbs.push({ label: config.label, icon: config.icon, color: config.color });
      } else {
        crumbs.push({ label: filters.dimension });
      }
    }

    setBreadcrumbs(crumbs);
    return () => setBreadcrumbs([]);
  }, [filters.dimension, setBreadcrumbs]);

  // Derived state for filtering
  const filteredTasks = tasks.filter((task) => {
    // 0. Exclude Deleted (Soft Deletes)
    if (task.deletedAt) return false;

    // 1. Dimension Filter
    if (filters.dimension) {
      const dim = filters.dimension.toLowerCase();
      // Use exact match instead of includes to avoid false positives
      const hasTag = task.tags && task.tags.some((t) => t.toLowerCase() === dim);
      if (!hasTag) return false;
    }

    // 2. Status Filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }

    // 3. Energy Filter
    if (filters.energy) {
      const taskEnergy = task.resources?.energyLevel?.toLowerCase() || '';
      if (taskEnergy !== filters.energy.toLowerCase()) return false;
    }

    // 4. Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const handleReorder = async (sourceIndex, destinationIndex) => {
    // 1. Create a shallow copy of the filtered tasks to modify locally
    const reorderedTasks = Array.from(filteredTasks);
    const [movedTask] = reorderedTasks.splice(sourceIndex, 1);
    reorderedTasks.splice(destinationIndex, 0, movedTask);

    // 2. Calculate new sortOrder for the moved task
    const prevTask = reorderedTasks[destinationIndex - 1];
    const nextTask = reorderedTasks[destinationIndex + 1];

    let newSortOrder;
    if (!prevTask && !nextTask) {
      // Only one item in list? Should be 0.
      newSortOrder = 0;
    } else if (!prevTask) {
      // Moved to top
      newSortOrder = (nextTask.sortOrder || 0) - 1000;
    } else if (!nextTask) {
      // Moved to bottom
      newSortOrder = (prevTask.sortOrder || 0) + 1000;
    } else {
      // Moved between two items
      newSortOrder = ((prevTask.sortOrder || 0) + (nextTask.sortOrder || 0)) / 2;
    }

    // 3. Update the task locally and on server
    try {
       await updateTask(movedTask.id, { sortOrder: newSortOrder });
    } catch (error) {
      console.error('Failed to reorder task:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.dimension) params.set('dimension', newFilters.dimension);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.energy) params.set('energy', newFilters.energy);
    if (newFilters.search) params.set('search', newFilters.search);
    setSearchParams(params);
  };

  const getPageTitle = () => {
    if (filters.dimension) {
      return `${filters.dimension.charAt(0).toUpperCase() + filters.dimension.slice(1)} Tasks`;
    }
    return 'List';
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">{getPageTitle()}</h2>
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
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}
