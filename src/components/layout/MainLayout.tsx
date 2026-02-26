import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  showLeftSidebar?: boolean;
  onLeftSidebarClose?: () => void;
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
  onLeftSidebarClose,
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
      {/* Left Sidebar Overlay (mobile) */}
      {showLeftSidebar && leftSidebar && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onLeftSidebarClose}
          />
          {/* Sidebar */}
          <aside className="fixed lg:relative inset-y-0 left-0 z-50 w-72 lg:w-64 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0 shadow-lg lg:shadow-none">
            {leftSidebar}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>

      {/* Right Sidebar - Fallacy Reference Panel */}
      {effectiveShowRightSidebar && effectiveRightSidebar && (
        <>
          {/* Backdrop for mobile when expanded */}
          {rightSidebarExpanded && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={onRightSidebarToggle}
            />
          )}
          <aside 
            className={`fixed lg:relative inset-y-0 right-0 z-50 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 transition-all duration-300 shadow-lg lg:shadow-none ${
              rightSidebarExpanded ? 'w-80 sm:w-80' : 'w-12'
            } ${!rightSidebarExpanded ? 'hidden lg:block' : ''}`}
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
                      className="p-3 hover:bg-gray-100 rounded-lg touch-manipulation"
                      title="Collapse panel"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    className="p-3 hover:bg-gray-100 rounded-lg touch-manipulation"
                    title="Expand panel"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
};
