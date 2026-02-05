import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExplorationProvider } from './context/ExplorationContext';
import { VisionProvider } from './context/VisionContext';
import { AssetProvider } from './context/AssetContext';
import LoginPage from './pages/LoginPage';

// Lazy load pages
const TasksPage = lazy(() => import('./pages/TasksPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ExplorationPage = lazy(() => import('./pages/ExplorationPage'));
const JourneyPage = lazy(() => import('./pages/JourneyPage'));
const AssetsPage = lazy(() => import('./pages/AssetsPage'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen text-slate-500">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * In dev mode with BYPASS_AUTH, the user is always set.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * PublicRoute — redirects to /board if already authenticated.
 * Prevents logged-in users from seeing the login page.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/board" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/board" replace />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="list" element={<TasksPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="exploration" element={<ExplorationPage />} />
        <Route path="journey" element={<JourneyPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="trash" element={<TrashPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <VisionProvider>
          <ExplorationProvider>
            <AssetProvider>
              <BrowserRouter>
                <Suspense fallback={<LoadingSpinner />}>
                  <AppRoutes />
                </Suspense>
              </BrowserRouter>
            </AssetProvider>
          </ExplorationProvider>
        </VisionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
