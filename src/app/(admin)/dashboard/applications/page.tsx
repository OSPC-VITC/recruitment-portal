"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Search, Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { DEPARTMENTS, User as UserType, ApplicationStatus } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { departmentToFirestoreId, getDepartmentName, DepartmentId } from "@/lib/adminConfig";
import { DEPARTMENT_IDS, normalizeDepartmentId, getAllDepartmentIds } from "@/lib/departmentMapping";
import { Label } from "@/components/ui/label";
import { ApplicationsTable } from "./components/ApplicationsTable";

import { Loading } from "@/components/ui/loading";

// Status badge component
function StatusBadge({ status, className = "" }: { status: string, className?: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge className={`bg-green-100 text-green-800 hover:bg-green-200 ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className={`bg-red-100 text-red-800 hover:bg-red-200 ${className}`}>
          <XCircle className="h-3 w-3 mr-1" /> Rejected
        </Badge>
      );
    case "active":
      return (
        <Badge className={`bg-blue-100 text-blue-800 hover:bg-blue-200 ${className}`}>
          <Clock className="h-3 w-3 mr-1" /> Active
        </Badge>
      );
    default:
      return (
        <Badge className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-200 ${className}`}>
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
  }
}

// Extended user type for application data
interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  regNo: string;
  phone: string;
  departments?: string[];
  status?: ApplicationStatus;
  departmentStatuses?: Record<string, { status: string }>;
  createdAt: Date;
  applicationSubmitted?: boolean;
  applicationSubmittedAt?: Date;
  [key: string]: unknown;
}

export default function AdminApplicationsPage() {
  const { isCoreTeam, department } = useAdminAuth();

  // Fix the department ID mapping chain
  // 1. Admin credentials store department in DepartmentId format (e.g., 'event_ops', 'design_content')
  // 2. We need to convert this to the normalized Firestore format (e.g., 'events', 'design')
  const departmentId = department ? departmentToFirestoreId[department] : null;

  // Simple debug for critical departments (only in development)
  if (process.env.NODE_ENV === 'development' && (department === 'open_source' || department === 'game_dev')) {
    console.log(`Department Access: ${department} → ${departmentId}`);
  }



  const searchParams = useSearchParams();
  const router = useRouter();

  // Add safety check for proper initialization
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => {
    setIsComponentMounted(true);
  }, []);

  // State for applications data
  const [applications, setApplications] = useState<ApplicationUser[]>([]); // All applications for statistics
  const [departmentApplications, setDepartmentApplications] = useState<ApplicationUser[]>([]); // Department-specific for dept leads
  const [filteredApplications, setFilteredApplications] = useState<ApplicationUser[]>([]); // Filtered for table display
  const [submittedApplications, setSubmittedApplications] = useState<ApplicationUser[]>([]);
  const [nonSubmittedApplications, setNonSubmittedApplications] = useState<ApplicationUser[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<ApplicationUser[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<ApplicationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort state - will be initialized from URL params
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [submissionFilter, setSubmissionFilter] = useState("all");

  // Initialize filters from URL parameters
  useEffect(() => {
    if (!filtersInitialized) {
      const urlSearch = searchParams.get('search') || "";
      const urlStatus = searchParams.get('status');
      const urlDepartment = searchParams.get('department') || (!isCoreTeam && departmentId ? departmentId : "all");
      const urlSort = searchParams.get('sort') || "newest";
      const urlSubmission = searchParams.get('submitted') || "all";

      setSearchQuery(urlSearch);
      setStatusFilter(urlStatus);
      setDepartmentFilter(urlDepartment);
      setSortBy(urlSort);
      setSubmissionFilter(urlSubmission);
      setFiltersInitialized(true);
    }
  }, [searchParams, isCoreTeam, departmentId, filtersInitialized]);

  // Handle URL parameter changes when navigating back/forward
  useEffect(() => {
    if (filtersInitialized) {
      const urlSearch = searchParams.get('search') || "";
      const urlStatus = searchParams.get('status');
      const urlDepartment = searchParams.get('department') || (!isCoreTeam && departmentId ? departmentId : "all");
      const urlSort = searchParams.get('sort') || "newest";
      const urlSubmission = searchParams.get('submitted') || "all";

      // Only update if values have actually changed - use refs to avoid circular deps
      const currentValues = {
        search: searchQuery,
        status: statusFilter,
        department: departmentFilter,
        sort: sortBy,
        submission: submissionFilter
      };

      if (urlSearch !== currentValues.search) setSearchQuery(urlSearch);
      if (urlStatus !== currentValues.status) setStatusFilter(urlStatus);
      if (urlDepartment !== currentValues.department) setDepartmentFilter(urlDepartment);
      if (urlSort !== currentValues.sort) setSortBy(urlSort);
      if (urlSubmission !== currentValues.submission) setSubmissionFilter(urlSubmission);
    }
  }, [searchParams, filtersInitialized, isCoreTeam, departmentId]);

  // Fetch applications data
  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);

      try {
        // Always fetch ALL applications for accurate statistics
        // We'll filter them in the UI, not at the database level
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const applicationsData: ApplicationUser[] = [];

        // Process user data
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();

          // Only include users who have departments (i.e., have applied)
          if (!userData.departments || userData.departments.length === 0) {
            return; // Skip users who haven't applied to any department
          }

          // Normalize department IDs in the application data
          const originalDepartments = userData.departments || [];
          const normalizedDepartments = originalDepartments.map((dept: string) =>
            normalizeDepartmentId(dept)
          );

          const applicationUser: ApplicationUser = {
            id: doc.id,
            name: userData.name || '',
            email: userData.email || '',
            regNo: userData.regNo || '',
            phone: userData.phone || '',
            ...userData,
            departments: normalizedDepartments,
            createdAt: userData.createdAt?.toDate ? userData.createdAt?.toDate() : new Date(),
            applicationSubmittedAt: userData.applicationSubmittedAt?.toDate ?
              userData.applicationSubmittedAt?.toDate() : undefined,
          };

          applicationsData.push(applicationUser);
        });



        // Set all applications for statistics
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
            console.log(`Filtered ${deptSpecificApps.length} applications for ${department} from ${applicationsData.length} total`);
          }

          setDepartmentApplications(deptSpecificApps);
        } else {
          setDepartmentApplications(applicationsData);
        }
      } catch (error) {
        console.error("❌ Error fetching applications:", error);
        toast.error("Unable to load applications", { id: "admin-apps-load-error" });
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [isCoreTeam, departmentId]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);
  
  // Apply filters and sorting
  useEffect(() => {
    // Only apply filters after they've been initialized from URL
    if (!filtersInitialized) return;

    // Use department-specific applications for filtering (already filtered for dept leads)
    const baseApplications = departmentApplications;
    let result = [...baseApplications];

    // Separate submitted and non-submitted applications from the base result
    // Fix submission status logic to be more explicit and robust
    const submitted = baseApplications.filter(app => isApplicationSubmitted(app));
    const nonSubmitted = baseApplications.filter(app => !isApplicationSubmitted(app));

    setSubmittedApplications(submitted);
    setNonSubmittedApplications(nonSubmitted);

    // Apply submission filter first
    if (submissionFilter === "submitted") {
      result = submitted;
    } else if (submissionFilter === "not-submitted") {
      result = nonSubmitted;
    }
    // If "all", keep all applications

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name?.toLowerCase().includes(query) ||
          app.email?.toLowerCase().includes(query) ||
          app.regNo?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      if (!isCoreTeam && departmentId) {
        // For department leads, filter by department-specific status
        // departmentId is already in the correct format
        result = result.filter((app) => {
          if (app.departmentStatuses && app.departmentStatuses[departmentId]) {
            return app.departmentStatuses[departmentId].status === statusFilter;
          }
          // Fallback to overall status if no department-specific status exists
          return app.status === statusFilter;
        });
      } else {
        // For core team, filter by overall status or by any department-specific status
        result = result.filter((app) => {
          // Check overall status first
          if (app.status === statusFilter) return true;
          
          // Then check if any department has the specified status
          if (app.departmentStatuses) {
            // If department filter is active, only check that department's status
            if (departmentFilter !== "all") {
              return app.departmentStatuses[departmentFilter]?.status === statusFilter;
            }
            
            // Otherwise check if any department has the status
            return Object.values(app.departmentStatuses).some(
              deptStatus => deptStatus.status === statusFilter
            );
          }
          return false;
        });
      }
    }

    // Apply department filter for core team
    if (isCoreTeam && departmentFilter !== "all") {
      // departmentFilter is already in the normalized format from the dropdown
      result = result.filter((app) =>
        app.departments?.includes(departmentFilter)
      );
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = a.applicationSubmittedAt || a.createdAt;
        const dateB = b.applicationSubmittedAt || b.createdAt;
        
        // Ensure we're working with Date objects
        const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
        const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();
        
        return timeB - timeA;
      });
    } else if (sortBy === "oldest") {
      result.sort((a, b) => {
        const dateA = a.applicationSubmittedAt || a.createdAt;
        const dateB = b.applicationSubmittedAt || b.createdAt;
        
        // Ensure we're working with Date objects
        const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
        const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();
        
        return timeA - timeB;
      });
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    
    // Update filtered applications and pagination
    setFilteredApplications(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / itemsPerPage)));
    setCurrentPage(1); // Reset to first page when filters change
  }, [departmentApplications, searchQuery, statusFilter, departmentFilter, sortBy, submissionFilter, isCoreTeam, departmentId, filtersInitialized]);
  
  // Get current page items
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };
  
  // Update URL parameters when filters change
  const updateURLParams = useCallback((newParams: Record<string, string | null>) => {
    if (!filtersInitialized) return; // Don't update URL during initialization

    const url = new URL(window.location.href);

    // Clear all existing filter params first
    ['search', 'status', 'department', 'sort', 'submitted'].forEach(key => {
      url.searchParams.delete(key);
    });

    // Set new params directly without depending on state
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "" && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    // Also preserve existing params that aren't being updated
    const currentUrl = new URL(window.location.href);
    ['search', 'status', 'department', 'sort', 'submitted'].forEach(key => {
      if (!(key in newParams) && currentUrl.searchParams.has(key)) {
        const existingValue = currentUrl.searchParams.get(key);
        if (existingValue && existingValue !== "all" && existingValue !== "") {
          url.searchParams.set(key, existingValue);
        }
      }
    });

    router.push(url.pathname + url.search, { scroll: false });
  }, [filtersInitialized, router]);

  // Reset all filters
  const resetFilters = () => {
    const defaultDepartment = !isCoreTeam && departmentId ? departmentId : "all";

    setSearchQuery("");
    setStatusFilter(null);
    setSubmissionFilter("all");
    setDepartmentFilter(defaultDepartment);
    setSortBy("newest");

    // Clear URL params completely
    const url = new URL(window.location.href);
    ['search', 'status', 'department', 'sort', 'submitted'].forEach(key => {
      url.searchParams.delete(key);
    });

    router.push(url.pathname + url.search, { scroll: false });
  };
  
  // Export applications as CSV
  const exportToCSV = () => {
    try {
      // Build CSV headers
      let headers = ["Name", "Email", "Phone", "Registration No", "Selected Departments"];
      
      // Filter applications to only include those with approved statuses in at least one department
      const selectedApplications = filteredApplications.filter(app => {
        // Department-specific filtering
        if (!isCoreTeam && departmentId && app.departmentStatuses?.[departmentId]?.status === 'approved') {
          return true;
        }
        
        // For core team, include users approved in any department
        if (isCoreTeam) {
          return app.departments?.some(dept => 
            app.departmentStatuses?.[dept]?.status === 'approved'
          ) || false;
        }
        
        return false;
      });
      
      // Build CSV data
      const csvData = selectedApplications.map(app => {
        // Get the departments where the user is approved
        const approvedDepartments = app.departments?.filter(dept => 
          app.departmentStatuses?.[dept]?.status === 'approved'
        ) || [];
        
        // Format the department names
        const formattedDepartments = approvedDepartments
          .map(d => getDepartmentName(d as DepartmentId))
          .join(", ");
        
        return [
          app.name || "",
          app.email || "",
          app.phone || "",
          app.regNo || "",
          formattedDepartments
        ];
      });
      
      // Only proceed if there are approved applications
      if (csvData.length === 0) {
        toast.info("No selected applications found to export", { id: "admin-apps-export-empty" });
        return;
      }
      
      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_applicants_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${csvData.length} selected applicants exported successfully`, { id: "admin-apps-export-success" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Unable to export applications", { id: "admin-apps-export-error" });
    }
  };

  const exportNonSelected = () => {
    try {
      // Build CSV headers
      let headers = ["Name", "Email", "Phone", "Registration No", "Applied Departments"];
      
      // Filter applications to only include those where applicationSubmitted is false
      const nonSubmittedApplications = filteredApplications.filter(app => {
        return app.applicationSubmitted === false;
      });
      
      // Build CSV data
      const csvData = nonSubmittedApplications.map(app => {
        // Get all departments the user applied to
        const appliedDepartments = app.departments || [];
        
        // Format the department names
        const formattedDepartments = appliedDepartments
          .map(d => getDepartmentName(d as DepartmentId))
          .join(", ");
        
        return [
          app.name || "",
          app.email || "",
          app.phone || "",
          app.regNo || "",
          formattedDepartments
        ];
      });
      
      // Only proceed if there are non-submitted applications
      if (csvData.length === 0) {
        toast.info("No non-submitted applications found to export", { id: "admin-apps-export-empty" });
        return;
      }
      
      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `non_submitted_applicants_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${csvData.length} non-submitted applicants exported successfully`, { id: "admin-apps-export-success" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Unable to export applications", { id: "admin-apps-export-error" });
    }
  };
  
  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Debounced search to avoid too many URL updates
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handler functions for filters
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    setSearchTimeout(prevTimeout => {
      if (prevTimeout) {
        clearTimeout(prevTimeout);
      }

      // Set new timeout for URL update
      return setTimeout(() => {
        updateURLParams({ search: value });
      }, 300); // 300ms debounce
    });
  }, [updateURLParams]);

  const handleStatusChange = useCallback((value: string | null) => {
    setStatusFilter(value);
    updateURLParams({ status: value });
  }, [updateURLParams]);

  const handleDepartmentChange = useCallback((value: string) => {
    setDepartmentFilter(value);
    updateURLParams({ department: value });
  }, [updateURLParams]);

  // Separate useEffect to calculate status counts
  useEffect(() => {
    if (!filtersInitialized) return;
    
    // For department leads, only show counts for their department
    if (!isCoreTeam && departmentId) {
      const approved = departmentApplications.filter(app => 
        app.departmentStatuses?.[departmentId]?.status === 'approved'
      );
      const rejected = departmentApplications.filter(app => 
        app.departmentStatuses?.[departmentId]?.status === 'rejected'
      );
      setApprovedApplications(approved);
      setRejectedApplications(rejected);
    } else {
      // For core team, consider both overall status and department-specific statuses
      const approved = departmentApplications.filter(app => {
        // Check overall status
        if (app.status === 'approved') return true;
        
        // Check if any department has approved status
        if (app.departmentStatuses) {
          // If department filter is active, only check that department's status
          if (departmentFilter !== "all") {
            return app.departmentStatuses[departmentFilter]?.status === 'approved';
          }
          
          // Otherwise check if any department has approved status
          return Object.values(app.departmentStatuses).some(
            deptStatus => deptStatus.status === 'approved'
          );
        }
        return false;
      });
      
      const rejected = departmentApplications.filter(app => {
        // Check overall status
        if (app.status === 'rejected') return true;
        
        // Check if any department has rejected status
        if (app.departmentStatuses) {
          // If department filter is active, only check that department's status
          if (departmentFilter !== "all") {
            return app.departmentStatuses[departmentFilter]?.status === 'rejected';
          }
          
          // Otherwise check if any department has rejected status
          return Object.values(app.departmentStatuses).some(
            deptStatus => deptStatus.status === 'rejected'
          );
        }
        return false;
      });
      
      setApprovedApplications(approved);
      setRejectedApplications(rejected);
    }
  }, [departmentApplications, departmentFilter, isCoreTeam, departmentId, filtersInitialized]);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    updateURLParams({ sort: value });
  }, [updateURLParams]);

  const handleSubmissionChange = useCallback((value: string) => {
    setSubmissionFilter(value);
    updateURLParams({ submitted: value });
  }, [updateURLParams]);



  // Helper function to determine if an application is submitted
  const isApplicationSubmitted = (app: ApplicationUser): boolean => {
    // Explicit check for true value
    return app.applicationSubmitted === true;
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

  if (loading || !filtersInitialized || !isComponentMounted) {
    return (
      <div className="py-8">
        <Loading size="lg" text="Loading applications..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Applications count display */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing {filteredApplications.length} of {departmentApplications.length} applications
            {!isCoreTeam && department && ` for ${getDepartmentDisplayName(departmentId || department)}`}
          </p>
        </div>
      </div>

      <Card className="mb-6 dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl dark:text-white">Applications</CardTitle>
              <CardDescription className="dark:text-gray-400 mt-1">
                {!isCoreTeam && department
                  ? `Applications for ${getDepartmentName(department)} department`
                  : "All applications across departments"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={resetFilters}
                variant="outline" 
                size="sm"
                className="dark:border-gray-700 dark:text-gray-300 gap-2 text-xs md:text-sm h-8 md:h-9"
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                Reset filters
              </Button>
              <Button 
                onClick={exportToCSV}
                variant="outline" 
                size="sm"
                className="dark:border-gray-700 dark:text-gray-300 gap-2 text-xs md:text-sm h-8 md:h-9"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4" />
                Export Selected
              </Button>
              <Button 
                onClick={exportNonSelected}
                variant="outline" 
                size="sm"
                className="dark:border-gray-700 dark:text-gray-300 gap-2 text-xs md:text-sm h-8 md:h-9"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4" />
                Export Non-Submitted
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          {/* Search and filter controls */}
          <div className="space-y-3 md:space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email or registration number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
              />
            </div>
            
            {/* Filter row 1 */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Submission Status filter */}
              <div className="w-full md:w-1/4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Submission Status</Label>
                  <Select
                    value={submissionFilter}
                    onValueChange={handleSubmissionChange}
                  >
                    <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 h-9">
                      <SelectValue placeholder="All applications" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="all">All Applications ({departmentApplications.length})</SelectItem>
                      <SelectItem value="submitted">Submitted ({submittedApplications.length})</SelectItem>
                      <SelectItem value="not-submitted">Not Submitted ({nonSubmittedApplications.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Application Status filter */}
              <div className="w-full md:w-1/4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Application Status</Label>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => handleStatusChange(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 h-9">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department filter - for core team only */}
              {isCoreTeam && (
                <div className="w-full md:w-1/4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Department</Label>
                    <Select
                      value={departmentFilter}
                      onValueChange={handleDepartmentChange}
                    >
                      <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 h-9">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                        <SelectItem value="all">All Departments</SelectItem>
                        {getAllDepartmentIds().map((deptId) => (
                          <SelectItem key={deptId} value={deptId}>
                            {getDepartmentDisplayName(deptId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Sort filter */}
              <div className="w-full md:w-1/4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Sort by</Label>
                  <Select
                    value={sortBy}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Summary counts */}
            <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total: </span>
                <span className="font-semibold dark:text-white">{applications.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Submitted: </span>
                <span className="font-semibold text-green-600 dark:text-green-400">{submittedApplications.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Not Submitted: </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{nonSubmittedApplications.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Approved: </span>
                <span className="font-semibold text-green-600 dark:text-green-400">{approvedApplications.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Rejected: </span>
                <span className="font-semibold text-red-600 dark:text-red-400">{rejectedApplications.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Filtered Results: </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredApplications.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Applications table */}
      <ApplicationsTable 
        applications={getCurrentItems()} 
        loading={loading} 
        departmentId={departmentId}
        onStatusFilter={handleStatusChange}
        activeStatus={statusFilter}
      />
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 dark:border-gray-700"
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  );
                } else if (
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={page} className="flex items-center">
                      <span className="text-gray-400">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 dark:border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 