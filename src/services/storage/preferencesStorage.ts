import { getDB, initializePreferences } from './db';
import { UserPreferences, DEFAULT_USER_PREFERENCES } from '../../models';

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'user');
  return prefs || DEFAULT_USER_PREFERENCES;
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const db = await getDB();
  const current = await getPreferences();

  const updated: UserPreferences = {
    ...current,
    ...updates,
  };

  await db.put('preferences', updated, 'user');
  return updated;
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferences(): Promise<UserPreferences> {
  const db = await getDB();
  await db.put('preferences', DEFAULT_USER_PREFERENCES, 'user');
  return DEFAULT_USER_PREFERENCES;
}

export { initializePreferences };
