"use client";

import { useEffect } from 'react';
import { preloadCriticalChunks } from '@/lib/chunkRetry';

/**
 * Component to handle chunk loading initialization
 */
export default function ChunkLoadingScript() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let isComponentMounted = true;

    // Preload critical chunks with proper error handling
    const initializeChunkLoading = async () => {
      try {
        await preloadCriticalChunks();
      } catch (error) {
        console.warn('Failed to preload critical chunks:', error);
      }
    };

    // Add a global error handler for chunk loading
    const handleChunkError = (event: ErrorEvent) => {
      if (!isComponentMounted) return;

      const errorObj = event.error;

      if (errorObj && (
        errorObj.name === 'ChunkLoadError' ||
        errorObj.message?.includes('Loading chunk') ||
        errorObj.message?.includes('ChunkLoadError')
      )) {
        console.error('Global chunk loading error detected:', errorObj);

        // Show user-friendly error message
        const shouldReload = confirm(
          'A loading error occurred. The page needs to be reloaded to continue. Reload now?'
        );

        if (shouldReload) {
          // Clear any cached chunks before reload
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              const chunkCacheNames = cacheNames.filter(cacheName =>
                cacheName.includes('webpack') ||
                cacheName.includes('chunk') ||
                cacheName.includes('static')
              );
              return Promise.all(chunkCacheNames.map(cacheName => caches.delete(cacheName)));
            }).then(() => {
              window.location.reload();
            }).catch(() => {
              // Fallback if cache clearing fails
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
      }
    };

    // Initialize chunk loading
    initializeChunkLoading();

    // Add the error listener
    window.addEventListener('error', handleChunkError);

    // Cleanup
    return () => {
      isComponentMounted = false;
      window.removeEventListener('error', handleChunkError);
    };
  }, []);

  return null; // This component doesn't render anything
}
