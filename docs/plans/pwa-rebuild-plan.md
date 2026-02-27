# Debate Dissector PWA Rebuild Plan

This plan outlines the process for recreating the Debate Dissector application as a Progressive Web App using React, TypeScript, Tailwind CSS, and Slate.js with local storage, while maintaining a path to future login capabilities.

---

## Progress Checklist

**Last Updated:** February 25, 2026

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
- [ ] Document version history - allow reverting to previous versions

### Phase 4: User Interface & Experience

#### 4.1 Main Application Views
- [x] Create home/dashboard view
- [x] Build debate list/browser component
- [x] Implement debate editor page
- [x] Create settings/preferences page
- [x] Add app version display (in settings or footer)
- [x] Refine title editor and hamburger menu positioning (moved to header)

#### 4.2 Annotation Statistics & Visualization
- [ ] Calculate text coverage percentage per fallacy/rhetoric type
- [ ] Create visual breakdown chart (pie/bar chart of annotation distribution)
- [ ] Show total annotated vs unannotated text percentage
- [ ] Display annotation stats in document summary or sidebar
- [ ] Add export/share capability for annotation reports

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

#### 4.5 About & Legal Pages
- [ ] Create About page with app description and mission
- [ ] Add support/donation links (Ko-fi, GitHub Sponsors, etc.)
- [ ] Add contact information or contact form
- [ ] Create Privacy Policy page
- [ ] Create Terms of Service page
- [ ] Add links to About/Legal pages from Settings or footer

#### 4.6 Roadmap & Changelog
- [ ] Create public roadmap page showing planned features
- [ ] Display feature status (planned, in progress, completed)
- [ ] Allow users to vote/request features (optional)
- [ ] Create changelog/release notes page
- [ ] Show "What's New" modal on first visit after update
- [ ] Version update notifications in app
- [ ] Link to roadmap from Settings or About page
- [ ] Auto-generate changelog from GitHub releases (optional)

#### 4.7 Trello API Integration
- [ ] Set up Trello API authentication (API key + token)
- [ ] Create script to parse pwa-rebuild-plan.md into tasks
- [ ] Sync plan items to Trello board cards
- [ ] Map checkbox status to Trello card lists (Todo/In Progress/Done)
- [ ] Add GitHub Action to auto-sync on plan changes
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
- [ ] Add error tracking and reporting
- [ ] Create analytics dashboard or reporting
- [ ] See [Umami Setup Guide](../guides/umami-setup.md) for deployment instructions

### Phase 6: Preparing for Future Features

#### 6.1 Authentication Hooks
- [ ] Create placeholder auth context
- [ ] Design user profile data structure
- [ ] Add auth state handling (without implementation)
- [ ] Prepare UI components for login/signup

#### 6.2 API Service Layer
- [ ] Design API service structure
- [ ] Create mock endpoints matching future backend
- [ ] Implement service interfaces for future remote operations
- [ ] Add synchronization preparation utilities

#### 6.3 Collaboration Foundations
- [ ] Define data structures for collaborative features
- [ ] Add document versioning capabilities
- [ ] Prepare for future real-time features
- [ ] Implement conflict resolution strategy

### Testing and Deployment

### Testing Strategy

#### Unit Tests
- [x] Set up Jest/Vitest testing framework
- [x] Test `storage.ts` service (CRUD operations, preferences)
- [x] Test `extractUsedAnnotations()` utility
- [x] Test document ID generation and validation
- [x] Test fallacy/rhetoric data structure integrity
- [x] Test version history utilities

#### Component Tests
- [ ] Set up React Testing Library
- [ ] Test `AnnotationPanel` (dropdowns, search filtering, hint dismissal)
- [ ] Test `FallacyPanel` (category expansion, selection, apply button)
- [ ] Test `RhetoricPanel` (category expansion, selection, apply button)
- [ ] Test `Header` (title editing, badge counts, menu actions)
- [ ] Test `EditorToolbar` (formatting buttons, clear functionality)
- [ ] Test `DocumentList` (selection, creation, deletion)
- [ ] Test `VersionHistoryPanel` (version listing, restore, delete)

#### E2E Tests
- [ ] Set up Playwright test framework
- [ ] Test document lifecycle: create → edit → save → reload → verify
- [ ] Test annotation workflow: select text → apply fallacy → verify marks → remove
- [ ] Test version history: edit → create version → restore → verify content
- [ ] Test offline functionality: go offline → edit → reconnect → verify persistence
- [ ] Test preferences persistence: change settings → reload → verify restored

#### Accessibility Tests
- [ ] Integrate axe-core for automated a11y testing
- [ ] Test keyboard navigation through all interactive elements
- [ ] Test screen reader compatibility (ARIA labels, announcements)
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Test focus management in modals and dialogs
- [ ] Verify all form inputs have proper labels

#### Performance Benchmarks
- [ ] Set up Lighthouse CI for automated performance audits
- [ ] Establish bundle size budget (<200KB gzipped)
- [ ] Benchmark Time to Interactive (<3s on 3G)
- [ ] Test large document performance (1000+ words, 50+ annotations)
- [ ] Benchmark IndexedDB operations (<100ms for typical operations)
- [ ] Monitor memory usage during extended editing sessions

#### Deployment Plan
- [x] Configure CI/CD pipeline (GitHub Actions)
- [x] Set up hosting on Vercel or Netlify (configs ready)
- [x] Configure CDN and caching headers

---
