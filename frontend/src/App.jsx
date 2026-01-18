import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const ReadinessPage = lazy(() => import('./pages/ReadinessPage'));

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen text-slate-500">
            <div className="animate-pulse">Loading...</div>
        </div>
    );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<TasksPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="readiness" element={<ReadinessPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;