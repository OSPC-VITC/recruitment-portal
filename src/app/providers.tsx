"use client";

import React, { ReactNode, useMemo } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSettingsProvider } from "@/components/AppSettingsProvider";
import { LoadingProvider } from "@/components/LoadingProvider";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';

// Lazy load the admin auth provider to reduce initial bundle size
const AdminAuthProvider = dynamic(
  () => import('@/lib/AdminAuthContext').then(mod => ({ default: mod.AdminAuthProvider })),
  { ssr: false }
);

// Improved providers wrapper with error boundary
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
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
  );
} 