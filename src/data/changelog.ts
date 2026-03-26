export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '1.7.0',
    date: 'March 25, 2026',
    title: 'Annotation Visibility Controls',
    changes: [
      'Toggle visibility of individual fallacy, rhetoric, and structural annotations in the editor',
      'Toggles eye icons for individual items, subcategory headers, and section headers',
      'Bulk show/hide all annotations per section (Fallacies, Rhetoric, Claims & Evidence)',
      'Bulk show/hide by subcategory (e.g., all Red Herring Fallacies, all Ethos rhetoric)',
      'Visibility state persisted per document',
    ],
  },
  {
    version: '1.6.0',
    date: 'March 25, 2026',
    title: 'Comments System & UX Improvements',
    changes: [
      'New comments system: add, edit, delete, resolve, and reply to comments on selected text',
      'Inline amber highlighting for commented text in the editor',
      'Resolved comments shown dimmed (not hidden) to distinguish from deletion',
      'Added close buttons to Stats and Comments sidebars',
    ],
  },
  {
    version: '1.5.0',
    date: 'March 23, 2026',
    title: 'Annotation Statistics & Speaker Insights',
    changes: [
      'New annotation statistics panel',
      'Per-speaker statistics showing text coverage, annotation counts, and detailed breakdowns',
      'Settings page reorganized and renamed to "Settings & Info"',
      'Added placeholder for upcoming markup & speaker color customization',
    ],
  },
  {
    version: '1.4.0',
    date: 'March 21, 2026',
    title: 'Claims and Evidence Feature',
    changes: [
      'Added new Claims & Evidence Feature.',
      'Source citation fields for evidence, statistics, and quotes (URL, author, date, publication), verification status indicators for sources (verified, disputed, unverified)',
      'Dark highlight text automatically switches to white for readability',
    ],
  },
  {
    version: '1.3.0',
    date: 'March 12, 2026',
    title: 'Speaker Feature & UX Improvements',
    changes: [
      'Added the ability to assign speakers to paragraphs',
      'Default speakers (A & B) auto-created for new documents',
      'Click outside sidebars to close them (all screen sizes)',
      'Updated pin icons throughout the app',
    ],
  },
  {
    version: '1.2.0',
    date: 'March 9, 2026',
    title: 'Pinned Annotation Shortcuts',
    changes: [
      'Pin your favorite fallacies and rhetoric for quick toolbar access',
      'Pinned annotations appear as shortcut buttons in the editor toolbar',
      'Mobile: sidebar auto-closes after applying pinned annotation',
    ],
  },
  {
    version: '1.1.0',
    date: 'March 7, 2026',
    title: 'Trello Integration & Dynamic Colors',
    changes: [
      'Added Trello board integration for tracking development progress',
      'Added public roadmap link to About page',
      'Added version history and changelog',
    ],
  },
  {
    version: '1.0.0',
    date: 'March 5, 2026',
    title: 'Initial Release',
    changes: [
      'Full-featured debate analysis editor with Slate.js',
      'Fallacy detection and annotation system',
      'Rhetoric technique identification',
      'Document sharing via PocketBase backend',
      'Offline-capable Progressive Web App',
      'Local storage with IndexedDB',
      'Version history for documents',
      'Privacy-focused analytics with Umami',
      'Accessibility improvements (ARIA, keyboard navigation)',
      'Mobile-responsive design',
    ],
  },
];

export const getLatestVersion = (): VersionEntry | undefined => CHANGELOG[0];

export const getVersionByNumber = (version: string): VersionEntry | undefined =>
  CHANGELOG.find(v => v.version === version);
