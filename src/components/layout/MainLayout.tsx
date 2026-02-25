import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  showLeftSidebar?: boolean;
  rightSidebar?: React.ReactNode;
  showRightSidebar?: boolean;
  rightSidebarExpanded?: boolean;
  onRightSidebarToggle?: () => void;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  leftSidebar,
  showLeftSidebar = false,
  rightSidebar,
  showRightSidebar = false,
  rightSidebarExpanded = true,
  onRightSidebarToggle,
  sidebar,
  showSidebar = true,
}) => {
  const effectiveRightSidebar = rightSidebar || sidebar;
  const effectiveShowRightSidebar = rightSidebar ? showRightSidebar : showSidebar;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Editor Menu */}
      {showLeftSidebar && leftSidebar && (
        <aside className="w-64 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          {leftSidebar}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>

      {/* Right Sidebar - Fallacy Reference Panel */}
      {effectiveShowRightSidebar && effectiveRightSidebar && (
        <aside 
          className={`border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 transition-all duration-300 ${
            rightSidebarExpanded ? 'w-80' : 'w-12'
          }`}
        >
          {rightSidebarExpanded ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {effectiveRightSidebar}
              </div>
              {onRightSidebarToggle && (
                <div className="border-t border-gray-200 p-2 flex justify-center">
                  <button
                    onClick={onRightSidebarToggle}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Collapse panel"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-end pb-2">
              {onRightSidebarToggle && (
                <button
                  onClick={onRightSidebarToggle}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Expand panel"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
