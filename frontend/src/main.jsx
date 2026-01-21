import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TasksProvider } from './context/TasksContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';

// ...
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TasksProvider>
      <BreadcrumbProvider>
        <App />
      </BreadcrumbProvider>
    </TasksProvider>
  </React.StrictMode>
);

