"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, XCircle, HelpCircle, Clock, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getDepartmentName, DepartmentId } from "@/lib/adminConfig";
import { normalizeDepartmentId } from "@/lib/departmentMapping";

type ApplicationStatus = "pending" | "approved" | "rejected" | "active";

interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  regNo?: string;
  status?: ApplicationStatus;
  departmentStatuses?: Record<string, { status: string }>;
  createdAt?: Date;
  departments?: string[];
  applicationSubmitted?: boolean;
  applicationSubmittedAt?: Date;
}

interface ApplicationsTableProps {
  applications: ApplicationUser[];
  loading: boolean;
  departmentId?: string | null;
  onStatusFilter?: (status: string | null) => void;
  activeStatus?: string | null;
}

export function ApplicationsTable({
  applications,
  loading,
  departmentId,
  onStatusFilter,
  activeStatus
}: ApplicationsTableProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set initial state based on window width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Status badge configuration
  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      icon: <HelpCircle className="h-3 w-3 md:h-4 md:w-4" />
    },
    approved: {
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      icon: <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
    },
    rejected: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      icon: <XCircle className="h-3 w-3 md:h-4 md:w-4" />
    },
    active: {
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      icon: <Clock className="h-3 w-3 md:h-4 md:w-4" />
    }
  };

  // Helper function to get department display name
  const getDepartmentDisplayName = (deptId: string): string => {
    // Map normalized IDs back to admin config format for display names
    const reverseMapping: Record<string, DepartmentId> = {
      'ai-ml': 'ai_ml',
      'dev': 'development',
      'open-source': 'open_source',
      'game-dev': 'game_dev',
      'cybersec': 'cybersec_blockchain',
      'robotics': 'robotics_iot',
      'events': 'event_ops',
      'design': 'design_content',
      'marketing': 'marketing',
      'social-media': 'social_media'
    };

    const adminConfigId = reverseMapping[deptId];
    return adminConfigId ? getDepartmentName(adminConfigId) : deptId;
  };

  // Function to determine which status to display
  const getDisplayStatus = (application: ApplicationUser): ApplicationStatus => {
    if (departmentId && application.departmentStatuses) {
      const normalizedDeptId = normalizeDepartmentId(departmentId);
      if (application.departmentStatuses[normalizedDeptId]) {
        return application.departmentStatuses[normalizedDeptId].status as ApplicationStatus;
      }
    }
    // Always default to pending if no department status is found, instead of using overall status
    return 'pending';
  };

  // New function to get departments where user is approved
  const getApprovedDepartments = (application: ApplicationUser): string[] => {
    if (!application.departmentStatuses || !application.departments) {
      return [];
    }

    return application.departments.filter(dept => {
      const normalizedDept = normalizeDepartmentId(dept);
      return application.departmentStatuses?.[normalizedDept]?.status === 'approved';
    });
  };

  // Status filter options
  const statusFilters = [
    { value: null, label: "All Applications" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
          <Filter className="h-6 w-6 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No applications found</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          {activeStatus ? `No ${activeStatus} applications found.` : "No applications match your current filters."}
        </p>
        {activeStatus && onStatusFilter && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onStatusFilter(null)} 
            className="mt-4"
          >
            View all applications
          </Button>
        )}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div>
        {/* Status filter - mobile */}
        {onStatusFilter && (
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Filter: {activeStatus ? activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1) : "All Applications"}</span>
                  <Filter className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusFilters.map((filter) => (
                  <DropdownMenuItem 
                    key={filter.value || 'all'} 
                    onClick={() => onStatusFilter(filter.value)}
                    className={activeStatus === filter.value ? "bg-primary/10 font-medium" : ""}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      
        {/* Applications as cards */}
        <div className="space-y-3">
          {applications.map((application) => {
            const status = getDisplayStatus(application);
            const statusInfo = statusConfig[status] || statusConfig.pending;
            const approvedDepts = getApprovedDepartments(application);
            
            return (
              <Card
                key={application.id}
                className="dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                onClick={() => router.push(`/dashboard/applications/${application.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span className="text-xs font-medium capitalize">{status}</span>
                      </div>
                      {/* Submission status badge */}
                      <div className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs font-medium ${
                        application.applicationSubmitted
                          ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                      }`}>
                        {application.applicationSubmitted ? "✓ Submitted" : "⏳ Not Submitted"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 w-7 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/dashboard/applications/${application.id}`}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">View application</span>
                      </Link>
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{application.name || "Anonymous"}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{application.email}</p>
                    {application.regNo && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Reg: {application.regNo}
                      </p>
                    )}
                    {application.departments && application.departments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {application.departments.map((dept, idx) => {
                          const isApproved = approvedDepts.includes(dept);
                          return (
                            <span 
                              key={idx}
                              className={`text-[10px] px-1.5 py-0.5 ${
                                isApproved 
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium" 
                                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              } rounded`}
                            >
                              {getDepartmentDisplayName(dept)}
                              {isApproved && " ✓"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop table view
  return (
    <div>
      {/* Status filter - desktop */}
      {onStatusFilter && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value || 'all'}
              variant={activeStatus === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
      
      {/* Applications table */}
      <div className="rounded-md border dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom min-w-[1000px]">
            <thead className="border-b dark:border-gray-800">
              <tr className="bg-gray-50 dark:bg-gray-900">
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[150px]">
                  Name
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[200px]">
                  Email
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">
                  Registration No.
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[180px]">
                  Departments
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[130px]">
                  Submission
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[100px]">
                  Status
                </th>
                <th className="h-10 px-4 text-right align-middle text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {applications.map((application) => {
                const status = getDisplayStatus(application);
                const statusInfo = statusConfig[status] || statusConfig.pending;
                const approvedDepts = getApprovedDepartments(application);
                
                return (
                  <tr
                    key={application.id}
                    onClick={() => router.push(`/dashboard/applications/${application.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 align-middle text-sm font-medium dark:text-white">
                      {application.name || "Anonymous"}
                    </td>
                    <td className="p-4 align-middle text-sm text-gray-700 dark:text-gray-300">
                      {application.email}
                    </td>
                    <td className="p-4 align-middle text-sm text-gray-700 dark:text-gray-300">
                      {application.regNo || "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      {application.departments && application.departments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {application.departments.map((dept, idx) => {
                            const isApproved = approvedDepts.includes(dept);
                            return (
                              <span
                                key={idx}
                                className={`text-xs px-1.5 py-0.5 ${
                                  isApproved
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium"
                                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                } rounded`}
                              >
                                {getDepartmentDisplayName(dept)}
                                {isApproved && " ✓"}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-500">None</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        application.applicationSubmitted
                          ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                      }`}>
                        {application.applicationSubmitted ? "✓ Submitted" : "⏳ Not Submitted"}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span className="text-xs font-medium capitalize">{status}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <Link href={`/dashboard/applications/${application.id}`}>
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">View application</span>
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 