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

    // Preload critical chunks
    preloadCriticalChunks().catch(error => {
      console.warn('Failed to preload critical chunks:', error);
    });

    // Add a global error handler for chunk loading
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      
      if (error && (
        error.name === 'ChunkLoadError' ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('ChunkLoadError')
      )) {
        console.error('Global chunk loading error detected:', error);
        
        // Show user-friendly error message
        const shouldReload = confirm(
          'A loading error occurred. The page needs to be reloaded to continue. Reload now?'
        );
        
        if (shouldReload) {
          // Clear any cached chunks before reload
          if ('caches' in window) {
            caches.keys().then(names => {
              const chunkCaches = names.filter(name => 
                name.includes('webpack') || 
                name.includes('chunk') || 
                name.includes('static')
              );
              return Promise.all(chunkCaches.map(name => caches.delete(name)));
            }).then(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
      }
    };

    // Add the error listener
    window.addEventListener('error', handleChunkError);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError);
    };
  }, []);

  return null; // This component doesn't render anything
}
