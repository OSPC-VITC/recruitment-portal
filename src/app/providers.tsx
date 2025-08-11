"use client";

import React, { ReactNode, useMemo, useEffect } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSettingsProvider } from "@/components/AppSettingsProvider";
import { LoadingProvider } from "@/components/LoadingProvider";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import ChunkLoadingScript from "@/components/ChunkLoadingScript";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import { setupGlobalChunkErrorHandling, createRetryableImport } from "@/lib/chunkRetry";

// Lazy load the admin auth provider with retry mechanism
const AdminAuthProvider = dynamic(
  createRetryableImport(
    () => import('@/lib/AdminAuthContext').then(mod => ({ default: mod.AdminAuthProvider })),
    { maxRetries: 3, retryDelay: 1000 }
  ),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

// Improved providers wrapper with error boundary
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Setup global chunk error handling on mount with proper error handling
  useEffect(() => {
    try {
      setupGlobalChunkErrorHandling();
    } catch (error) {
      console.warn('Failed to setup global chunk error handling:', error);
    }
  }, []);

  // Check if the current route is an admin route
  const isAdminRoute = pathname?.startsWith('/dashboard') || pathname === '/admin-login';
  
  // Memoize the children based on route to prevent unnecessary rerenders
  const wrappedChildren = useMemo(() => {
    return isAdminRoute ? (
      <AdminAuthProvider>{children}</AdminAuthProvider>
    ) : (
      children
    );
  }, [isAdminRoute, children]);
  
  return (
    <ChunkErrorBoundary>
      <ChunkLoadingScript />
      <ThemeProvider>
        <AppSettingsProvider>
          <LoadingProvider>
            <AuthProvider>
              {wrappedChildren}
            </AuthProvider>

            {/* Global toast notifications */}
            <Toaster position="top-center" richColors closeButton />
          </LoadingProvider>
        </AppSettingsProvider>
      </ThemeProvider>
    </ChunkErrorBoundary>
  );
} 