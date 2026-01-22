import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { useTasks } from '../context/TasksContext';
import api from '../services/api';

export default function TrashPage() {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const { setBreadcrumbs } = useBreadcrumbs();
  const { refreshData } = useTasks();

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTrash();
      setDeletedTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Trash', icon: Trash2 }]);
    loadTrash();
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, loadTrash]);

  const handleRestore = async (taskId) => {
    try {
      await api.restoreTask(taskId);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
      refreshData(); // Refresh main task list
    } catch (err) {
      console.error('Failed to restore task:', err);
      setError('Failed to restore task');
    }
  };

  const handlePermanentDelete = async (taskId) => {
    try {
      await api.permanentlyDeleteTask(taskId);
      setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to permanently delete task');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await api.emptyTrash();
      setDeletedTasks([]);
      setConfirmEmpty(false);
    } catch (err) {
      console.error('Failed to empty trash:', err);
      setError('Failed to empty trash');
    }
  };

  const formatDeletedDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const daysUntilPermanentDelete = (dateStr) => {
    if (!dateStr) return null;
    const deleteDate = new Date(dateStr);
    const permanentDate = new Date(deleteDate);
    permanentDate.setDate(permanentDate.getDate() + 30);
    const now = new Date();
    const diffDays = Math.ceil((permanentDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            Trash
          </h2>
          <p className="text-slate-400">
            {deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}
            {deletedTasks.length > 0 && ' - Items are permanently deleted after 30 days'}
          </p>
        </div>
        {deletedTasks.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            Empty Trash
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {confirmEmpty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Empty Trash?</h3>
            </div>
            <p className="text-slate-400 mb-6">
              This will permanently delete {deletedTasks.length} task{deletedTasks.length !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : deletedTasks.length === 0 ? (
        <div className="text-center py-20">
          <Trash2 className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-500">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedTasks.map(task => {
            const daysLeft = daysUntilPermanentDelete(task.deletedAt);
            return (
              <div
                key={task.id}
                className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-between group hover:border-slate-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{task.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Deleted {formatDeletedDate(task.deletedAt)}
                    </span>
                    {daysLeft !== null && daysLeft <= 7 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        {daysLeft === 0 ? 'Deletes today' : `${daysLeft} days left`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestore(task.id)}
                    className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                    title="Restore task"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
