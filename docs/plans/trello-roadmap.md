# Debate Dissector Roadmap

A high-level feature roadmap for the Debate Dissector PWA.

---

## Progress Checklist

**Last Updated:** March 27, 2026

### Phase 1: Foundation
Core app setup and infrastructure.

#### 1.1 Project Setup
- [x] PWA configuration with offline support
- [x] Project structure and design system

### Phase 2: Core Features
The main debate analysis functionality.

#### 2.1 Debate Editor
- [x] Rich text editor
- [x] Auto-save functionality

#### 2.2 Annotation System
- [x] Fallacy and Rhetoric color-coded annotations
- [x] Annotation filtering and navigation
- [x] Pinned annotation shortcuts for quick toolbar access

#### 2.3 Document Management
- [x] Create, edit, delete debates
- [x] Document version history
- [ ] Document version restore/revert

### Phase 3: Advanced Editor Features
Enhanced editing capabilities.

#### 3.1 Speaker Formatting
- [x] Assign speakers to text sections
- [x] Visual indicators for speaker turns
- [x] Speaker management UI

#### 3.2 Argument Mapping
- [ ] Mark claims, rebuttals, and support points
- [ ] Link related arguments
- [ ] Argument flow visualization
- [ ] Interactive tree view of argument flow (claims → rebuttals → supports)
- [ ] Sunburst/radial diagram of debate topology
- [ ] Click-to-navigate between tree nodes and editor text
- [ ] Side-by-side view: editor + argument tree

#### 3.3 Claim & Evidence Markup
- [x] Mark claims, evidence, and unsupported assertions
- [x] Flag text needing source citations
- [x] Visual indicators for claim types (statistics, quotes, anecdotes)
- [ ] Evidence linking (connect sources to claims)
- [x] Verification status tracking
- [ ] Evidence report generation

#### 3.4 Comments System
- [x] Add comments to text selections
- [x] Comment threading and replies
- [x] Comment resolution
- [x] Comment editing and deletion
- [x] Inline comment indicators (amber highlight)
- [x] Unified reply/parent comment options (edit, resolve, reply, delete)
- [x] Resolved comments visible but dimmed (not hidden)
- [x] Resolved comments remove editor text highlight
- [x] Close buttons on Stats and Comments sidebars

### Phase 4: User Experience
Polish and usability improvements.

#### 4.1 Statistics & Visualization
- [x] Annotation distribution charts
- [x] Text coverage percentages
- [x] ~~Export annotation reports~~ (removed)
- [x] Per-speaker annotation statistics and coverage

#### 4.2 Annotation Visibility Controls
- [x] Toggle visibility of individual fallacy annotations in the editor
- [x] Toggle visibility of individual rhetoric annotations in the editor
- [x] Toggle visibility of individual claim & evidence markup types
- [x] Bulk show/hide all fallacies, rhetoric, or claims & evidence
- [x] Bulk show/hide by subcategory
- [x] Persist visibility preferences per document

#### 4.3 Accessibility
- [x] Keyboard navigation
- [x] Screen reader support
- [x] ARIA labels and announcements
- [ ] Manual accessibility testing

#### 4.4 Mobile Experience
- [x] Responsive design
- [x] Touch interactions
- [ ] Cross-device testing

#### 4.5 Floating Selection Toolbar
- [x] Floating action bar on text selection (desktop + mobile)
- [x] Quick actions: Comment, pinned annotation shortcuts
- [x] Formatting actions: Bold, Italic, Underline
- [x] Auto-dismiss and smart positioning

#### 4.6 Customization
- [ ] Custom colors for fallacy annotations
- [ ] Custom colors for rhetoric annotations
- [ ] Custom colors for claim & evidence markup

### Phase 5: Sharing & Collaboration
Share debates with others.

#### 5.1 Document Sharing
- [x] Share via short URLs
- [x] View-only mode for shared documents
- [x] Import shared documents locally
- [ ] "My Shared Links" management UI

### Phase 6: Public Debate Library (Future)
Browsable library of published analyses. ⚠️ Introduces UGC with major security/moderation/legal obligations.

#### 6.1 Core Browsing
- [ ] Public feed/gallery of published debate analyses
- [ ] Search by title, topic, speaker, or annotation type
- [ ] Category/topic tagging and sorting

#### 6.2 Publishing & Attribution
- [ ] "Publish" action (distinct from private sharing)
- [ ] Author attribution and draft/published/unlisted status
- [ ] Edit or unpublish after publishing

#### 6.3 Security & Moderation ⚠️
- [ ] User authentication (prerequisite)
- [ ] Content moderation queue and admin review dashboard
- [ ] Automated screening (profanity, spam)
- [ ] Report/flag system and user banning
- [ ] DMCA takedown process
- [ ] **LEGAL:** Update Privacy Policy and ToS for UGC, public profiles, COPPA

#### 6.4 Infrastructure
- [ ] Evaluate database scalability (SQLite → PostgreSQL)
- [ ] Full-text search indexing
- [ ] Pagination, CDN caching for popular debates

### Phase 7: Platform Features
App-wide capabilities.

#### 7.1 Roadmap & Changelog
- [x] Public Trello roadmap
- [x] In-app changelog

#### 7.2 Internationalization
- [ ] Multi-language support
- [ ] Translate fallacy definitions
- [ ] RTL language support

#### 7.3 Analytics
- [x] Privacy-friendly analytics (Umami)
- [ ] Optional analytics opt-out
- [ ] Analytics dashboard

### Phase 8: Future Preparation
Groundwork for future features.

#### 8.1 Authentication
- [ ] User accounts (placeholder)
- [ ] Login/signup UI

#### 8.2 Feature Flags
- [ ] Runtime feature toggles
- [ ] Gradual feature rollout

### Phase 9: Testing & Quality
Ensure reliability and performance.

#### 9.1 Automated Testing
- [x] Unit tests
- [x] Component tests
- [ ] End-to-end tests (Playwright)

#### 9.2 Performance
- [ ] Lighthouse CI audits
- [ ] Bundle size optimization
- [ ] Large document benchmarks

---
