import React, { useState } from 'react';
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
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = () => {
    const e = ['calebsundance3', 'gmail', 'com'].join('@').replace('@com', '.com');
    navigator.clipboard.writeText(e).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  };

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
              <p className="text-gray-600 font-medium">
                A tool for analyzing debates, identifying logical fallacies, and rhetorical strategies.
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 italic mb-3">Author's Note</p>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    This app was an idea that I had years ago when I was first getting into coding. 
                    I was at a coding bootcamp and had recently left Rutgers where I had been pursuing an English degree. 
                    I envisioned a tool where I could physically demonstrate how arguments are structured and where they break down. 
                    I wanted to build something that would help people think more clearly about complex issues.
                  </p>
                  <p>
                    I've spent far too many discussions, online or in person, where people talked in circles, avoided adressing issues with statements they've made. 
                    It is easy to get turned around in these discussions. 
                  </p>
                  <p>And thus, this app was created.</p>
                  <p>
                    If you like it or have feedback, please reach out! My email is below. If you are inclined to support me and projects I work on there are also links below.
                  </p>
                  <p className="pt-2">
                    Stay awesome,
                    <br />
                    <span className="inline-block mt-1 font-semibold text-base">
                      {'Caleb Sundance'.split('').map((char, i) => (
                        <span
                          key={i}
                          className="inline-block animate-wave-red"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500">Contact:</span>
                <button
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {emailCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Email
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500">Support:</span>
                <a
                  href="https://patreon.com/calebsundance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z"/>
                  </svg>
                  Patreon
                </a>
                <a
                  href="https://venmo.com/u/lifenav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 2c.91 1.51 1.32 3.07 1.32 5.06 0 6.31-5.39 14.52-9.77 20.28H3.47L.5 2.38l7.06-.66 1.96 15.74C11.5 14.12 14.04 8.88 14.04 5.5c0-1.86-.47-3.14-1.14-4.17L19.5 2z"/>
                  </svg>
                  Venmo
                </a>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Legal</h2>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => navigate('/privacy')}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Privacy Policy</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Terms of Service</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
