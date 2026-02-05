import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ShortcutsModal from './ShortcutsModal';
import CreateTaskModal from './CreateTaskModal';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { CreateTaskProvider, useCreateTask } from '../context/CreateTaskContext';

// Inner component to access context
function LayoutContent() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isOpen, initialData, closeCreateTask } = useCreateTask();

  useKeyboardShortcuts(() => setShowShortcuts((prev) => !prev));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CreateTaskModal
        isOpen={isOpen}
        onClose={closeCreateTask}
        initialData={initialData}
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
