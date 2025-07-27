"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  Users, 
  FileText, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Database,
  Settings
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { departmentToFirestoreId, getDepartmentName, DepartmentId } from "@/lib/adminConfig";
import { Loading } from "@/components/ui/loading";

// Dashboard stats card component
function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3">
        <CardTitle className="text-xs md:text-sm font-medium dark:text-white">{title}</CardTitle>
        <div className={`p-1.5 md:p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="text-lg md:text-2xl font-bold dark:text-white">{value}</div>
        <p className="text-xs text-muted-foreground dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
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

// Department stats card component
function DepartmentStatsCard({
  departmentId,
  departmentName,
  stats
}: {
  departmentId: string;
  departmentName: string;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}) {
  return (
    <Card className="mb-4 md:mb-6 dark:border-gray-800">
      <CardHeader className="pb-2 border-b dark:border-gray-800 px-4 py-3">
        <CardTitle className="text-base md:text-lg font-medium dark:text-white">{departmentName}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 md:pt-4 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
          <div>
            <Link href={`/dashboard/applications?department=${departmentId}`} className="block p-1.5 md:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              <div className="text-base md:text-lg font-semibold dark:text-white">{stats.total}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground dark:text-gray-400">Applications</div>
            </Link>
          </div>
          <div>
            <Link href={`/dashboard/applications?department=${departmentId}&status=pending`} className="block p-1.5 md:p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors">
              <div className="text-base md:text-lg font-semibold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground dark:text-gray-400">Pending</div>
            </Link>
          </div>
          <div>
            <Link href={`/dashboard/applications?department=${departmentId}&status=approved`} className="block p-1.5 md:p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
              <div className="text-base md:text-lg font-semibold text-green-600 dark:text-green-400">{stats.approved}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground dark:text-gray-400">Approved</div>
            </Link>
          </div>
          <div>
            <Link href={`/dashboard/applications?department=${departmentId}&status=rejected`} className="block p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <div className="text-base md:text-lg font-semibold text-red-600 dark:text-red-400">{stats.rejected}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground dark:text-gray-400">Rejected</div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { isCoreTeam, department } = useAdminAuth();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    totalQuestions: 0
  });
  
  // New state for department-specific stats (for core team view)
  const [departmentStats, setDepartmentStats] = useState<Record<string, {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>>({});
  
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get the department Firestore ID for filtering
  const departmentId = department ? departmentToFirestoreId[department] : null;
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get user stats
        const usersRef = collection(db, "users");
        let usersQuery: any = usersRef;
        
        // For department leads, filter by department
        if (!isCoreTeam && departmentId) {
          usersQuery = query(
            usersRef,
            where("departments", "array-contains", departmentId)
          );
        }
        
        const usersSnap = await getDocs(usersQuery);
        const totalUsers = usersSnap.size;
        
        // Get application stats
        let applicationsRef = collection(db, "applications");
        const applicationsSnap = await getDocs(applicationsRef);
        const totalApplications = applicationsSnap.size;
        
        // Get questions stats
        const formFieldsRef = collection(db, "formFields");
        let questionsQuery: any = formFieldsRef;
        
        // For department leads, filter by department
        if (!isCoreTeam && departmentId) {
          questionsQuery = query(
            formFieldsRef,
            where("departmentId", "==", departmentId)
          );
        }
        
        const questionsSnap = await getDocs(questionsQuery);
        const totalQuestions = questionsSnap.size;
        
        // Always use department-specific statuses for counts
        if (!isCoreTeam && departmentId) {
          // For department leads, we need to count based on department-specific statuses
          // Initialize counters
          let pendingCount = 0;
          let approvedCount = 0;
          let rejectedCount = 0;
          
          // Count users with the specific department status
          for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data() as any;
            // Check if the user has department-specific status
            if (userData.departmentStatuses && userData.departmentStatuses[departmentId]) {
              const deptStatus = userData.departmentStatuses[departmentId].status;
              if (deptStatus === 'pending') pendingCount++;
              else if (deptStatus === 'approved') approvedCount++;
              else if (deptStatus === 'rejected') rejectedCount++;
            } else {
              // If no department-specific status, count as pending
              pendingCount++;
            }
          }
          
          // Update state with the counts
          setStats({
            totalApplications: totalUsers,
            pendingApplications: pendingCount,
            approvedApplications: approvedCount,
            rejectedApplications: rejectedCount,
            totalUsers,
            totalQuestions
          });
        } else {
          // For core team, each user application is counted as one, not per department
          // First, create department stats dictionary for all departments
          const deptStats: Record<string, {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
          }> = {};
          
          // For each department, prepare a stats object
          for (const [deptId, firestoreId] of Object.entries(departmentToFirestoreId)) {
            deptStats[firestoreId] = {
              total: 0,
              pending: 0,
              approved: 0,
              rejected: 0
            };
          }
          
          // Process all users and count them per department
          let totalPending = 0;
          let totalApproved = 0;
          let totalRejected = 0;
          let usersWithAllDeptsReviewed = 0;
          
          for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data() as any;
            const userDepartments = userData.departments || [];
            let userHasPendingDept = false;
            let userHasApprovedDept = false;
            
            // Skip users with no departments
            if (userDepartments.length === 0) continue;
            
            // Count this user for each of their departments
            for (const userDept of userDepartments) {
              if (deptStats[userDept]) {
                deptStats[userDept].total += 1;
                
                // Check if the user has department-specific status
                if (userData.departmentStatuses && userData.departmentStatuses[userDept]) {
                  const deptStatus = userData.departmentStatuses[userDept].status;
                  if (deptStatus === 'pending') {
                    deptStats[userDept].pending += 1;
                    userHasPendingDept = true;
                  } else if (deptStatus === 'approved') {
                    deptStats[userDept].approved += 1;
                    userHasApprovedDept = true;
                  } else if (deptStatus === 'rejected') {
                    deptStats[userDept].rejected += 1;
                  }
                } else {
                  // If no department-specific status, count as pending
                  deptStats[userDept].pending += 1;
                  userHasPendingDept = true;
                }
              }
            }
            
            // Count user as pending if they have any pending department
            if (userHasPendingDept) {
              totalPending += 1;
            } 
            // Count user as approved if they have at least one approved department and no pending departments
            else if (userHasApprovedDept) {
              totalApproved += 1;
              usersWithAllDeptsReviewed += 1;
            }
            // Count user as rejected if all departments are reviewed and none are approved
            else {
              totalRejected += 1;
              usersWithAllDeptsReviewed += 1;
            }
          }
          
          setDepartmentStats(deptStats);
          
          // Update overall stats based on user counts, not department aggregates
          setStats({
            totalApplications: totalUsers,
            pendingApplications: totalPending,
            approvedApplications: totalApproved,
            rejectedApplications: totalRejected,
            totalUsers,
            totalQuestions
          });
        }
        
        // Get recent applications - filtered by department for department leads
        let recentQuery;
        
        if (!isCoreTeam && departmentId) {
          recentQuery = query(
            collection(db, "users"),
            where("departments", "array-contains", departmentId),
            orderBy("createdAt", "desc"),
            limit(5)
          );
        } else {
          recentQuery = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(5)
          );
        }
        
        const recentSnap = await getDocs(recentQuery);
        
        const recentApps = recentSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentApplications(recentApps);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [isCoreTeam, departmentId]);
  
  if (loading) {
    return (
      <div className="py-8">
        <Loading size="lg" text="Loading dashboard data..." className="py-12" />
      </div>
    );
  }
  
  return (
    <div>
      {/* Dashboard stats */}
      <div className="mb-6">
        <h2 className="text-base md:text-xl font-semibold mb-3 dark:text-white">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            description="Applications submitted"
            icon={<FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            description="Waiting for review"
            icon={<Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400" />}
            color="bg-yellow-100 dark:bg-yellow-900/30"
          />
          <StatCard
            title="Approved Applications"
            value={stats.approvedApplications}
            description="Selected candidates"
            icon={<CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 dark:text-green-400" />}
            color="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            title="Rejected Applications"
            value={stats.rejectedApplications}
            description="Not selected"
            icon={<XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600 dark:text-red-400" />}
            color="bg-red-100 dark:bg-red-900/30"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
        {/* Left Column - Recent Applications */}
        <div className="col-span-1 md:col-span-2 order-2 md:order-1">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-xl font-semibold dark:text-white">Recent Applications</h2>
              <Button variant="outline" size="sm" asChild className="text-xs md:text-sm h-8 px-2 md:px-3 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700">
                <Link href="/dashboard/applications">
                  View All
                  <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            </div>
            
            <Card className="dark:border-gray-800">
              {recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-40">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-600 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">No applications yet</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    There are no applications submitted yet. They will appear here once students start applying.
                  </p>
                </div>
              ) : (
                <div>
                  {recentApplications.map((application: any) => (
                    <RecentApplicationCard 
                      key={application.id} 
                      application={application} 
                      departmentId={departmentId || undefined} 
                    />
                  ))}
                  {recentApplications.length > 0 && (
                    <div className="flex justify-center p-3">
                      <Button variant="ghost" size="sm" asChild className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <Link href="/dashboard/applications">View All Applications</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Right Column - Department Stats or Quick Links */}
        <div className="col-span-1 order-1 md:order-2 mb-4 md:mb-0">
          {/* Department stats section (core team only) */}
          {isCoreTeam && Object.keys(departmentStats).length > 0 && (
            <div className="mb-6">
              <h2 className="text-base md:text-xl font-semibold mb-3 dark:text-white">Department Stats</h2>
              {Object.entries(departmentStats).map(([deptId, stats]) => (
                <DepartmentStatsCard
                  key={deptId}
                  departmentId={deptId}
                  departmentName={getDepartmentName(deptId as DepartmentId)}
                  stats={stats}
                />
              ))}
            </div>
          )}
          
          {/* Quick Links */}
          <div>
            <h2 className="text-base md:text-xl font-semibold mb-3 dark:text-white">Quick Actions</h2>
            <Card className="dark:border-gray-800">
              <CardContent className="px-3 py-4 space-y-2 md:space-y-3">
                <Button variant="outline" asChild className="w-full text-left flex items-center justify-between text-xs md:text-sm h-9 md:h-10">
                  <Link href="/dashboard/applications">
                    <div className="flex items-center">
                      <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                      <span>View All Applications</span>
                    </div>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full text-left flex items-center justify-between text-xs md:text-sm h-9 md:h-10">
                  <Link href="/dashboard/questions">
                    <div className="flex items-center">
                      <Database className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                      <span>Manage Questions</span>
                    </div>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </Button>
                {isCoreTeam && (
                  <>
                    <Button variant="outline" asChild className="w-full text-left flex items-center justify-between text-xs md:text-sm h-9 md:h-10">
                      <Link href="/dashboard/users">
                        <div className="flex items-center">
                          <Users className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          <span>Manage Users</span>
                        </div>
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full text-left flex items-center justify-between text-xs md:text-sm h-9 md:h-10">
                      <Link href="/dashboard/settings">
                        <div className="flex items-center">
                          <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          <span>Portal Settings</span>
                        </div>
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 