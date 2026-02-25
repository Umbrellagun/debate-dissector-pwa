import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import { EditorPage, SettingsPage } from './pages';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
