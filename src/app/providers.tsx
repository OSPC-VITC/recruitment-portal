"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AdminAuthProvider } from "@/lib/AdminAuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSettingsProvider } from "@/components/AppSettingsProvider";
import { LoadingProvider } from "@/components/LoadingProvider";
import { usePathname } from "next/navigation";

// Improved providers wrapper with error boundary
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Check if the current route is an admin route
  const isAdminRoute = pathname?.startsWith('/dashboard') || pathname === '/admin-login';
  
  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <LoadingProvider>
          <AuthProvider>
            {isAdminRoute ? (
              <AdminAuthProvider>
                {children}
              </AdminAuthProvider>
            ) : (
              children
            )}
          </AuthProvider>
          
          {/* Global toast notifications */}
          <Toaster position="top-center" richColors closeButton />
        </LoadingProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
} 