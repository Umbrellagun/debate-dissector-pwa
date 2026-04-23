# Debate Dissector Roadmap

A high-level feature roadmap for the Debate Dissector PWA.

---

## Progress Checklist

**Last Updated:** April 23, 2026

### Foundation
Core app setup and infrastructure.

#### Project Setup
- [x] PWA configuration with offline support
- [x] Project structure and design system

### Core Features
The main debate analysis functionality.

#### Debate Editor
- [x] Rich text editor
- [x] Auto-save functionality

#### Annotation System
- [x] Fallacy and Rhetoric color-coded annotations
- [x] Annotation filtering and navigation
- [x] Pinned annotation shortcuts for quick toolbar access

#### Document Management
- [x] Create, edit, delete debates
- [x] Document version history
- [ ] Document version restore/revert

### Advanced Editor Features
Enhanced editing capabilities.

#### Speaker Formatting
- [x] Assign speakers to text sections
- [x] Visual indicators for speaker turns
- [x] Speaker management UI

#### Argument Map View
- [x] Argument Map alternative view mode (view switcher)
- [x] Extract and display all marked-up text as blocks
- [x] Color-coded blocks with speaker badges and summary stats
- [x] Visual link connectors between related blocks (manual linking + speaker-colored SVG arrows)
- [ ] Link types (supports/rebuts) and thesis root markers
- [ ] Tree view (hierarchical branching layout with staging area)
- [ ] Sunburst view (radial argument structure visualization)
- [ ] Filter/group by markup type or speaker

#### Claim & Evidence Markup
- [x] Mark claims, evidence, and unsupported assertions
- [x] Flag text needing source citations
- [x] Visual indicators for claim types (statistics, quotes, anecdotes)
- [ ] Evidence linking (connect sources to claims)
- [x] Verification status tracking
- [ ] Evidence report generation

#### Comments System
- [x] Add comments to text selections
- [x] Comment threading and replies
- [x] Comment resolution
- [x] Comment editing and deletion
- [x] Inline comment indicators (amber highlight)
- [x] Unified reply/parent comment options (edit, resolve, reply, delete)
- [x] Resolved comments visible but dimmed (not hidden)
- [x] Resolved comments remove editor text highlight
- [x] Close buttons on Stats and Comments sidebars

### User Experience
Polish and usability improvements.

#### Statistics & Visualization
- [x] Annotation distribution charts
- [x] Text coverage percentages
- [x] ~~Export annotation reports~~ (removed)
- [x] Per-speaker annotation statistics and coverage

#### Annotation Visibility Controls
- [x] Toggle visibility of individual fallacy annotations in the editor
- [x] Toggle visibility of individual rhetoric annotations in the editor
- [x] Toggle visibility of individual claim & evidence markup types
- [x] Bulk show/hide all fallacies, rhetoric, or claims & evidence
- [x] Bulk show/hide by subcategory
- [x] Persist visibility preferences per document

#### Accessibility
- [x] Keyboard navigation
- [x] Screen reader support
- [x] ARIA labels and announcements
- [ ] Manual accessibility testing

#### Mobile Experience
- [x] Responsive design
- [x] Touch interactions
- [ ] Cross-device testing

#### Floating Selection Toolbar
- [x] Floating action bar on text selection (desktop + mobile)
- [x] Quick actions: Comment, pinned annotation shortcuts
- [x] Formatting actions: Bold, Italic, Underline
- [x] Auto-dismiss and smart positioning

#### Customization
- [x] Custom colors for fallacy annotations
- [x] Custom colors for rhetoric annotations
- [x] Custom colors for claim & evidence markup
- [x] Custom colors for speaker defaults

### Sharing & Collaboration
Share debates with others.

#### Document Sharing
- [x] Share via short URLs
- [x] View-only mode for shared documents
- [x] Import shared documents locally
- [ ] "My Shared Links" management UI

### Public Debate Library (Future)
Browsable library of published analyses. ⚠️ Introduces UGC with major security/moderation/legal obligations.

#### Core Browsing
- [ ] Public feed/gallery of published debate analyses
- [ ] Search by title, topic, speaker, or annotation type
- [ ] Category/topic tagging and sorting

#### Publishing & Attribution
- [ ] "Publish" action (distinct from private sharing)
- [ ] Author attribution and draft/published/unlisted status
- [ ] Edit or unpublish after publishing

#### Security & Moderation ⚠️
- [ ] User authentication (prerequisite)
- [ ] Content moderation queue and admin review dashboard
- [ ] Automated screening (profanity, spam)
- [ ] Report/flag system and user banning
- [ ] DMCA takedown process
- [ ] **LEGAL:** Update Privacy Policy and ToS for UGC, public profiles, COPPA

#### Infrastructure
- [ ] Evaluate database scalability (SQLite → PostgreSQL)
- [ ] Full-text search indexing
- [ ] Pagination, CDN caching for popular debates

### Platform Features
App-wide capabilities.

#### Roadmap & Changelog
- [x] Public Trello roadmap
- [x] In-app changelog

#### Internationalization
- [ ] Multi-language support
- [ ] Translate fallacy definitions
- [ ] RTL language support

#### Analytics
- [x] Privacy-friendly analytics (Umami)
- [ ] Optional analytics opt-out
- [ ] Analytics dashboard

### Future Preparation
Groundwork for future features.

#### Authentication
- [ ] User accounts (placeholder)
- [ ] Login/signup UI

#### Feature Flags
- [ ] Runtime feature toggles
- [ ] Gradual feature rollout

### Testing & Quality
Ensure reliability and performance.

#### Automated Testing
- [x] Unit tests
- [x] Component tests
- [ ] End-to-end tests (Playwright)

#### Performance
- [ ] Lighthouse CI audits
- [ ] Bundle size optimization
- [ ] Large document benchmarks

---
