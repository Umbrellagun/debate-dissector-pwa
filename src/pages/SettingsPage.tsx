import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout, Header } from '../components/layout';
import { useApp } from '../context';
import { useInstallPrompt } from '../hooks';
import packageJson from '../../package.json';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updatePreferences } = useApp();
  const { preferences } = state;
  const { isInstalled, isInstallable, promptInstall } = useInstallPrompt();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    updatePreferences({ fontSize });
  };

  return (
    <MainLayout>
      <Header
        title="Settings"
        onBackClick={() => navigate('/')}
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
              <h2 className="text-sm font-semibold text-gray-900">About</h2>
            </div>
            <div className="p-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Debate Dissector</p>
                  <p className="text-xs text-gray-500">Version {packageJson.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Installed
                    </span>
                  ) : isInstallable ? (
                    <button
                      onClick={promptInstall}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Install App
                    </button>
                  ) : null}
                </div>
              </div>
              <p>A tool for analyzing debates, identifying logical fallacies, and rhetorical strategies.</p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
