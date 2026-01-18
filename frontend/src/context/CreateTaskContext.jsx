import React, { createContext, useContext, useState } from 'react';

const CreateTaskContext = createContext();

export function CreateTaskProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState({});

  const openCreateTask = (data = {}) => {
    setInitialData(data);
    setIsOpen(true);
  };

  const closeCreateTask = () => {
    setIsOpen(false);
    setInitialData({});
  };

  return (
    <CreateTaskContext.Provider value={{ isOpen, initialData, openCreateTask, closeCreateTask }}>
      {children}
    </CreateTaskContext.Provider>
  );
}

export function useCreateTask() {
  return useContext(CreateTaskContext);
}
