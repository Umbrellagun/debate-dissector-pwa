import React from 'react';

interface HeaderProps {
  title?: string;
  titleElement?: React.ReactNode;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Debate Dissector',
  titleElement,
  onMenuClick,
  onBackClick,
  actions,
}) => {
  return (
    <header className="h-14 border-b border-gray-200 bg-white px-3 sm:px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 touch-manipulation"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        )}
        {onMenuClick && !onBackClick && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 touch-manipulation"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {titleElement ? (
          <div className="flex-1 min-w-0">{titleElement}</div>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};
