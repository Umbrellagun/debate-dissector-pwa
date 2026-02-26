import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-lg">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
            />
          </svg>
          <span className="font-medium">You're offline</span>
          <span className="text-amber-100 text-sm">Changes are saved locally</span>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg animate-pulse">
          <svg 
            className="w-5 h-5" 
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
          <span className="font-medium">Back online</span>
        </div>
      ) : null}
    </div>
  );
};
