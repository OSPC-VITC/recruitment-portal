"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Database,
  Settings
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { departmentToFirestoreId, getDepartmentName, DepartmentId } from "@/lib/adminConfig";
import { DEPARTMENT_IDS, normalizeDepartmentId } from "@/lib/departmentMapping";
import { Loading } from "@/components/ui/loading";
import { DepartmentStatistics } from "./applications/components/DepartmentStatistics";

// Application user type (matching the applications page)
interface ApplicationUser {
  id: string;
  name?: string;
  email?: string;
  departments?: string[];
  applicationSubmitted?: boolean;
  status?: string;
  departmentStatuses?: Record<string, { status: string; updatedAt?: any }>;
  createdAt?: Date;
  applicationSubmittedAt?: Date;
}



// Recent application card component 
function RecentApplicationCard({ application, departmentId }: { application: any; departmentId?: string }) {
  // Determine which status to show - department specific if available, otherwise overall status
  const deptStatus = departmentId && 
                     application.departmentStatuses && 
                     application.departmentStatuses[departmentId] ? 
                     application.departmentStatuses[departmentId].status : 
                     'pending';
  
  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" // For active overall status
  };

  const statusIcon = {
    pending: <HelpCircle className="h-3 w-3 md:h-4 md:w-4" />,
    approved: <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />,
    rejected: <XCircle className="h-3 w-3 md:h-4 md:w-4" />,
    active: <Clock className="h-3 w-3 md:h-4 md:w-4" /> // For active overall status
  };
  
  // Get approved departments for this user
  const getApprovedDepartments = () => {
    if (!application.departmentStatuses || !application.departments) {
      return [];
    }
    
    return application.departments.filter((dept: string) => 
      application.departmentStatuses[dept]?.status === 'approved'
    );
  };
  
  const approvedDepts = getApprovedDepartments();

  // Show department status if viewing as department lead
  const displayStatus = departmentId ? deptStatus : 
    (approvedDepts.length > 0 ? 'approved' : 
      application.departmentStatuses && Object.keys(application.departmentStatuses).length > 0 ? 'pending' : 'pending');

  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 md:p-2">
          <Users className="h-3 w-3 md:h-4 md:w-4 dark:text-gray-300" />
        </div>
        <div>
          <div className="font-semibold text-xs md:text-sm dark:text-white">{application.name || "Anonymous"}</div>
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{application.email || "No email"}</div>
          
          {/* Show approved departments if any */}
          {approvedDepts.length > 0 && !departmentId && (
            <div className="mt-1 flex flex-wrap gap-1">
              {approvedDepts.map((dept: string, idx: number) => (
                <span 
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                >
                  {dept.replace(/-/g, ' ')} ✓
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusColor[displayStatus as keyof typeof statusColor] || statusColor.pending}`}>
          {statusIcon[displayStatus as keyof typeof statusIcon]} 
          <span className="hidden xs:inline">{displayStatus}</span>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 w-7 md:h-8 md:w-8 p-0">
          <Link href={`/dashboard/applications/${application.id}`}>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            <span className="sr-only">View details</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}



export default function AdminDashboardPage() {
  const { isCoreTeam, department } = useAdminAuth();
  const router = useRouter();

  // State for applications data
  const [allUsers, setAllUsers] = useState<ApplicationUser[]>([]);
  const [applications, setApplications] = useState<ApplicationUser[]>([]);
  const [departmentApplications, setDepartmentApplications] = useState<ApplicationUser[]>([]);
  const [recentApplications, setRecentApplications] = useState<ApplicationUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the department Firestore ID for filtering
  const departmentId = department ? departmentToFirestoreId[department] : null;

  // Simple debug for critical departments (only in development)
  if (process.env.NODE_ENV === 'development' && (department === 'open_source' || department === 'game_dev')) {
    console.log(`Dashboard Department Access: ${department} → ${departmentId}`);
  }
  
  // Fetch applications data (similar to applications page)
  useEffect(() => {
    async function fetchApplicationsData() {
      try {
        setLoading(true);

        // Always fetch ALL applications for accurate statistics
        // We'll filter them in the UI, not at the database level
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const allUsersData: ApplicationUser[] = [];
        const applicationsData: ApplicationUser[] = [];

        // Process user data - include ALL users for overall statistics
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();

          // Normalize department IDs in the application data
          const originalDepartments = userData.departments || [];
          const normalizedDepartments = originalDepartments.map((dept: string) =>
            normalizeDepartmentId(dept)
          );

          const applicationUser: ApplicationUser = {
            id: doc.id,
            ...userData,
            departments: normalizedDepartments,
            createdAt: userData.createdAt?.toDate ? userData.createdAt?.toDate() : new Date(),
            applicationSubmittedAt: userData.applicationSubmittedAt?.toDate ?
              userData.applicationSubmittedAt?.toDate() : undefined,
          };

          // Add to all users dataset (for overall statistics)
          allUsersData.push(applicationUser);

          // Add to applications dataset only if user has applied to departments
          if (userData.departments && userData.departments.length > 0) {
            applicationsData.push(applicationUser);
          }
        });

        // Set all users and applications for statistics
        setAllUsers(allUsersData);
        setApplications(applicationsData);

        // For department leads, filter to their specific department
        if (!isCoreTeam && department) {
          // Create a robust department filtering function
          const filterByDepartment = (apps: ApplicationUser[], deptId: string): ApplicationUser[] => {
            return apps.filter(app => {
              if (!app.departments || app.departments.length === 0) return false;

              // Direct match
              if (app.departments.includes(deptId)) return true;

              // Normalized match
              const normalizedDeptId = normalizeDepartmentId(deptId);
              return app.departments.some(dept => normalizeDepartmentId(dept) === normalizedDeptId);
            });
          };

          let deptSpecificApps: ApplicationUser[] = [];

          // Try with mapped department ID first
          if (departmentId) {
            deptSpecificApps = filterByDepartment(applicationsData, departmentId);
          }

          // If no results and we have a raw department, try that
          if (deptSpecificApps.length === 0 && department) {
            deptSpecificApps = filterByDepartment(applicationsData, department);
          }

          // Simple debug for critical departments
          if (process.env.NODE_ENV === 'development' && (department === 'open_source' || department === 'game_dev')) {
            console.log(`Dashboard filtered ${deptSpecificApps.length} applications for ${department} from ${applicationsData.length} total`);
          }

          setDepartmentApplications(deptSpecificApps);
        } else {
          setDepartmentApplications(applicationsData);
        }

        // Get recent applications - only for core team members
        if (isCoreTeam) {
          const recentApps = applicationsData
            .sort((a, b) => {
              const dateA = a.applicationSubmittedAt || a.createdAt || new Date(0);
              const dateB = b.applicationSubmittedAt || b.createdAt || new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);

          setRecentApplications(recentApps);
        } else {
          // Clear recent applications for department leads
          setRecentApplications([]);
        }
        

      } catch (error) {
        console.error("Error fetching applications data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchApplicationsData();
  }, [isCoreTeam, department, departmentId]);

  // Navigation handlers for statistics filtering
  const handleStatsDepartmentFilter = useCallback((departmentId: string) => {
    router.push(`/dashboard/applications?department=${departmentId}`);
  }, [router]);

  const handleStatsStatusFilter = useCallback((status: string | null) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    router.push(`/dashboard/applications?${params.toString()}`);
  }, [router]);

  const handleStatsSubmissionFilter = useCallback((submission: string) => {
    router.push(`/dashboard/applications?submitted=${submission}`);
  }, [router]);
  
  if (loading) {
    return (
      <div className="py-8">
        <Loading size="lg" text="Loading dashboard data..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Overview of applications and statistics
          {!isCoreTeam && department && ` for ${getDepartmentName(department)}`}
        </p>
      </div>

      {/* Department Statistics - Main Feature */}
      <DepartmentStatistics
        applications={isCoreTeam ? applications : departmentApplications}
        allUsers={isCoreTeam ? allUsers : undefined}
        isCoreTeam={isCoreTeam}
        currentDepartmentId={departmentId}
        onFilterByDepartment={handleStatsDepartmentFilter}
        onFilterByStatus={handleStatsStatusFilter}
        onFilterBySubmission={handleStatsSubmissionFilter}
      />

      {/* Recent Applications and Quick Actions */}
      <div className={`grid grid-cols-1 gap-6 ${isCoreTeam ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {/* Recent Applications - Only visible for core team */}
        {isCoreTeam && (
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Recent Applications</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/applications">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Card className="dark:border-gray-800">
              {recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No applications yet</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    Applications will appear here once students start applying.
                  </p>
                </div>
              ) : (
                <div>
                  {recentApplications.map((application) => (
                    <RecentApplicationCard
                      key={application.id}
                      application={application}
                      departmentId={departmentId || undefined}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Actions</h2>
          <Card className="dark:border-gray-800">
            <CardContent className="p-4 space-y-3">
              <Button variant="outline" asChild className="w-full justify-between">
                <Link href="/dashboard/applications">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Manage Applications</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-between">
                <Link href="/dashboard/questions">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    <span>Manage Questions</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              {isCoreTeam && (
                <>
                  <Button variant="outline" asChild className="w-full justify-between">
                    <Link href="/dashboard/users">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Manage Users</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-between">
                    <Link href="/dashboard/settings">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Portal Settings</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}