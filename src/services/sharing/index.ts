import PocketBase from 'pocketbase';
import { DebateDocument } from '../../models';

const API_URL = process.env.REACT_APP_API_URL || 'https://debate-dissector-api.fly.dev';

const pb = new PocketBase(API_URL);

/**
 * Data structure for a shared debate stored in PocketBase
 */
export interface SharedDebate {
  id: string;
  content: {
    content: DebateDocument['content'];
    annotations: DebateDocument['annotations'];
  };
  title: string;
  created: string;
  updated: string;
}

/**
 * Options for creating a new share
 */
export interface ShareOptions {
  title: string;
  content: DebateDocument['content'];
  annotations: DebateDocument['annotations'];
}

/**
 * Result of creating a share
 */
export interface ShareResult {
  id: string;
  shareUrl: string;
}

/**
 * Create a shareable link for a debate document
 */
export async function createShare(options: ShareOptions): Promise<ShareResult> {
  const { title, content, annotations } = options;

  const record = await pb.collection('shared_debates').create({
    title,
    content: { content, annotations },
  });

  const shareUrl = `${window.location.origin}/s/${record.id}`;

  return {
    id: record.id,
    shareUrl,
  };
}

/**
 * Fetch a shared debate by ID
 */
export async function getShare(id: string): Promise<SharedDebate | null> {
  try {
    const record = await pb.collection('shared_debates').getOne(id);
    return record as unknown as SharedDebate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export { pb };
