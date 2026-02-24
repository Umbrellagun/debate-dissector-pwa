import { useEffect, useRef, useCallback } from 'react';
import { Descendant } from 'slate';
import { updateDocument } from '../services/storage';
import { Annotation } from '../models';

interface UseAutoSaveOptions {
  documentId: string | null;
  content: Descendant[];
  annotations: Record<string, Annotation>;
  title: string;
  enabled: boolean;
  interval: number;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  saveNow: () => Promise<void>;
  isDirty: boolean;
  lastSaved: Date | null;
}

export function useAutoSave({
  documentId,
  content,
  annotations,
  title,
  enabled,
  interval,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const isDirtyRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);
  const contentRef = useRef(content);
  const annotationsRef = useRef(annotations);
  const titleRef = useRef(title);

  // Update refs when values change
  useEffect(() => {
    if (
      JSON.stringify(contentRef.current) !== JSON.stringify(content) ||
      JSON.stringify(annotationsRef.current) !== JSON.stringify(annotations) ||
      titleRef.current !== title
    ) {
      isDirtyRef.current = true;
      contentRef.current = content;
      annotationsRef.current = annotations;
      titleRef.current = title;
    }
  }, [content, annotations, title]);

  const saveNow = useCallback(async () => {
    if (!documentId || !isDirtyRef.current) {
      return;
    }

    try {
      onSaveStart?.();

      await updateDocument(documentId, {
        content: contentRef.current,
        annotations: annotationsRef.current,
        title: titleRef.current,
      });

      isDirtyRef.current = false;
      lastSavedRef.current = new Date();
      onSaveComplete?.();
    } catch (error) {
      onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
    }
  }, [documentId, onSaveStart, onSaveComplete, onSaveError]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !documentId || interval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      if (isDirtyRef.current) {
        saveNow();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, documentId, interval, saveNow]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && documentId) {
        // Fire and forget - component is unmounting
        updateDocument(documentId, {
          content: contentRef.current,
          annotations: annotationsRef.current,
          title: titleRef.current,
        }).catch(console.error);
      }
    };
  }, [documentId]);

  return {
    saveNow,
    isDirty: isDirtyRef.current,
    lastSaved: lastSavedRef.current,
  };
}
