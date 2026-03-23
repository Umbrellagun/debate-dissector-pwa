---
description: Post-feature completion checklist - run tests, update docs, add analytics, bump version, and commit
---

# Finish Feature Workflow

Run this workflow after completing a feature to ensure everything is properly wrapped up.

## Steps

### 1. Check and Update Tests
- Run all existing test suites (`npx react-scripts test --watchAll=false --verbose`).
- Review any failing tests: determine if the test is catching a real bug or is outdated.
  - If the test is **valid** and revealing a real issue, fix the **code**, not the test.
  - If the test is **outdated** (e.g., testing removed UI, wrong counts after intentional changes), update the test to reflect the new behavior correctly.
- Ensure new feature code has appropriate test coverage. Add tests if missing.
- Re-run tests to confirm all pass.

### 2. Update Plan and Roadmap Docs
- Read `docs/plans/pwa-rebuild-plan.md` and check off any items completed by this feature.
- Read `docs/plans/trello-roadmap.md` and check off corresponding items. Add new items if the feature introduced something not yet listed.
- Update the "Last Updated" date in the roadmap.

### 3. Check Umami Analytics Coverage
- Read `src/hooks/useAnalytics.ts` to see the current event types.
- Review all new user-facing interactions from the feature (button clicks, page views, CRUD operations).
- Add any missing event types to `AnalyticsEvent` and `AnalyticsEventData`.
- Wire up `trackAnalyticsEvent()` calls at the actual call sites in components/pages.
- Verify the build still compiles after analytics changes.

### 4. Bump Version and Changelog
- Read `package.json` for the current version.
- Determine the appropriate semver bump:
  - **Patch** (x.y.Z): bug fixes only
  - **Minor** (x.Y.0): new features, non-breaking
  - **Major** (X.0.0): breaking changes
- Update `version` in `package.json`.
- Add a new entry at the top of `src/data/changelog.ts` with the new version, today's date, a descriptive title, and concise change bullets.

// turbo
### 5. Commit Changes
- Stage all changes and commit with a conventional commit message.
- Format: `feat: <short description>` for features, `fix: <short description>` for fixes.
- Include a body listing key changes if the diff is large.
