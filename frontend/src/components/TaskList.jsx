import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { useCreateTask } from '../context/CreateTaskContext';

export default function TaskList({ tasks, onCreate, onUpdate, onDelete }) {
  const { openCreateTask } = useCreateTask();

  // We don't use onCreate anymore from props for the modal trigger, 
  // but keeping it if we want to pass it to context or just rely on API directly.
  // The context handles creation internally via API.

  return (
    <div>
      <button
        onClick={() => openCreateTask()}
        className="w-full p-4 mb-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-blue-500/50 hover:text-blue-500 transition-all flex items-center justify-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
             <Plus size={20} />
        </div>
        <span className="font-medium">Add New Task</span>
      </button>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
           <div className="text-center py-10 text-slate-500">
               No tasks found. Create one to get started!
           </div>
        ) : (
            tasks.map((task, index) => (
            <div 
                key={task.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
            >
                <TaskCard 
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                />
            </div>
            ))
        )}
      </div>
    </div>
  );
}