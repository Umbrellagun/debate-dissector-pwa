import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';
import { useApp } from '../context';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updatePreferences } = useApp();
  const { preferences } = state;

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    updatePreferences({ fontSize });
  };

  const handleAutoSaveChange = (autoSave: boolean) => {
    updatePreferences({ autoSave });
  };

  return (
    <MainLayout>
      <Header
        title="Settings"
        onMenuClick={() => navigate('/')}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      disabled
                      className={`px-4 py-2 text-sm rounded-lg border cursor-not-allowed ${
                        preferences.theme === theme
                          ? 'bg-gray-100 border-gray-300 text-gray-500'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Font Size
                  </label>
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      disabled
                      className={`px-4 py-2 text-sm rounded-lg border cursor-not-allowed ${
                        preferences.fontSize === size
                          ? 'bg-gray-100 border-gray-300 text-gray-500'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Editor</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto-save
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically save changes as you type
                  </p>
                </div>
                <button
                  onClick={() => handleAutoSaveChange(!preferences.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">About</h2>
            </div>
            <div className="p-4 space-y-2 text-sm text-gray-600">
              <p><strong>Debate Dissector</strong> v0.1.0</p>
              <p>A tool for analyzing debates and identifying logical fallacies.</p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
