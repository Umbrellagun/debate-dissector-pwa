import { useApp } from '../context';
import { UserPreferences } from '../models';

export interface Entitlement {
  plan: 'free' | 'pro';
  isPro: boolean;
}

/**
 * Single source of truth for deriving a user's entitlement. Today "Pro" is a
 * local preference flag; when server-owned entitlement lands (see
 * docs/plans/auth-entitlement-plan.md, Phase B) only this function changes,
 * because every isPro check in the app routes through here.
 */
export function deriveEntitlement(preferences: Pick<UserPreferences, 'plan'>): Entitlement {
  const plan = preferences.plan === 'pro' ? 'pro' : 'free';
  return { plan, isPro: plan === 'pro' };
}

export function useEntitlement(): Entitlement {
  const { state } = useApp();
  return deriveEntitlement(state.preferences);
}
