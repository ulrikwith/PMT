import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import QuickCapture from './QuickCapture';
import ShortcutsModal from './ShortcutsModal';
import CreateTaskModal from './CreateTaskModal';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { CreateTaskProvider, useCreateTask } from '../context/CreateTaskContext';

// Inner component to access context
function LayoutContent() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isOpen, initialData, closeCreateTask } = useCreateTask();
  const navigate = useNavigate();
  
  useKeyboardShortcuts(() => setShowShortcuts(prev => !prev));

  const handleTaskCreated = () => {
      // If we are on tasks page, ideally we refresh. 
      // For now, forcing a refresh via window or navigation might be jarring.
      // A clean way is to re-navigate to current route which TasksPage listens to via useEffect
      navigate('.', { replace: true }); 
      // Better: TasksPage should listen to a global event or we rely on React Query.
      // Since we don't have React Query, simple navigation update helps.
      window.dispatchEvent(new Event('task-created')); // Custom event for TasksPage to listen
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto w-full">
          <Outlet />
        </main>
        <QuickCapture />
      </div>
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CreateTaskModal 
        isOpen={isOpen} 
        onClose={closeCreateTask} 
        initialData={initialData} 
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}

export default function Layout() {
    return (
        <CreateTaskProvider>
            <LayoutContent />
        </CreateTaskProvider>
    );
}