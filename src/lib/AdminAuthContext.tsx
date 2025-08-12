"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AdminRole, AdminUser, DepartmentId, verifyAdminCredentials } from "./adminConfig";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminAuthContextValue {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isCoreTeam: boolean;
  isDeptLead: boolean;
  department?: DepartmentId;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  adminUser: null,
  isAuthenticated: false,
  isCoreTeam: false,
  isDeptLead: false,
  department: undefined,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

// Local storage key for admin session
const ADMIN_SESSION_KEY = 'admin_session';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Initialize from localStorage on component mount
  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        if (typeof window === 'undefined') return;

        const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
        if (storedSession) {
          const session = JSON.parse(storedSession);
          
          // Check if session is expired (24 hours)
          const now = new Date().getTime();
          const sessionTime = session.timestamp || 0;
          const sessionAge = now - sessionTime;
          const sessionLimit = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge > sessionLimit) {
            // Session expired
            localStorage.removeItem(ADMIN_SESSION_KEY);
            setAdminUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
          
          // Valid session
          setAdminUser(session.adminUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error initializing from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeFromStorage();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const admin = verifyAdminCredentials(email, password);
      
      if (admin) {
        // Store admin session in localStorage
        const session = {
          adminUser: admin,
          timestamp: new Date().getTime()
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        }
        
        setAdminUser(admin);
        setIsAuthenticated(true);
        
        toast.success(`Welcome, ${admin.name}!`, { id: "admin-login-success" });
        return true;
      } else {
        // Don't show toast here, let the component handle it
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      // Don't show toast here, let the component handle it
      return false;
    }
  };

  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setAdminUser(null);
    setIsAuthenticated(false);
    toast.success("You have been logged out successfully", { id: "admin-logout" });
    // Wait for state to update before redirecting
    setTimeout(() => {
      router.replace('/admin-login');
    }, 100);
  };

  // Derived state
  const isCoreTeam = adminUser?.role === 'core_team';
  const isDeptLead = adminUser?.role === 'dept_lead';
  const department = adminUser?.department;

  // Debug logging for department assignment (temporary)
  if (process.env.NODE_ENV === 'development' && adminUser) {
    console.log('🔍 AdminAuth Debug:', {
      email: adminUser.email,
      role: adminUser.role,
      department: adminUser.department,
      isCoreTeam,
      isDeptLead,
      departmentExists: !!adminUser.department
    });
  }

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      adminUser,
      isAuthenticated,
      isCoreTeam,
      isDeptLead,
      department,
      loading,
      login,
      logout,
    }),
    [adminUser, isAuthenticated, isCoreTeam, isDeptLead, department, loading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
} 