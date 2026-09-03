# Authentication, Entitlement & Billing Plan

**Status:** Design  
**Last Updated:** September 3, 2026  
**Related:** pwa-rebuild-plan.md § 6.1 Authentication Hooks, § 11.7 Billing & Account Infrastructure

---

## 1. Overview

Debate Dissector shipped Pro export features (Phase 11.1) but currently gates them with a
**device-local, self-settable flag** — there is no real way to sell or verify Pro. This document
designs the minimal **account system** and **server-owned entitlement** needed to support paid
subscriptions, followed by the **Stripe billing** integration itself.

The work is deliberately built on the **PocketBase** backend already deployed for sharing
(Fly.io), reusing its built-in `users` auth collection rather than adding a new auth vendor.

**Auth (Phases A + B) is a prerequisite for billing (Phase C).** Stripe needs a stable customer
identity and a server-side source of truth that a webhook can update — a local flag cannot back a
real subscription.

---

## 2. Guiding Principles

These are hard requirements, not preferences. Every phase below must uphold them.

1. **Local-first, login-optional.** The core experience — create, edit, annotate, map, and export
   (free-tier) debates — must remain **fully usable without an account**, online or offline.
   Login only *adds* capabilities (buy/sync Pro, and later optional cloud backup). It never becomes
   a gate on core use.
2. **Never destroy local data on login. Merge, never replace.** Signing in must **not** wipe,
   overwrite, or hide documents the user created while logged out. Some apps replace all local data
   with the account's server data on login, silently losing prior work — **this is explicitly
   forbidden here.** See § 5 for the binding data policy.
3. **Entitlement is server-owned.** Pro status is set only by the backend (via Stripe webhook),
   never self-elevated by the client in production. The client caches a *verified* entitlement for
   offline use; it cannot forge one.
4. **Minimal footprint.** Reuse PocketBase auth + a small entitlement schema. Avoid new
   infrastructure and recurring cost where possible.

---

## 3. Current State

- **Backend:** PocketBase (Go + SQLite) on Fly.io, currently serving `shared_debates`; the SDK is
  wired in `src/services/sharing/index.ts`. PocketBase ships a built-in `users` auth collection
  (email/password + OAuth2, JWT sessions) that is not yet used by the app.
- **Pro gating (local only):**
  - `plan?: 'free' | 'pro'` on `UserPreferences` in `src/models/document.ts` (defaults to `free`).
  - `ExportDialog` derives `isPro = preferences.plan === 'pro'` and exposes a **dev-only**
    "Enable Pro for testing" button (guarded by `NODE_ENV === 'development'`); the UI notes the
    "upgrade flow is in development".
  - Settings has a matching dev toggle.
- **Auth code:** none exists yet (no auth context, service, or UI).
- **Documents:** stored **only** in local IndexedDB. Nothing is synced to any account today.

---

## 4. Architecture

```
                     ┌─────────────────────────────┐
   React PWA         │  AuthContext / useAuth()     │
  (local-first)      │  wraps pb.authStore          │
                     └──────────────┬──────────────┘
                                    │ JWT (persisted, auto-refresh)
                                    ▼
                     ┌─────────────────────────────┐
   PocketBase        │  users (auth)                │  ← identity
   (Fly.io)          │  subscriptions / entitlement │  ← server-owned Pro
                     └──────────────┬──────────────┘
                                    ▲ webhook (signed)
                                    │
                     ┌─────────────────────────────┐
   Stripe            │  Checkout + Billing Portal   │
                     │  subscription lifecycle      │
                     └─────────────────────────────┘
```

- **Identity:** PocketBase `users` collection. Email/password first; Google OAuth2 later.
- **Client session:** `AuthContext` wraps `pb.authStore` (persisted to localStorage by the SDK),
  refreshes the token on app load, and exposes `user`, `isAuthenticated`, `isPro`, and auth actions.
- **Entitlement:** owned by the backend, set only by the Stripe webhook (§ 7–8).
- **Billing:** Stripe Checkout (hosted) for purchase; Stripe Billing Portal for manage/cancel.

---

## 5. Data Handling & Merge Policy (binding)

> **Hard rule:** Logging in, logging out, or syncing must **never** delete or overwrite a local
> document as a side effect. The only acceptable outcomes for a user's existing local work are
> "kept as-is" or "kept and also backed up". Destructive replacement is a defect, not a tradeoff.

### 5.1 What lives where

| Data | Location (v1) | Notes |
|------|---------------|-------|
| Debate documents, annotations, maps, comments | **Local IndexedDB only** | Never touched by auth in v1 |
| User preferences (colors, visibility, etc.) | Local IndexedDB | Stays local |
| Identity (email, id) | PocketBase `users` | Added by auth |
| Entitlement (plan/subscription) | PocketBase + local cache | Server-owned; cache read-only |

### 5.2 v1 — login does not touch documents (zero data-loss by design)

In the first release, **accounts hold only identity + entitlement**. There is **no document sync**.
Login/logout affect only the auth token and the cached entitlement. Because documents are never
read from or written to the account, there is nothing that could overwrite local work.

- **Log in:** attach identity + entitlement; documents remain exactly as they were.
- **Log out:** clear the auth token and cached entitlement; **keep all local documents**.

### 5.3 Future — optional cloud sync (later phase, non-destructive merge)

If/when optional cloud backup or multi-device sync is added, it must follow this reconciliation
algorithm on first login and on every sync. **Union, never replace:**

1. **Never clear local storage** as part of login/sync.
2. **Adopt local documents** into the account: tag existing local docs with the signed-in user and
   queue them for upload (after a one-time, clearly-worded prompt — never automatic deletion).
3. **Reconcile by stable `id`:**
   - Local-only doc → keep locally, upload to account.
   - Remote-only doc → download to local.
   - Exists in both → compare `updatedAt`: newer wins as the *primary*, but the older side is
     **preserved as a version/backup copy** (or a "(conflict copy)" duplicate) — never silently
     discarded.
4. **Deletions are explicit and tombstoned.** A document absent on the server is treated as
   "not yet uploaded", **not** "deleted". Real deletes propagate only via an explicit tombstone the
   user created.
5. **Guest → account transition is additive.** Work done while logged out is merged in, not
   replaced.

### 5.4 Offline entitlement cache

- Cache the last **server-verified** entitlement (`plan`, `expiresAt`, `verifiedAt`) in IndexedDB.
- While offline, honor the cached entitlement until a grace window (e.g., a few days past
  `expiresAt`) so paying users keep Pro offline.
- Re-verify on reconnect. In production the client can **read** but never **set** entitlement; the
  only writer is the backend webhook. The dev-only unlock stays `NODE_ENV`-guarded.

---

## 6. Phase A — Minimal Accounts *(prerequisite)*

**Goal:** optional email/password accounts on PocketBase, with the app still fully usable logged out.

### Backend
- Configure the built-in `users` auth collection; set API rules (owner read/update, no public
  listing; disable open sign-ups only if invite-gating is desired).
- Enable email verification + password reset flows.

### Frontend
- `AuthContext` + `useAuth()` wrapping `pb.authStore`; persist session and call `authRefresh()` on
  load; expose `user`, `isAuthenticated`, and actions (`login`, `signup`, `logout`, `requestReset`).
- Auth UI: login / signup / forgot-password (modal or `/account` route).
- Header account menu (avatar/initials) with sign-in CTA when logged out, and sign-out when in.
- **Guarantee:** logged-out users hit no walls on core features; sign-out preserves local docs.

### Legal
- ToS-acceptance checkbox on signup.
- Privacy Policy update: email/account data collection.

---

## 7. Phase B — Entitlement Source of Truth

**Goal:** replace the self-settable local flag with server-owned entitlement.

### Backend
- Add a `subscriptions` collection (or entitlement fields on `users`):
  `user`, `status` (`active|trialing|past_due|canceled`), `plan`, `currentPeriodEnd`,
  `stripeCustomerId`, `stripeSubscriptionId`.
- API rules: owner can **read** their entitlement; only admin/webhook can **write**.

### Frontend
- Derive `isPro` from the authed user's server entitlement (active/trialing), not the local toggle.
- Turn the local `plan` preference into a **read-only cache** of the verified server value (§ 5.4).
- Keep the dev-only unlock behind `NODE_ENV` for testing.
- Logged-out users: `isPro = false` (Pro requires an account), free-tier export unaffected.

---

## 8. Phase C — Stripe Billing

**Goal:** actually sell Pro; entitlement flips automatically via webhook.

### Stripe setup
- Products/prices: monthly + annual; optional free trial.

### Backend (in `debate-dissector-api`)
- `POST /create-checkout-session` → Stripe Checkout session for the signed-in user (creates/looks up
  the Stripe customer, stores `stripeCustomerId`).
- `POST /create-portal-session` → Stripe Billing Portal for manage/cancel.
- `POST /stripe/webhook` → **verify the Stripe signature**, then update entitlement on:
  `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.payment_failed`. Implement as a PocketBase custom route/hook (Go) or a small serverless
  function.

### Frontend
- Pricing/upgrade page + "Upgrade" CTA that replaces the "upgrade flow is in development" note in
  `ExportDialog`.
- "Manage subscription" link (Billing Portal) in account settings.
- After checkout return, re-verify entitlement (don't trust the client redirect alone).

### Rule
- **Never trust the client for entitlement.** Server state (webhook-driven) is authoritative.

---

## 9. Phase D — Legal & Polish

- **Privacy Policy:** Stripe as payment processor; payment metadata handling.
- **ToS:** subscription terms, auto-renewal, refund policy.
- **Analytics:** `signup`, `login`, `logout`, `upgrade_started`, `upgrade_completed`,
  `subscription_canceled`.
- **Account settings:** show plan/status, renewal date, manage/cancel, sign out.

---

## 10. Migration Risks & Do-Now Pre-work

The phased sequencing (accounts → entitlement → billing, **documents untouched**) is deliberately
chosen to avoid a rip-out. The real risk is not the phases but a few **data "seams"** that are cheap
to get right early and expensive to retrofit. Lock these down before/at Phase A.

> **Good news from the current codebase:** IndexedDB is already **versioned** (`DB_VERSION = 2`) with
> a dedicated **`syncQueue`** store ("for future remote sync capability"), and documents already carry
> `createdAt`/`updatedAt`. The migration *mechanism* and a conflict-resolution basis already exist —
> see `src/services/storage/db.ts`.

| Seam | Risk if ignored | Do-now action | Cost now |
|------|-----------------|---------------|----------|
| **A. Document ID format** | id remap + reference rewrite + local migration when sync lands | Emit PocketBase-compatible, globally-unique ids | Small |
| **B. Entitlement read** | swapping local→server entitlement touches many files | One `useEntitlement()` / `isPro` selector | Tiny |
| **C. Ownership** | backfilling `ownerId` or repairing a premature required field | `ownerId?` optional, stamped only at adopt-time | Free (decision) |
| **D. Identity linking** | email + OAuth on same email = split accounts to merge | Decide policy up front (defer OAuth or link by verified email) | Free (decision) |
| **E. Entitlement source** | comps/education grants don't fit a Stripe-only model | Entitlement record with a `source` field | Small |
| **F. Cloud sync** | inherently large (conflicts, tombstones, queue, merge UI) | Keep optional & deferred; A–C make it additive | N/A (deferred) |

### A. Document ID format *(the classic trap)*
Today ids look like `doc_${Date.now()}_${random}` (`src/services/storage/documentStorage.ts`).
PocketBase's default record id is a **15-char lowercase-alphanumeric primary key**, so these don't
match. Keeping them means adding sync later forces either an id remap (rewriting references in
`versions.documentId` and `syncQueue`) or a permanent `localId ↔ serverId` mapping threaded through
all sync/merge code.
**Do now:** change `generateDocumentId()` to emit a globally-unique, PB-compatible 15-char id so
future documents upload **as-is** (one id end-to-end). Existing `doc_…` records keep working; only
they get adopted/remapped at sync time.

### B. Entitlement read indirection
`isPro` is currently read directly as `preferences.plan === 'pro'` in only two places (`ExportDialog`,
`SettingsPage`). Before that pattern spreads, route it through a single `useEntitlement()` selector.
Phase B then changes **one** implementation instead of every call site.

### C. Ownership model
Documents have no owner today, which is correct for local-first. Do **not** add a required `ownerId`.
Add it as **optional**, populated only when a document is adopted into an account at sync time. The
versioned `idb` upgrade handles the field addition without a messy migration.

### D. Identity linking
If we ship email/password now and add Google OAuth later, a user who signs in with Google under the
same email creates a **second account** → split entitlement/data. **Decide up front:** either defer
OAuth until sync exists, or link OAuth to an existing account by verified email from day one.

### E. Entitlement source
The revenue plan calls for **free access to Erie students/educators**. If "Pro" means "has an active
Stripe subscription," comps and education licenses require a later overhaul. Model entitlement with a
`source` (`stripe | comp | education | trial`) so Stripe is one of several ways to be Pro.

### F. Local → cloud sync (the only inherently large step)
Sync is the big jump (conflict resolution, tombstones, offline queue, merge UI). It is **optional,
deferred, and not required for auth or billing.** Seams A–C convert it from a rip-out into a
feature-add, and `syncQueue` shows it was anticipated. The binding rules for it live in § 5.3.

### Do-now pre-work (before Phase A)
- [ ] Switch `generateDocumentId()` to a PB-compatible, globally-unique id (keep old ids readable)
- [ ] Introduce a single `useEntitlement()` / `isPro` selector (local impl for now)
- [ ] Decide: OAuth timing + account-linking policy (seam D)
- [ ] Decide: entitlement `source` field shape (seam E)
- [ ] Add optional `ownerId?` to the document model (unused until sync)

---

## 11. Data Transparency: Making Local vs Account Obvious

Directly supports Principles #1–#2: users should always be able to see **what lives on their device
vs in their account**, and be reassured that login won't replace local work. Three durable layers:

### 11.1 A single data-locality registry (source of truth)
One typed manifest that the UI, docs, and tests all read from — so the boundary is defined in exactly
one place and evolves cleanly (e.g., `documents` flips to `both` only when sync ships):

```ts
type Locality = 'local-only' | 'account' | 'both';

export interface DataDomain {
  key: string;
  label: string;
  description: string;
  locality: Locality;
}

export const DATA_DOMAINS: DataDomain[] = [
  { key: 'documents',   label: 'Debates & annotations',       locality: 'local-only',
    description: 'Your transcripts, annotations, maps, and comments.' },
  { key: 'preferences', label: 'Preferences & custom colors',  locality: 'local-only',
    description: 'Editor settings and color customizations.' },
  { key: 'identity',    label: 'Email & login',                locality: 'account',
    description: 'Only present once you create an account.' },
  { key: 'entitlement', label: 'Subscription (Pro) status',    locality: 'both',
    description: 'Owned by the server; cached locally so Pro works offline.' },
];
```

### 11.2 Settings → "Your Data & Storage" panel
Render the registry as two clear columns — **On this device** vs **In your account** — with:
- A plain-language summary sentence.
- Live stats: document count and approximate storage used (`navigator.storage.estimate()`).
- A link to the Privacy Policy (extends the line-by-line transparency shipped in v1.13.0).

### 11.3 Contextual microcopy (at the moment of worry)
- **Login/signup modal:** *"Your debates stay on this device. Signing in adds your subscription and
  won't replace or delete your local work."*
- **Document indicator:** a subtle "On this device" label now; "Synced" later if/when sync ships.
- **Adopt prompt (only if sync ships):** never silent — *"We found N debates on this device. Add them
  to your account? We'll never delete your local copies."*

### Checklist
- [ ] `DATA_DOMAINS` registry as the single source of truth
- [ ] Settings "Your Data & Storage" panel driven by the registry
- [ ] Login/signup reassurance microcopy
- [ ] "On this device" document indicator
- [ ] Test asserting the registry matches actual storage locality

---

## 12. Open Questions / Decisions

- **Sign-up gating:** open registration vs invite/education-pilot gating for launch?
- **OAuth providers:** ship Google OAuth2 in Phase A, or defer?
- **Cloud sync:** confirm documents stay local-only for v1 (recommended) and sync is a later,
  opt-in phase governed by § 5.3.
- **Trial:** offer a Pro free trial (e.g., 14 days) at launch?
- **Grace window:** exact offline-entitlement grace duration.

---

## 13. Sequencing & Effort

| Phase | Scope | Rough size |
|-------|-------|-----------|
| Pre-work | Server-compatible IDs, `useEntitlement()`, locality registry, key decisions | S |
| A — Accounts | PocketBase auth + `AuthContext` + auth UI | M (mostly client) |
| B — Entitlement | Server entitlement schema + client derivation/cache | M |
| C — Billing | Stripe Checkout/Portal + signed webhook (API repo) | M–L |
| D — Legal & polish | Policy updates, analytics, account settings | S (launch-gating) |

**A + B together are the "user handling" prerequisite.** Do them first; C is the actual billing.

---

## 14. Checklists

### Phase A — Accounts
- [ ] Configure PocketBase `users` collection + API rules
- [ ] Email verification + password reset enabled
- [ ] `AuthContext` + `useAuth()` wrapping `pb.authStore` (persist + `authRefresh`)
- [ ] Login / signup / forgot-password UI
- [ ] Header account menu + sign-in/out
- [ ] Verify: app fully usable logged out; sign-out preserves local documents
- [ ] **LEGAL:** ToS checkbox on signup; Privacy Policy update (account data)

### Phase B — Entitlement
- [ ] `subscriptions` collection / entitlement fields (owner-read, admin/webhook-write)
- [ ] Derive `isPro` from server entitlement
- [ ] Local `plan` becomes read-only verified cache with offline grace
- [ ] Keep dev-only unlock `NODE_ENV`-guarded

### Phase C — Billing
- [ ] Stripe products/prices (monthly/annual, optional trial)
- [ ] `create-checkout-session` endpoint
- [ ] `create-portal-session` endpoint
- [ ] Signed `stripe/webhook` updating entitlement on subscription lifecycle events
- [ ] Pricing/upgrade UI replacing the "in development" note
- [ ] Re-verify entitlement after checkout return

### Phase D — Legal & polish
- [ ] **LEGAL:** Privacy Policy (payment processor)
- [ ] **LEGAL:** ToS (subscription terms, auto-renewal, refunds)
- [ ] Analytics events for auth + billing
- [ ] Account settings: plan status + manage subscription

### Data-safety acceptance tests (must pass)
- [ ] Create docs logged out → log in → all docs still present
- [ ] Log in on a device with local docs and an account that has other docs → **union**, nothing lost
- [ ] Log out → local docs remain
- [ ] Conflicting edits to same `id` → newer primary, older kept as backup/copy (never discarded)
