import { ReportHandler } from 'web-vitals';

/**
 * Reports Core Web Vitals metrics
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift) - visual stability
 * - FID (First Input Delay) - interactivity
 * - FCP (First Contentful Paint) - perceived load speed
 * - LCP (Largest Contentful Paint) - load performance
 * - TTFB (Time to First Byte) - server response time
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Send Web Vitals to analytics (Umami)
 */
export const sendToAnalytics: ReportHandler = (metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
  }

  // Send to Umami if available
  if (typeof window !== 'undefined' && (window as Window & { umami?: { track: (name: string, data: Record<string, number>) => void } }).umami) {
    (window as Window & { umami?: { track: (name: string, data: Record<string, number>) => void } }).umami?.track('web_vitals', {
      [metric.name]: Math.round(metric.value),
    });
  }
};

export default reportWebVitals;
