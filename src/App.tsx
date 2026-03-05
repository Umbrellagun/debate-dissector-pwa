import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import { OfflineIndicator, InstallPrompt, ErrorBoundary } from './components/core';
import './App.css';

// Code splitting: Lazy load pages for better initial load performance
const EditorPage = lazy(() => import('./pages/EditorPage').then(m => ({ default: m.EditorPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SharedDebatePage = lazy(() => import('./pages/SharedDebatePage').then(m => ({ default: m.SharedDebatePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<EditorPage />} />
              <Route path="/editor/:id" element={<EditorPage />} />
              <Route path="/s/:id" element={<SharedDebatePage />} />
              <Route path="/s/:id/view" element={<EditorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <OfflineIndicator />
          <InstallPrompt />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
