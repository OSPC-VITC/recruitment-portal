"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/AdminAuthContext";

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requireCoreTeam?: boolean;
  requiredDepartment?: string;
}

export default function AdminAuthGuard({ 
  children, 
  requireCoreTeam = false,
  requiredDepartment
}: AdminAuthGuardProps) {
  const { isAuthenticated, loading, isCoreTeam, isDeptLead, department } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/admin-login');
    } else if (!loading && isAuthenticated) {
      // Check role-based permissions
      if (requireCoreTeam && !isCoreTeam) {
        // Redirect to dashboard if core team access is required but user is not core team
        router.push('/dashboard');
      }
      
      // Check department-based permissions
      if (requiredDepartment && !isCoreTeam) {
        if (!department || department !== requiredDepartment) {
          // Redirect to dashboard if user doesn't have access to this department
          router.push('/dashboard');
        }
      }
    }
  }, [loading, isAuthenticated, isCoreTeam, isDeptLead, department, router, requireCoreTeam, requiredDepartment]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full border-t-4 border-blue-600 animate-spin"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  // Show unauthorized message if doesn't have required role
  if (requireCoreTeam && !isCoreTeam) {
    return null; // Will redirect in the useEffect
  }

  // Show unauthorized message if doesn't have required department access
  if (requiredDepartment && !isCoreTeam && (!department || department !== requiredDepartment)) {
    return null; // Will redirect in the useEffect
  }

  // If all checks pass, render the children
  return <>{children}</>;
} 