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
  | 'structural_selected'
  | 'pwa_installed'
  | 'pwa_prompt_shown'
  | 'pwa_prompt_dismissed'
  | 'version_created'
  | 'version_restored'
  | 'settings_changed'
  | 'search_used'
  | 'stats_panel_opened'
  | 'stats_tab_switched'
  | 'stats_breakdown_clicked'
  | 'speaker_assigned'
  | 'speaker_created'
  | 'speaker_edited'
  | 'speaker_deleted'
  | 'share_link_created'
  | 'shared_doc_viewed'
  | 'shared_doc_imported'
  | 'comment_created'
  | 'comment_edited'
  | 'comment_deleted'
  | 'comment_resolved'
  | 'comment_replied'
  | 'annotation_visibility_toggled'
  | 'annotation_bulk_visibility_toggled'
  | 'annotation_pinned'
  | 'annotation_unpinned'
  | 'annotation_color_changed'
  | 'annotation_color_reset'
  | 'annotation_colors_reset_all'
  | 'speaker_color_changed'
  | 'speaker_color_reset'
  | 'speaker_colors_reset_all';

export interface AnalyticsEventData {
  document_created: { title?: string };
  document_deleted: { documentId: string };
  annotation_applied: { type: 'fallacy' | 'rhetoric' | 'structural'; id: string; name: string };
  annotation_removed: { type: 'fallacy' | 'rhetoric' | 'structural'; id: string };
  fallacy_selected: { id: string; name: string; category: string };
  rhetoric_selected: { id: string; name: string; category: string };
  structural_selected: { id: string; name: string; category: string };
  pwa_installed: Record<string, never>;
  pwa_prompt_shown: Record<string, never>;
  pwa_prompt_dismissed: Record<string, never>;
  version_created: { documentId: string };
  version_restored: { documentId: string; versionId: string };
  settings_changed: { setting: string; value: string };
  search_used: { query: string; resultCount: number };
  stats_panel_opened: Record<string, never>;
  stats_tab_switched: { tab: string };
  stats_breakdown_clicked: {
    type: 'fallacy' | 'rhetoric' | 'structural';
    id: string;
    name: string;
  };
  speaker_assigned: { speakerId: string; speakerName: string };
  speaker_created: { speakerName: string };
  speaker_edited: { speakerId: string; speakerName: string };
  speaker_deleted: { speakerId: string };
  share_link_created: { documentId: string };
  shared_doc_viewed: { shareId: string };
  shared_doc_imported: { shareId: string };
  comment_created: { commentId: string };
  comment_edited: { commentId: string };
  comment_deleted: { commentId: string };
  comment_resolved: { commentId: string };
  comment_replied: { commentId: string; parentId: string };
  annotation_visibility_toggled: {
    type: 'fallacy' | 'rhetoric' | 'structural';
    id: string;
    action: 'show' | 'hide';
  };
  annotation_bulk_visibility_toggled: {
    type: 'fallacy' | 'rhetoric' | 'structural';
    scope: 'section' | 'subcategory';
    action: 'show' | 'hide';
    count: number;
  };
  annotation_pinned: { type: 'fallacy' | 'rhetoric'; id: string; name: string };
  annotation_unpinned: { type: 'fallacy' | 'rhetoric'; id: string; name: string };
  annotation_color_changed: {
    type: 'fallacy' | 'rhetoric' | 'structural';
    id: string;
    name: string;
  };
  annotation_color_reset: { type: 'fallacy' | 'rhetoric' | 'structural'; id: string; name: string };
  annotation_colors_reset_all: { count: number };
  speaker_color_changed: { speakerIndex: number };
  speaker_color_reset: { speakerIndex: number };
  speaker_colors_reset_all: { count: number };
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    <T extends AnalyticsEvent>(eventName: T, eventData?: AnalyticsEventData[T]) => {
      // Only track if umami is loaded and we're in production
      if (typeof window !== 'undefined' && window.umami) {
        try {
          window.umami.track(eventName, eventData as Record<string, string | number | boolean>);
        } catch (error) {
          // Silently fail - analytics should never break the app
          console.debug('Analytics tracking failed:', error);
        }
      }
    },
    []
  );

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
