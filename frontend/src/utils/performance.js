/**
 * Performance monitoring utilities using Web Vitals
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

/**
 * Log performance metrics to console (development)
 * In production, this would send to analytics service
 */
function sendToAnalytics({ name, value, rating, delta, id }) {
  // Development: Log to console
  if (import.meta.env.DEV) {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} ${name}:`,
      `${Math.round(value)}ms`,
      `(${rating})`,
      `[Delta: ${Math.round(delta)}ms, ID: ${id}]`
    );
  }

  // Production: Send to analytics service
  // Example: Google Analytics, Sentry, DataDog, etc.
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', name, {
      value: Math.round(value),
      metric_id: id,
      metric_value: value,
      metric_delta: delta,
      metric_rating: rating,
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once when the app loads
 */
export function initPerformanceMonitoring() {
  // Largest Contentful Paint (LCP)
  // Measures loading performance
  // Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s
  onLCP(sendToAnalytics);

  // Interaction to Next Paint (INP)
  // Measures responsiveness (replaces FID)
  // Good: <200ms, Needs Improvement: 200ms-500ms, Poor: >500ms
  onINP(sendToAnalytics);

  // Cumulative Layout Shift (CLS)
  // Measures visual stability
  // Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25
  onCLS(sendToAnalytics);

  // First Contentful Paint (FCP)
  // Measures perceived load speed
  // Good: <1.8s, Needs Improvement: 1.8s-3s, Poor: >3s
  onFCP(sendToAnalytics);

  // Time to First Byte (TTFB)
  // Measures server response time
  // Good: <800ms, Needs Improvement: 800ms-1800ms, Poor: >1800ms
  onTTFB(sendToAnalytics);
}

/**
 * React component performance profiler
 * Wrap components with this to measure render performance
 */
export function measureComponentRender(id, phase, actualDuration, baseDuration) {
  if (import.meta.env.DEV) {
    // Only log slow renders (>16ms = 1 frame at 60fps)
    if (actualDuration > 16) {
      console.warn(`⚠️ Slow render: ${id}`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
      });
    }
  }
}

/**
 * Measure custom performance marks
 * Usage:
 *   performance.mark('task-load-start');
 *   // ... load tasks ...
 *   performance.mark('task-load-end');
 *   measurePerformance('task-load', 'task-load-start', 'task-load-end');
 */
export function measurePerformance(name, startMark, endMark) {
  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];

    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
    }

    // Clean up marks and measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);

    return measure.duration;
  } catch (error) {
    console.error('Performance measurement error:', error);
    return null;
  }
}

/**
 * Get current performance metrics
 * Useful for debugging or displaying in dev tools
 */
export function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,

    // Paint timing
    firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find((entry) => entry.name === 'first-contentful-paint')
      ?.startTime,

    // Memory (if available)
    memory: performance.memory
      ? {
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        }
      : null,
  };
}

/**
 * Log all performance metrics (for debugging)
 */
export function logPerformanceMetrics() {
  if (import.meta.env.DEV) {
    console.group('📊 Performance Metrics');
    console.table(getPerformanceMetrics());
    console.groupEnd();
  }
}
