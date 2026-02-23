import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebar,
  showSidebar = true,
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Right Sidebar - Fallacy Reference Panel */}
      {showSidebar && sidebar && (
        <aside className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
          {sidebar}
        </aside>
      )}
    </div>
  );
};
