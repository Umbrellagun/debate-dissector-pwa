import React from 'react';
import { Link } from 'react-router-dom';
import { CHANGELOG } from '../data/changelog';

export const ChangelogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Settings & Info
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Version History</h1>
          <p className="text-gray-600 mb-6">
            A complete history of updates and improvements to Debate Dissector.
          </p>

          <div className="space-y-8">
            {CHANGELOG.map((entry, index) => (
              <div
                key={entry.version}
                className={`${index > 0 ? 'pt-8 border-t border-gray-200' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    v{entry.version}
                  </span>
                  <span className="text-sm text-gray-500">{entry.date}</span>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Latest
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{entry.title}</h2>
                <ul className="space-y-2">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Want to see what's coming next?{' '}
            <a
              href="https://trello.com/b/18eIup2Z/debate-dissector"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View our public roadmap on Trello
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
