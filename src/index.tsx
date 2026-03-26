import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals, { sendToAnalytics } from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Defer non-critical initialization to improve initial load time
requestIdleCallback(
  () => {
    // Register service worker after initial render
    serviceWorkerRegistration.register();

    // Report Core Web Vitals to analytics
    reportWebVitals(sendToAnalytics);

    // Load Umami analytics dynamically (non-blocking)
    const umamiUrl = process.env.REACT_APP_UMAMI_SCRIPT_URL;
    const umamiId = process.env.REACT_APP_UMAMI_WEBSITE_ID;
    if (umamiUrl && umamiId) {
      const script = document.createElement('script');
      script.src = umamiUrl;
      script.async = true;
      script.defer = true;
      script.dataset.websiteId = umamiId;
      document.head.appendChild(script);
    }
  },
  { timeout: 2000 }
);
