import React, { useEffect, useRef } from 'react';

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

  const leftSidebarRef = useRef<HTMLElement>(null);
  const rightSidebarRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap for left sidebar
  useEffect(() => {
    if (showLeftSidebar && leftSidebarRef.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const firstFocusable = leftSidebarRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else if (!showLeftSidebar && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [showLeftSidebar]);

  // Focus trap for right sidebar
  useEffect(() => {
    if (rightSidebarExpanded && rightSidebarRef.current) {
      // Only trap focus on mobile where sidebar overlays content
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        const firstFocusable = rightSidebarRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }
  }, [rightSidebarExpanded]);

  // Handle Escape key to close sidebars
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLeftSidebar && onLeftSidebarClose) {
          onLeftSidebarClose();
        } else if (rightSidebarExpanded && onRightSidebarToggle) {
          const isMobile = window.innerWidth < 1024;
          if (isMobile) {
            onRightSidebarToggle();
          }
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLeftSidebar, rightSidebarExpanded, onLeftSidebarClose, onRightSidebarToggle]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      {leftSidebar && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
              showLeftSidebar ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
            }`}
            onClick={onLeftSidebarClose}
          />
          {/* Sidebar - slides in from left on both mobile and desktop */}
          <aside 
            ref={leftSidebarRef}
            className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 border-r border-gray-200 bg-white overflow-hidden flex-shrink-0 shadow-lg transition-transform duration-300 ease-in-out ${
              showLeftSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="navigation"
            aria-label="Document navigation"
            aria-hidden={!showLeftSidebar}
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {leftSidebar}
              </div>
              {onLeftSidebarClose && (
                <div className="border-t border-gray-200 p-2 flex justify-center">
                  <button
                    onClick={onLeftSidebarClose}
                    className="p-3 bg-violet-100 hover:bg-violet-200 rounded-lg touch-manipulation"
                    title="Close panel"
                    aria-label="Close navigation panel"
                  >
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden min-w-0" tabIndex={-1}>
        {children}
      </main>

      {/* Right Sidebar - Fallacy Reference Panel */}
      {effectiveShowRightSidebar && effectiveRightSidebar && (
        <>
          {/* Backdrop for mobile when expanded */}
          <div 
            className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
              rightSidebarExpanded ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
            }`}
            onClick={onRightSidebarToggle}
          />
                    {/* Sidebar - slides in from right on both mobile and desktop */}
          <aside 
            ref={rightSidebarRef}
            className={`fixed inset-y-0 right-0 z-50 w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 shadow-lg transition-transform duration-300 ease-in-out ${
              rightSidebarExpanded ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="complementary"
            aria-label="Annotation reference panel"
            aria-hidden={!rightSidebarExpanded}
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {effectiveRightSidebar}
              </div>
              {onRightSidebarToggle && (
                <div className="border-t border-gray-200 p-2 flex justify-center">
                  <button
                    onClick={onRightSidebarToggle}
                    className="p-3 bg-violet-100 hover:bg-violet-200 rounded-lg touch-manipulation"
                    title="Close panel"
                    aria-label="Close annotation panel"
                  >
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
