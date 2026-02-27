/**
 * Analytics hook for tracking events with Umami
 * 
 * Setup:
 * 1. Deploy Umami (https://umami.is/docs/install)
 * 2. Add your website in Umami dashboard
 * 3. Set environment variables:
 *    - REACT_APP_UMAMI_WEBSITE_ID=your-website-id
 *    - REACT_APP_UMAMI_SCRIPT_URL=https://your-umami-instance.com/script.js
 */

import { useCallback } from 'react';

// Extend window to include umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

// Event types for type safety
export type AnalyticsEvent = 
  | 'document_created'
  | 'document_deleted'
  | 'annotation_applied'
  | 'annotation_removed'
  | 'fallacy_selected'
  | 'rhetoric_selected'
  | 'pwa_installed'
  | 'pwa_prompt_shown'
  | 'pwa_prompt_dismissed'
  | 'version_created'
  | 'version_restored'
  | 'settings_changed'
  | 'search_used';

export interface AnalyticsEventData {
  document_created: { title?: string };
  document_deleted: { documentId: string };
  annotation_applied: { type: 'fallacy' | 'rhetoric'; id: string; name: string };
  annotation_removed: { type: 'fallacy' | 'rhetoric'; id: string };
  fallacy_selected: { id: string; name: string; category: string };
  rhetoric_selected: { id: string; name: string; category: string };
  pwa_installed: Record<string, never>;
  pwa_prompt_shown: Record<string, never>;
  pwa_prompt_dismissed: Record<string, never>;
  version_created: { documentId: string };
  version_restored: { documentId: string; versionId: string };
  settings_changed: { setting: string; value: string };
  search_used: { query: string; resultCount: number };
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const trackEvent = useCallback(<T extends AnalyticsEvent>(
    eventName: T,
    eventData?: AnalyticsEventData[T]
  ) => {
    // Only track if umami is loaded and we're in production
    if (typeof window !== 'undefined' && window.umami) {
      try {
        window.umami.track(eventName, eventData as Record<string, string | number | boolean>);
      } catch (error) {
        // Silently fail - analytics should never break the app
        console.debug('Analytics tracking failed:', error);
      }
    }
  }, []);

  return { trackEvent };
}

/**
 * Track an event without using the hook (for non-component code)
 */
export function trackAnalyticsEvent<T extends AnalyticsEvent>(
  eventName: T,
  eventData?: AnalyticsEventData[T]
) {
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(eventName, eventData as Record<string, string | number | boolean>);
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }
}
