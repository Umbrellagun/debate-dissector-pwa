import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShare, SharedDebate } from '../services/sharing';
import { SharedDocumentState } from './EditorPage';
import { trackAnalyticsEvent } from '../hooks/useAnalytics';

type PageState = 'loading' | 'ready' | 'error' | 'not_found';

export const SharedDebatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [sharedDebate, setSharedDebate] = useState<SharedDebate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShare = async () => {
      if (!id) {
        setPageState('not_found');
        return;
      }

      try {
        const share = await getShare(id);

        if (!share) {
          setPageState('not_found');
          return;
        }

        setSharedDebate(share);
        setPageState('ready');
        trackAnalyticsEvent('shared_doc_viewed', { shareId: id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        setError(err.message || 'Failed to load shared document');
        setPageState('error');
      }
    };

    fetchShare();
  }, [id]);

  // Redirect to EditorPage once ready
  useEffect(() => {
    if (pageState === 'ready' && sharedDebate) {
      const state: SharedDocumentState = { sharedDebate };
      navigate(`/s/${sharedDebate.id}/view`, { state, replace: true });
    }
  }, [pageState, sharedDebate, navigate]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Loading state
  if (pageState === 'loading' || pageState === 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shared document...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h1>
          <p className="text-gray-600 mb-6">This shared link may have been removed.</p>
          <button
            onClick={handleGoHome}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Document</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={handleGoHome}
          className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default SharedDebatePage;
