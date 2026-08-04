/**
 * Performance Monitoring Utilities
 * 
 * Provides functions for tracking and optimizing application performance
 */

/**
 * Measure component render time
 */
export const measureRender = (componentName: string) => {
  if (process.env.NODE_ENV !== 'production') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Longer than 1 frame (60fps)
        console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms`);
      } else {
        console.log(`✅ ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  }
  
  return () => {};
};

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure API call performance
 */
export const measureAPICall = async <T>(
  name: string,
  apiCall: Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall;
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) {
      console.warn(`⚠️ API call "${name}" took ${duration.toFixed(0)}ms`);
    } else {
      console.log(`✅ API call "${name}" took ${duration.toFixed(0)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ API call "${name}" failed after ${duration.toFixed(0)}ms`, error);
    throw error;
  }
};

/**
 * Log Core Web Vitals
 */
export const logWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    
    console.log('📊 LCP (Largest Contentful Paint):', lastEntry);
  });
  
  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      console.log('📊 FID (First Input Delay):', entry.processingStart - entry.startTime, 'ms');
    });
  });
  
  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

/**
 * Prefetch next page
 */
export const prefetchPage = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Check if page is visible (for pausing animations/polling)
 */
export const usePageVisibility = () => {
  if (typeof document === 'undefined') return true;
  
  return !document.hidden;
};

/**
 * Report performance metrics to analytics
 */
export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log('📊 Web Vital:', metric);
    
    // Example: Send to Google Analytics
    // if (window.gtag) {
    //   window.gtag('event', metric.name, {
    //     value: Math.round(metric.value),
    //     event_label: metric.id,
    //     non_interaction: true,
    //   });
    // }
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (img: HTMLImageElement) => {
  const src = img.dataset.src;
  if (!src) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        image.src = src;
        image.classList.add('loaded');
        observer.unobserve(image);
      }
    });
  });

  observer.observe(img);
};

/**
 * Bundle size analysis helper
 */
export const logBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsFiles = resources.filter(r => r.name.endsWith('.js'));
    const cssFiles = resources.filter(r => r.name.endsWith('.css'));
    
    const totalJS = jsFiles.reduce((sum, file) => sum + (file.transferSize || 0), 0);
    const totalCSS = cssFiles.reduce((sum, file) => sum + (file.transferSize || 0), 0);
    
    console.log('📦 Bundle Sizes:');
    console.log(`  JS: ${(totalJS / 1024).toFixed(2)} KB`);
    console.log(`  CSS: ${(totalCSS / 1024).toFixed(2)} KB`);
    console.log(`  Total: ${((totalJS + totalCSS) / 1024).toFixed(2)} KB`);
  }
};

/**
 * Memory usage monitoring
 */
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log('💾 Memory Usage:');
    console.log(`  Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
  }
};

