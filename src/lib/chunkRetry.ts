"use client";

/**
 * Chunk loading retry utilities for handling webpack ChunkLoadError
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

/**
 * Retry a dynamic import with exponential backoff
 */
export async function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if this is a chunk loading error
      const isChunkError = isChunkLoadError(error as Error);
      
      if (!isChunkError || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      console.warn(`Chunk load failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      // Clear any cached chunks before retry
      await clearChunkCache();
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a chunk loading error
 */
export function isChunkLoadError(error: Error): boolean {
  return error.name === 'ChunkLoadError' ||
         error.message.includes('Loading chunk') ||
         error.message.includes('Loading CSS chunk') ||
         error.message.includes('ChunkLoadError') ||
         (error.stack?.includes('webpack') === true);
}

/**
 * Clear webpack chunk cache
 */
export async function clearChunkCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Clear service worker caches related to chunks
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const chunkCaches = cacheNames.filter(name => 
        name.includes('webpack') || 
        name.includes('chunk') || 
        name.includes('static')
      );
      
      await Promise.all(chunkCaches.map(name => caches.delete(name)));
    }

    // Clear any webpack module cache if available
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      const webpackRequire = (window as any).__webpack_require__;
      if (webpackRequire.cache) {
        // Clear the module cache
        Object.keys(webpackRequire.cache).forEach(key => {
          delete webpackRequire.cache[key];
        });
      }
    }
  } catch (error) {
    console.warn('Failed to clear chunk cache:', error);
  }
}

/**
 * Enhanced dynamic import with automatic retry
 */
export function createRetryableImport<T>(
  importFn: () => Promise<T>,
  options?: RetryOptions
) {
  return () => retryDynamicImport(importFn, options);
}

/**
 * Setup global chunk error handling
 */
export function setupGlobalChunkErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections that might be chunk errors
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      console.error('Unhandled chunk load error:', event.reason);
      
      // Prevent the error from being logged to console
      event.preventDefault();
      
      // Attempt to reload the page after a short delay
      setTimeout(() => {
        if (confirm('A loading error occurred. Would you like to reload the page?')) {
          window.location.reload();
        }
      }, 1000);
    }
  });

  // Handle script loading errors
  window.addEventListener('error', (event) => {
    const target = event.target as HTMLScriptElement;
    
    if (target && target.tagName === 'SCRIPT') {
      const src = target.src;
      
      // Check if this is a webpack chunk
      if (src && (src.includes('chunk') || src.includes('webpack'))) {
        console.error('Script loading error for chunk:', src);
        
        // Clear cache and retry loading the page
        clearChunkCache().then(() => {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      }
    }
  }, true);
}

/**
 * Preload critical chunks to prevent loading errors
 */
export async function preloadCriticalChunks(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get all script tags that look like webpack chunks
    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
    const chunkScripts = scripts.filter(script => 
      script.src.includes('chunk') || script.src.includes('webpack')
    );

    // Preload each chunk
    const preloadPromises = chunkScripts.map(script => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = script.src;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload chunk: ${script.src}`));
        
        document.head.appendChild(link);
        
        // Remove the link after a timeout to prevent memory leaks
        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          resolve();
        }, 5000);
      });
    });

    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.warn('Failed to preload chunks:', error);
  }
}
