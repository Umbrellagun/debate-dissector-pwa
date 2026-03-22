export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
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
