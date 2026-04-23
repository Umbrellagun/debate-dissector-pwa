# Debate Dissector PWA Rebuild Plan

This plan outlines the process for recreating the Debate Dissector application as a Progressive Web App using React, TypeScript, Tailwind CSS, and Slate.js with local storage, while maintaining a path to future login capabilities.

---

## Progress Checklist

**Last Updated:** April 2, 2026

### Phase 1: Project Setup and Architecture

#### 1.1 Project Initialization
- [x] Set up React project with Create React App
- [x] Configure TypeScript
- [x] Install and configure Tailwind CSS
- [x] Set up PWA configuration with service workers (Workbox)
- [x] Configure ESLint and Prettier for code consistency
- [x] Initialize Git repository

#### 1.2 Project Structure
- [x] Create `components/` directory structure
- [x] Create `hooks/` directory
- [x] Create `context/` directory
- [x] Create `models/` directory
- [x] Create `services/` directory
- [x] Create `utils/` directory
- [x] Create `pages/` directory

#### 1.3 Design System Setup
- [x] Configure Tailwind CSS theme to match branding
- [x] Create design tokens for colors, typography, spacing
- [x] Build core UI components (buttons, cards, dropdowns)
- [x] Create responsive layout components

### Phase 2: Core Functionality

#### 2.1 Data Model Design
- [x] Define TypeScript interfaces for Debate documents
- [x] Define TypeScript interfaces for Text blocks/paragraphs
- [x] Define TypeScript interfaces for Annotations/markups
- [x] Define TypeScript interfaces for Fallacy categories and types
- [x] Define TypeScript interfaces for User preferences
- [x] Define TypeScript interfaces for Rhetoric argument categories and types

#### 2.2 Local Storage Implementation
- [x] Create storage service for saving/loading debates
- [x] Implement IndexedDB for efficient local storage
- [x] Design storage schema with future remote sync in mind
- [x] Add auto-save functionality

#### 2.3 Fallacy Reference System
- [x] Import original fallacy categories and definitions
- [x] Create organized fallacy browser component
- [x] Build fallacy detail view component
- [x] Implement search/filter functionality

### Phase 3: Editor Implementation

#### 3.1 Slate.js Editor Setup
- [x] Install Slate.js dependencies
- [x] Configure basic Slate.js editor
- [x] Create custom editor hooks and utilities
- [x] Implement basic text formatting capabilities
- [x] Add paragraph and block-level formatting

#### 3.2 Annotation System
- [x] Implement text selection and highlighting
- [x] Create annotation data model
- [x] Build fallacy annotation UI component
- [x] Develop annotation sidebar/popup interface

#### 3.3 Advanced Editor Features
- [x] Add custom rendering for annotated text
- [x] Create color-coding system for different fallacy types
- [x] Implement overlapping annotations handling
- [x] Add annotation filtering and navigation
- [x] Add ability to clear/remove formatting and annotations from text
- [x] Implement rhetoric argument labeling (in addition to fallacies)
- [x] Pinned annotation shortcuts (bookmark fallacies/rhetoric for quick toolbar access)
- [ ] Document version history - allow reverting to previous versions

#### 3.4 Speaker/Participant Formatting
- [x] Define speaker data model (name, color, optional avatar/icon)
- [x] Add speaker assignment toolbar button or context menu
- [x] Create visual indicators for speaker turns (color bars, backgrounds, or borders)
- [x] Implement alternating speaker detection (auto-suggest based on paragraph breaks)
- [x] Add speaker legend/key in document header or sidebar
- [x] Support custom speaker colors and labels
- [x] Create speaker management UI (add, edit, remove speakers)
- [x] Persist speaker assignments with document
- [x] Add speaker filtering (show/hide specific speakers)
- [ ] Export with speaker formatting preserved (HTML/PDF)

#### 3.5 Argument Map View
**Design doc:** [argument-map-tree-design.md](argument-map-tree-design.md)

##### 3.5.1 Timeline View (Complete)
- [x] Build "Argument Map" alternative view mode (view switcher in title bar)
- [x] Extract all marked-up text (fallacies, rhetoric, structural) as blocks
- [x] Display blocks in linear document order with type-appropriate colors
- [x] Show speaker badges on blocks
- [x] Summary statistics bar (passage counts by markup category)
- [x] Manual block linking with connect button and SVG arrows
- [x] Speaker-colored connector arrows

##### 3.5.2 Data Model — Link Types & Thesis Roots
- [ ] Add `linkType` field to `ArgumentLink` (`supports | rebuts | ignores | unspecified`)
- [ ] Add `thesisMarkIds` field to `DebateDocument`
- [ ] Migrate existing links to `linkType: 'unspecified'`
- [ ] Add link type selection popover after creating a link
- [ ] Add cycle detection to prevent circular links
- [ ] Add "Mark as thesis" action on block context menu
- [ ] Batch categorization modal for uncategorized links

##### 3.5.3 Tree View
- [ ] Build graph traversal utilities (find roots, find children, detect shared nodes)
- [ ] Create `ArgumentTreeView` component with recursive node rendering
- [ ] Implement staging area panel for unattached blocks (collapsible, top of view)
- [ ] Pro/Con column layout based on link types
- [ ] Shared node ghost cards with cross-reference navigation
- [ ] Collapse/expand per tree node
- [ ] Drill-down navigation with breadcrumbs for deep trees
- [ ] Wire into view switcher as sub-tab within Map view

##### 3.5.4 Sunburst View
- [ ] Build radial layout algorithm (arc positions, ring sizes based on descendant count)
- [ ] Create `ArgumentSunburstView` component using SVG
- [ ] Hover tooltips with block text preview, speaker, and markup tags
- [ ] Click-to-drill-down with breadcrumbs
- [ ] Multi-root center layout (divided center circle)
- [ ] Shared-child chord connectors across arcs
- [ ] Unattached block dots on outer ring
- [ ] Color mode toggle (speaker / link type / markup type)
- [ ] Wire into view switcher as sub-tab within Map view

##### 3.5.5 Map View Polish
- [ ] Drag-and-drop from staging area to tree nodes
- [ ] Smooth animations for tree expand/collapse and sunburst drill-down
- [ ] Keyboard navigation for tree view
- [ ] Responsive layout for mobile (tree collapses to single-column, sunburst view-only)
- [ ] Filter/group blocks by markup type or speaker
- [ ] Export argument map as image or structured data
- [ ] Zoom/pan navigation for large documents

#### 3.6 Claim & Evidence Markup
- [x] Define structural markup data model (id, text range, type, metadata)
- [x] Implement markup types:
  - [x] **Claim** - A statement or assertion being made
  - [x] **Evidence** - Supporting data, facts, or citations provided
  - [x] **Source Needed** - Flag for claims lacking supporting evidence
  - [x] **Unsupported Assertion** - Opinion stated as fact without backing
  - [x] **Statistic** - Numerical data that should be verifiable
  - [x] **Quote** - Direct quotation from a source
  - [x] **Anecdote** - Personal story used as evidence
- [x] Create markup toolbar/panel UI for applying structural tags
- [x] Add visual indicators for each markup type (icons, colors, underlines)
- [x] Implement "Source Needed" counter/summary
- [ ] Build evidence linking (connect evidence to the claim it supports)
- [x] Add source citation input (URL, author, date, publication)
- [x] Create verification status indicators (verified, disputed, unverified)
- [ ] Generate "Evidence Report" summary of claims and their support
- [ ] Integrate with Argument Mapping for claim-rebuttal connections
- [x] Add keyboard shortcuts for quick markup application

#### 3.7 Comments System
- [x] Design comment data model (linked to text ranges, author, timestamp)
- [x] Implement text selection for adding comments
- [x] Create comment annotation marks in Slate editor
- [x] Build comment sidebar/panel UI to display all comments
- [x] Add inline comment indicators (highlight or icon)
- [x] Implement comment threading (replies to comments)
- [x] Add comment resolution/dismissal functionality
- [x] Support comment editing and deletion
- [x] Unify reply comment options with parent comments (edit, resolve, reply, delete)
- [x] Resolved comments shown dimmed (not hidden) to differentiate from delete
- [x] Resolved comments no longer highlight text in editor
- [x] Add close buttons to Stats and Comments sidebars
- [ ] **LEGAL:** If comments include user identity, update Privacy Policy

### Phase 4: User Interface & Experience

#### 4.1 Main Application Views
- [x] Create home/dashboard view
- [x] Build debate list/browser component
- [x] Implement debate editor page
- [x] Create settings/preferences page
- [x] Add app version display (in settings or footer)
- [x] Refine title editor and hamburger menu positioning (moved to header)

#### 4.1.1 User Customization
- [x] Add color picker for fallacy annotations (per-fallacy or per-category)
- [x] Add color picker for rhetoric annotations (per-technique or per-category)
- [x] Add color picker for claim & evidence markup types
- [x] Add color picker for speaker default colors
- [x] Persist custom colors in user preferences
- [x] Add "Reset to defaults" option for colors

#### 4.2 Annotation Statistics & Visualization
- [x] Calculate text coverage percentage per fallacy/rhetoric type
- [x] Create visual breakdown chart (pie/bar chart of annotation distribution)
- [x] Show total annotated vs unannotated text percentage
- [x] Display annotation stats in document summary or sidebar
- [x] Add export/share capability for annotation reports

#### 4.2.1 Annotation Visibility Controls
- [x] Toggle visibility of individual fallacy annotations in the editor
- [x] Toggle visibility of individual rhetoric annotations in the editor
- [x] Toggle visibility of individual claim & evidence markup types
- [x] Bulk show/hide all fallacies at once
- [x] Bulk show/hide all rhetoric at once
- [x] Bulk show/hide all claims & evidence at once
- [x] Bulk show/hide by subcategory (e.g., all "Red Herring Fallacies", all "Ethos" rhetoric)
- [x] Persist visibility preferences per document or globally

#### 4.3 Navigation and State Management
- [x] Set up React Router for navigation
- [x] Implement global state management (Context API)
- [x] Create navigation components
- [x] Design state persistence strategy

#### 4.4 Responsive Design
- [x] Ensure mobile-friendly layout
- [x] Implement touch interactions for mobile devices
- [x] Optimize editor experience for different screen sizes
- [ ] Test and refine across device types

#### 4.4.1 Floating Selection Toolbar
- [x] Show floating action bar near text selection (desktop + mobile)
- [x] Include quick actions: Add Comment, pinned annotation shortcuts
- [x] Include formatting actions: Bold, Italic, Underline
- [x] Auto-dismiss when selection is cleared
- [x] Position above/below selection based on available space
- [x] Works alongside native OS context menus (not replacing them)

#### 4.5 About & Legal Pages
- [x] Create About page with app description and mission (in Settings)
- [x] Add support/donation links (Patreon, Venmo)
- [x] Add contact information (obfuscated email copy button)
- [x] Create Privacy Policy page
- [x] Create Terms of Service page
- [x] Add links to About/Legal pages from Settings or footer

#### 4.6 Roadmap & Changelog
- [x] Create public roadmap link (Trello board)
- [x] Create changelog/release notes page
- [x] Add "What's New" section in About page
- [ ] Show "What's New" modal on first visit after update
- [ ] Version update notifications in app
- [x] Link to roadmap from Settings/About page
- [ ] Auto-generate changelog from GitHub releases (optional)

#### 4.7 Trello API Integration
- [x] Set up Trello API authentication (API key + token)
- [x] Create script to parse pwa-rebuild-plan.md into tasks
- [x] Sync plan items to Trello board cards
- [x] Map checkbox status to Trello card lists (Todo/In Progress/Done)
- [x] Add GitHub Action to auto-sync on plan changes
- [ ] Optional: Two-way sync via Trello webhooks

#### 4.8 Internationalization (i18n)
- [ ] Set up i18n framework (react-i18next or similar)
- [ ] Extract all UI strings to translation files
- [ ] Create English (en) base translation file
- [ ] Add language selector in Settings
- [ ] Translate fallacy names and descriptions
- [ ] Translate rhetoric technique names and descriptions
- [ ] Add Spanish (es) translation
- [ ] Add French (fr) translation
- [ ] Add additional languages as needed
- [ ] Persist language preference in user settings
- [ ] Support RTL languages (Arabic, Hebrew) if needed

### Phase 5: PWA Features

#### 5.1 Offline Capabilities
- [x] Configure service workers (basic Workbox setup)
- [x] Implement asset caching strategy
- [x] Ensure offline access to saved debates
- [x] Add offline indication and synchronization status

#### 5.2 Installation Experience
- [x] Create app manifest
- [x] Design splash screen and icons
- [x] Implement "Add to Home Screen" prompt
- [ ] Test installation flow on various devices

#### 5.3 Performance Optimization
- [x] Implement code splitting (React.lazy + Suspense for routes)
- [x] Optimize asset loading (Tailwind CSS purging, lazy components)
- [x] Add performance monitoring (Web Vitals: CLS, FID, FCP, LCP, TTFB)
- [x] Ensure fast startup and interaction times (loading spinner fallback)

#### 5.4 Analytics
- [x] Set up privacy-friendly analytics (Umami self-hosted)
- [x] Create useAnalytics hook with typed events
- [x] Track feature usage (documents created/deleted)
- [x] Monitor PWA installation events
- [x] Add error tracking and reporting (ErrorBoundary component)
- [ ] Create analytics dashboard or reporting
- [x] Review cookie/analytics consent requirements for Umami (not required - Umami is GDPR-compliant)
- [ ] Add optional "Disable Analytics" toggle in Settings (user preference, not legally required)
- [ ] See [Umami Setup Guide](../guides/umami-setup.md) for deployment instructions

### Phase 6: Preparing for Future Features

#### 6.1 Authentication Hooks
- [ ] Create placeholder auth context
- [ ] Design user profile data structure
- [ ] Add auth state handling (without implementation)
- [ ] Prepare UI components for login/signup
- [ ] **LEGAL:** Update Privacy Policy (user data collection, email storage, account data)
- [ ] **LEGAL:** Update ToS (account terms, user responsibilities, ToS agreement checkbox on signup)

#### 6.2 API Service Layer
- [ ] Design API service structure
- [ ] Create mock endpoints matching future backend
- [ ] Implement service interfaces for future remote operations
- [ ] Add synchronization preparation utilities

#### 6.3 Feature Flags (PocketBase)
Runtime feature toggles using PocketBase settings collection.

##### Backend Setup
- [ ] Create `app_settings` collection with single record
- [ ] **LEGAL:** If maintenance_mode flag used, update ToS (service availability disclaimers)
- [ ] Add `features` JSON field for flag configuration
- [ ] Set API rules (public read, admin-only write)

##### Frontend Integration
- [ ] Create feature flags service (`src/services/features.ts`)
- [ ] Add FeatureFlagsProvider context
- [ ] Implement `useFeatureFlag()` hook
- [ ] Cache flags with localStorage fallback
- [ ] Add flag checks to sharing features (for gradual rollout)

##### Example Flags
- `sharing_enabled` - Toggle sharing feature
- `maintenance_mode` - Show maintenance banner
- `max_share_size_kb` - Configurable limits

### Phase 7: Backend Integration (PocketBase)

#### 7.1 Sharing Features
Share debates via short URLs using PocketBase (self-hosted) with Fly.io hosting and Cloudflare protection.

**Stack**: PocketBase (Go binary + SQLite) → Fly.io (hosting) → Cloudflare (DDoS/CDN)

**Repos**:
- `debate-dissector-pwa` - React PWA (this repo)
- `debate-dissector-api` - PocketBase backend (separate repo)

##### Infrastructure Setup
- [x] Set up PocketBase project with shared_debates collection
- [x] Deploy PocketBase to Fly.io (free tier)
- [ ] Configure Cloudflare DNS and DDoS protection
- [ ] **LEGAL:** Add Cloudflare to Privacy Policy (DDoS protection, CDN, request metadata processing)
- [x] Set up environment variables for API URL
- [x] Configure CORS for PWA domain (PocketBase default allows all)

##### Database Schema (shared_debates collection)
- [x] id (auto-generated, 15 chars)
- [x] content (JSON - document data)
- [x] title (string)
- [x] authorName (string, optional)
- [x] expiresAt (datetime, nullable)
- [x] passwordHash (string, nullable)
- [x] reportCount (number) - for moderation
- [x] isBlocked (bool) - admin content blocking

##### Frontend Integration
- [x] Create PocketBase SDK service (`src/services/sharing/index.ts`)
- [x] Add "Share" button to editor toolbar
- [x] Create share modal UI with options (expiration, password)
- [x] Implement copy-to-clipboard for share links
- [x] Add `/s/:id` route for viewing shared documents
- [x] Implement "View Only" mode (read-only editor)
- [x] Add "Import as Copy" button to save locally
- [ ] Create "My Shared Links" management UI in Settings

### Phase 8: Testing & Deployment

#### 8.1 Testing Strategy

##### Unit Tests
- [x] Set up Jest/Vitest testing framework
- [x] Test `storage.ts` service (CRUD operations, preferences)
- [x] Test `extractUsedAnnotations()` utility
- [x] Test document ID generation and validation
- [x] Test fallacy/rhetoric data structure integrity
- [x] Test version history utilities

##### Component Tests
- [x] Set up React Testing Library
- [x] Test `AnnotationPanel` (dropdowns, search filtering, hint dismissal)
- [x] Test `FallacyPanel` (category expansion, selection, apply button)
- [x] Test `RhetoricPanel` (category expansion, selection, apply button)
- [x] Test `Header` (title editing, badge counts, menu actions)
- [x] Test `EditorToolbar` (formatting buttons, clear functionality)
- [x] Test `DebateList` (selection, creation, deletion)
- [x] Test `VersionHistoryPanel` (version listing, restore, delete)

##### E2E Tests
- [ ] Set up Playwright test framework
- [ ] Test document lifecycle: create → edit → save → reload → verify
- [ ] Test annotation workflow: select text → apply fallacy → verify marks → remove
- [ ] Test version history: edit → create version → restore → verify content
- [ ] Test offline functionality: go offline → edit → reconnect → verify persistence
- [ ] Test preferences persistence: change settings → reload → verify restored

##### Accessibility Tests
- [x] Integrate jest-axe for automated a11y testing
- [x] Test keyboard navigation through all interactive elements
- [x] Test screen reader compatibility (ARIA labels, announcements)
- [x] Verify color contrast meets WCAG AA standards
- [x] Test focus management in modals and dialogs
- [x] Verify all form inputs have proper labels
- [ ] Manual accessibility testing with actual screen readers (NVDA, VoiceOver)
- [ ] Manual testing by users with disabilities or accessibility specialists

##### Performance Benchmarks
- [x] Set up Lighthouse CI for automated performance audits
- [x] Establish bundle size budget (<300KB gzipped)
- [x] Benchmark Time to Interactive (<3s on 3G)
- [x] Test large document performance (1000+ words, 50+ annotations)
- [x] Benchmark IndexedDB operations (<100ms for typical operations)
- [ ] Monitor memory usage during extended editing sessions
- [ ] Analyze largest JS chunks (main 82KB, 303 chunk 53KB, 158 chunk 37KB) for optimization opportunities
- [ ] Explore code-splitting / lazy-loading for panels and pages
- [ ] Check for heavy/unused imports that inflate bundle size

##### Test Automation
- [x] Add test scripts to package.json (`test:ci`, `test:unit`, `test:components`, `test:coverage`)
- [ ] Configure GitHub Actions to run tests on PR/push
- [ ] Add test coverage reporting to CI
- [ ] Set up test failure notifications

#### 8.2 Deployment
- [x] Configure CI/CD pipeline (GitHub Actions)
- [x] Set up hosting on Vercel or Netlify (configs ready)
- [x] Configure CDN and caching headers

### Phase 9: Public Debate Library (Future)
A browsable library of published debate analyses. **Note:** This introduces social/UGC features with significant security, moderation, and legal obligations.

#### 9.0 Prerequisites
- [ ] User authentication system (Phase 6.1) must be complete
- [ ] Feature flags system (Phase 6.3) must be complete
- [ ] Content moderation tooling (Phase 9.5) should be mature

#### 9.1 Core Browsing Experience
- [ ] Public feed/gallery of published debate analyses
- [ ] Search by title, topic, speaker, or annotation type
- [ ] Category/topic tagging system for debates
- [ ] Sort by: newest, most viewed, most annotated
- [ ] Preview cards showing title, excerpt, annotation counts, author
- [ ] Read-only view of published debates (reuse existing shared view)

#### 9.2 Publishing Workflow
- [ ] "Publish" action from editor (distinct from private sharing)
- [ ] Author attribution (display name, optional profile link)
- [ ] Draft/published/unlisted status for published debates
- [ ] Edit or unpublish after publishing
- [ ] Versioning for published debates (readers see latest, author can update)

#### 9.3 Community & Interaction
- [ ] View count tracking per published debate
- [ ] "Import as Copy" to analyze locally (already exists for shared docs)
- [ ] Optional: upvote/bookmark published debates
- [ ] Optional: comment on published debates (distinct from inline annotations)
- [ ] **LEGAL:** UGC Terms of Service update (content ownership, license, liability)

#### 9.4 Security & Moderation Obligations
⚠️ **Adding public UGC creates significant ongoing obligations:**
- [ ] **Content moderation queue** — review reported/flagged content before it goes viral
- [ ] **Automated content screening** — profanity filter, spam detection at minimum
- [ ] **Report/flag system** — users can report inappropriate published debates
- [ ] **Admin review dashboard** — approve, reject, block content and users
- [ ] **User banning/suspension** — ability to ban repeat offenders
- [ ] **Rate limiting** — prevent spam publishing (e.g., max 5 publishes/day)
- [ ] **DMCA takedown process** — legal requirement for UGC platforms in the US
- [ ] **Abuse prevention** — bot detection, CAPTCHA on publish
- [ ] **Data retention policy** — how long blocked/deleted content is retained
- [ ] **LEGAL:** Update Privacy Policy (public profiles, UGC data, third-party visibility)
- [ ] **LEGAL:** Update ToS (content moderation policy, acceptable use, DMCA, content license)
- [ ] **LEGAL:** Consider COPPA compliance if minors may use the platform

#### 9.5 Infrastructure Considerations
- [ ] Evaluate database scalability (SQLite → PostgreSQL if needed at scale)
- [ ] CDN caching for popular published debates
- [ ] Pagination and infinite scroll for browse feed
- [ ] Search indexing (full-text search on debate content)
- [ ] Separate API endpoints for public vs. private content
- [ ] Monitoring and alerting for moderation queue backlog

### Phase 10: SEO & Security

#### 10.1 Anti-Scraping & AI Bot Protection
- [x] Update robots.txt to block AI crawlers (GPTBot, CCBot, Claude, etc.)
- [x] Add `<meta name="robots" content="noai, noimageai">` tag
- [x] Add X-Robots-Tag header to API responses (main.go middleware)
- [ ] Configure Cloudflare Bot Fight Mode
- [ ] Set up Cloudflare WAF rules for AI user-agents

#### 10.2 SEO Optimization
- [x] Add Open Graph meta tags for social sharing
- [x] Add Twitter Card meta tags
- [x] Add structured data (JSON-LD WebApplication schema)
- [x] Create sitemap.xml
- [x] Add sitemap reference to robots.txt
- [x] Add canonical URL
- [x] Add keywords and author meta tags
- [x] Purchase debatedissector.com and add as alternate domain

#### 10.3 Standard Webapp Features
- [x] Add 404 Not Found page with catch-all route
- [x] Add ErrorBoundary for React crash handling
- [x] Create Privacy Policy page
- [x] Create Terms of Service page

#### 10.4 Backend Security & Rate Limiting
- [x] Configure PocketBase rate limiting (60 req/min per IP)
- [x] Set max request size (5MB)
- [x] Disable collection listing (require exact ID to fetch)
- [ ] Configure Cloudflare WAF rules
- [ ] Add CAPTCHA for share creation (optional)
- [ ] **LEGAL:** If CAPTCHA added, update Privacy Policy (third-party CAPTCHA service)

#### 10.5 Content Moderation
- [ ] Track share views via Umami analytics
- [ ] Add "Report" functionality for inappropriate content
- [ ] **LEGAL:** Update ToS (content moderation policy, report handling)
- [x] Create admin dashboard access via PocketBase UI

### Phase 11: Freemium Monetization

A freemium model where the core analysis experience remains free. Paid features target power users, teams, and professional use cases. **Design principle:** Self-education through manual interaction is a core goal of this app — AI should augment, not replace, critical thinking.

#### 11.1 Export Options (Pro)
Free tier: plain text export. Pro tier unlocks rich export formats.
- [ ] Export document as PDF with speaker colors and annotation highlights preserved
- [ ] Export document as annotated HTML
- [ ] Export argument map as PNG/SVG image
- [ ] Export argument map as structured data (JSON)
- [ ] Export annotation statistics report as PDF
- [ ] Add "Pro" badge/gate on export buttons for free users

#### 11.2 Custom Markup Types (Pro)
Allow paid users to define their own annotation categories beyond the built-in set.
- [ ] Design custom markup type data model (name, color, icon, category)
- [ ] Create UI for managing custom markup types in Settings
- [ ] Integrate custom types into annotation toolbar and editor rendering
- [ ] Persist custom types with user preferences
- [ ] Support importing/exporting custom type definitions
- [ ] **LEGAL:** Update ToS (user-created content, custom type ownership)

#### 11.3 Password-Protected Documents (Pro)
Extend existing sharing with stronger access controls.
- [ ] Password protection for shared documents (existing basic support in Phase 7.1)
- [ ] Configurable access permissions (view-only, can-comment, can-annotate)
- [ ] Expiration controls with longer durations for Pro users
- [ ] View analytics for shared documents (who viewed, when)
- [ ] Revoke access to previously shared links

#### 11.4 Team Workspaces (Pro)
Collaborative annotation for teams, classrooms, or organizations.
- [ ] Design team/workspace data model (members, roles, shared documents)
- [ ] Create team creation and invitation flow
- [ ] Implement shared document library within a workspace
- [ ] Add role-based permissions (owner, editor, viewer)
- [ ] Real-time or async collaborative annotation on shared documents
- [ ] Team activity feed (who annotated what, recent changes)
- [ ] Team-level annotation statistics and reports
- [ ] **LEGAL:** Update Privacy Policy (team data sharing, member visibility)
- [ ] **LEGAL:** Update ToS (team account terms, admin responsibilities)

#### 11.5 AI-Assisted Analysis (Enterprise / Ad-Hoc Only)
⚠️ **Not a standard product feature.** Offered on an ad-hoc basis for major business engagements only. Manual analysis is the intended user experience — AI should not undermine the educational value of learning to identify fallacies, rhetoric, and structural issues independently.
- [ ] LLM-powered fallacy detection (suggest annotations on selected text)
- [ ] Auto-generated debate summaries
- [ ] Claim verification suggestions (flag unsupported assertions)
- [ ] Available only via enterprise agreements, not self-serve
- [ ] Clear UI messaging that AI suggestions are starting points, not authoritative

#### 11.6 Billing & Account Infrastructure
- [ ] Choose payment provider (Stripe, Lemon Squeezy, etc.)
- [ ] Implement subscription management (monthly/annual plans)
- [ ] Create Pro upgrade UI and pricing page
- [ ] Add feature gating logic (check subscription status before Pro features)
- [ ] Free trial period for Pro features (e.g., 14 days)
- [ ] **LEGAL:** Update ToS (subscription terms, refund policy, auto-renewal)
- [ ] **LEGAL:** Update Privacy Policy (payment data handling, third-party payment processor)

### Phase 12: App Store Publishing

Publish the PWA to app stores using wrapper tooling. All packages can be prepared and tested locally for free — store fees are only required at submission time.

#### 12.1 Preparation
- [ ] Verify PWA passes Lighthouse PWA audit (manifest, service worker, HTTPS)
- [ ] Prepare store assets: app icon (512x512), screenshots, description, feature graphic
- [ ] Decide on app name, short description, and category for store listings

#### 12.2 Google Play Store (TWA)
Cost: $25 one-time developer account fee (paid at submission).
- [ ] Generate AAB package using PWABuilder or Bubblewrap (free)
- [ ] Test locally with Android emulator or device
- [ ] Create Google Play Developer account ($25)
- [ ] Submit app for review and publish
- [ ] Set up app signing with Play App Signing

#### 12.3 Microsoft Store
Cost: $19 one-time developer account fee (paid at submission).
- [ ] Generate MSIX package using PWABuilder (free)
- [ ] Test locally on Windows
- [ ] Create Microsoft Partner Center account ($19)
- [ ] Submit app for review and publish

#### 12.4 Apple App Store (Optional)
Cost: $99/year developer program (required for submission, not for local builds).
- [ ] Generate Xcode project using PWABuilder or Capacitor (free)
- [ ] Test locally with Xcode simulator (free Apple ID)
- [ ] Evaluate if additional native functionality is needed to pass Apple review
- [ ] Enroll in Apple Developer Program ($99/yr) when ready to submit
- [ ] Submit app for review and publish
- [ ] **LEGAL:** Review Apple's guidelines on PWA wrappers (risk of rejection for "thin" apps)

---
