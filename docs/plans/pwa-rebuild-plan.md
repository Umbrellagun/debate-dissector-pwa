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
- [ ] Define TypeScript interfaces for Rhetoric argument categories and types

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
- [ ] Add app version display (in settings or footer)
- [x] Refine title editor and hamburger menu positioning (moved to header)

#### 4.2 Navigation and State Management
- [x] Set up React Router for navigation
- [x] Implement global state management (Context API)
- [x] Create navigation components
- [x] Design state persistence strategy

#### 4.3 Responsive Design
- [ ] Ensure mobile-friendly layout
- [ ] Implement touch interactions for mobile devices
- [ ] Optimize editor experience for different screen sizes
- [ ] Test and refine across device types

### Phase 5: PWA Features

#### 5.1 Offline Capabilities
- [x] Configure service workers (basic Workbox setup)
- [ ] Implement asset caching strategy
- [ ] Ensure offline access to saved debates
- [ ] Add offline indication and synchronization status

#### 5.2 Installation Experience
- [ ] Create app manifest
- [ ] Design splash screen and icons
- [ ] Implement "Add to Home Screen" prompt
- [ ] Test installation flow on various devices

#### 5.3 Performance Optimization
- [ ] Implement code splitting
- [ ] Optimize asset loading
- [ ] Add performance monitoring
- [ ] Ensure fast startup and interaction times

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

#### Testing Strategy
- [ ] Unit tests for core utilities and services
- [ ] Component tests for UI elements
- [ ] Integration tests for key workflows
- [ ] Accessibility testing
- [ ] Performance benchmarks

#### Deployment Plan
- [ ] Configure CI/CD pipeline
- [ ] Set up hosting on Vercel or Netlify
- [ ] Configure CDN and caching
- [ ] Implement analytics

---

## Target Project Structure

```
src/
├── components/
│   ├── core/          # Base UI components
│   ├── layout/        # Layout components
│   ├── editor/        # Slate.js editor components
│   └── fallacies/     # Fallacy-related components
├── hooks/             # Custom React hooks
├── context/           # React context providers
├── models/            # TypeScript interfaces and types
├── services/
│   ├── storage/       # Local storage service
│   └── fallacies/     # Fallacy data service
├── utils/             # Utility functions
└── pages/             # Main application pages
```

---

## Initial Development Focus (Sprint 1)

For the first development sprint, we should focus on:
1. Project setup and core architecture
2. Basic Slate.js editor implementation
3. Local storage service
4. Fallacy reference data model and UI

This will establish the foundation while validating our approach with the most critical technical aspects.
