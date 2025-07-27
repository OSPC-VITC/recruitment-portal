"use client";

import React from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { AdminAuthProvider } from "@/lib/AdminAuthContext";
import AdminAuthCheck from "@/components/admin/AdminAuthCheck";
import { ThemeProvider } from "@/components/ThemeProvider";
import dynamic from 'next/dynamic';

// Dynamically import ParticlesBackground with no SSR
const ParticlesBackground = dynamic(() => import("@/components/ParticlesBackground"), { ssr: false });

// Admin layout wrapper component
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthCheck>
      <div className="min-h-screen flex flex-col bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
        {/* Global particle background */}
        <div className="fixed inset-0 z-0 pointer-events-auto">
          <ParticlesBackground />
        </div>
        
        {/* Admin navbar with glass effect */}
        <div className="relative z-50">
          <AdminNavbar />
        </div>
        
        {/* Add padding to account for fixed navbar */}
        <div className="pt-16 md:pt-20"></div>
        
        {/* Main content with glass effect */}
        <main className="flex-1 container mx-auto py-4 md:py-8 px-3 md:px-6 max-w-7xl relative z-10">
          <div className="mb-4 md:mb-8 p-4 rounded-lg bg-white/20 dark:bg-gray-900/20 backdrop-blur-[2px] border-2 border-white/20 dark:border-gray-700/30 shadow-lg">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 md:mt-2">Manage applications and questions for the OSPC recruitment portal</p>
          </div>
          
          <div className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-[2px] rounded-lg border-2 border-white/20 dark:border-gray-700/30 shadow-lg p-4 md:p-6">
            {children}
          </div>
        </main>
        
        {/* Footer with glass effect */}
        <footer className="border-t-2 border-white/20 dark:border-gray-700/30 py-3 md:py-4 bg-white/20 dark:bg-gray-950/20 backdrop-blur-[2px] relative z-10 transition-colors duration-200">
          <div className="container mx-auto px-4 md:px-6 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
            <p>OSPC Admin Panel &copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </AdminAuthCheck>
  );
}

// Main layout
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminAuthProvider>
    </ThemeProvider>
  );
} 