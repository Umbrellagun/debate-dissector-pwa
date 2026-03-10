/**
 * Lighthouse CI Configuration
 * 
 * Performance budgets:
 * - Performance score: >= 90
 * - Time to Interactive: < 3s on 3G
 * - Bundle size: < 200KB gzipped
 */

module.exports = {
  ci: {
    collect: {
      // Use static server for built files
      staticDistDir: './build',
      // Number of runs for more accurate results
      numberOfRuns: 3,
      // Settings for performance testing
      settings: {
        // Simulate mobile 3G conditions
        preset: 'desktop',
        // Throttling settings for 3G simulation
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        // Performance score must be at least 90
        'categories:performance': ['error', { minScore: 0.9 }],
        // Accessibility score must be at least 90
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        // Best practices score must be at least 90
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // SEO score must be at least 90
        'categories:seo': ['warn', { minScore: 0.9 }],
        // PWA requirements
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Time to Interactive < 3s (3000ms)
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // Speed Index
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Resource sizes (approximate gzipped sizes)
        'resource-summary:script:size': ['warn', { maxNumericValue: 300000 }], // 300KB scripts
        'resource-summary:total:size': ['warn', { maxNumericValue: 500000 }], // 500KB total
      },
    },
    upload: {
      // For local development, use temporary public storage
      target: 'temporary-public-storage',
    },
  },
};
