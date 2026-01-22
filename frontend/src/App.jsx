import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

// Lazy load pages
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const ReadinessPage = lazy(() => import('./pages/ReadinessPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen text-slate-500">
            <div className="animate-pulse">Loading...</div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
              <Route index element={<TasksPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="readiness" element={<ReadinessPage />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
                <AppRoutes />
            </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;