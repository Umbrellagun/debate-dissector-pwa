export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
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
