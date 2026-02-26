import React from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export const InstallPrompt: React.FC = () => {
  const { showPrompt, isIOS, promptInstall, dismissPrompt } = useInstallPrompt();

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">Install Debate Dissector</h3>
          {isIOS ? (
            <p className="text-xs text-gray-600 mt-1">
              Tap <span className="inline-flex items-center">
                <svg className="w-4 h-4 mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span> then <strong>"Add to Home Screen"</strong> for the best experience.
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">
              Add to your home screen for quick access and offline use.
            </p>
          )}
        </div>
        <button
          onClick={dismissPrompt}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {!isIOS && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={dismissPrompt}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Not now
          </button>
          <button
            onClick={promptInstall}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
};
