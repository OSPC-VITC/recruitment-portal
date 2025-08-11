"use client";

import { useState, useEffect } from "react";
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
  const departmentId = department ? departmentToFirestoreId[department] : null;
  const searchParams = useSearchParams();
  const router = useRouter();

  // State for applications data
  const [applications, setApplications] = useState<ApplicationUser[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationUser[]>([]);
  const [submittedApplications, setSubmittedApplications] = useState<ApplicationUser[]>([]);
  const [nonSubmittedApplications, setNonSubmittedApplications] = useState<ApplicationUser[]>([]);
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

      // Only update if values have actually changed
      if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
      if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
      if (urlDepartment !== departmentFilter) setDepartmentFilter(urlDepartment);
      if (urlSort !== sortBy) setSortBy(urlSort);
      if (urlSubmission !== submissionFilter) setSubmissionFilter(urlSubmission);
    }
  }, [searchParams, filtersInitialized]);

  // Fetch applications data
  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);

      try {
        // Get users with applications
        const usersRef = collection(db, "users");
        let usersQuery;

        // For department leads, only fetch applications for their department
        if (!isCoreTeam && departmentId) {
          usersQuery = query(
            usersRef,
            where("departments", "array-contains", departmentId)
          );
        } else {
          usersQuery = usersRef;
        }

        const usersSnapshot = await getDocs(usersQuery);

        const applicationsData: ApplicationUser[] = [];

        // Process user data
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          applicationsData.push({
            id: doc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate ? userData.createdAt?.toDate() : new Date(),
          } as ApplicationUser);
        });

        setApplications(applicationsData);
      } catch (error) {
        console.error("Error fetching applications:", error);
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
  }, [searchTimeout]);
  
  // Apply filters and sorting
  useEffect(() => {
    // Only apply filters after they've been initialized from URL
    if (!filtersInitialized) return;

    let result = [...applications];

    // Separate submitted and non-submitted applications
    const submitted = applications.filter(app => app.applicationSubmitted === true);
    const nonSubmitted = applications.filter(app => app.applicationSubmitted !== true);

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
        result = result.filter((app) => {
          if (app.departmentStatuses && app.departmentStatuses[departmentId]) {
            return app.departmentStatuses[departmentId].status === statusFilter;
          }
          // Fallback to overall status if no department-specific status exists
          return app.status === statusFilter;
        });
      } else {
        // For core team, filter by overall status
        result = result.filter((app) => app.status === statusFilter);
      }
    }

    // Apply department filter (only for core team)
    if (isCoreTeam && departmentFilter !== "all") {
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
  }, [applications, searchQuery, statusFilter, departmentFilter, sortBy, submissionFilter, isCoreTeam, departmentId, filtersInitialized]);
  
  // Get current page items
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };
  
  // Update URL parameters when filters change
  const updateURLParams = (newParams: Record<string, string | null>) => {
    if (!filtersInitialized) return; // Don't update URL during initialization

    const url = new URL(window.location.href);

    // Get current values to build complete parameter set
    const currentParams = {
      search: searchQuery,
      status: statusFilter,
      department: departmentFilter,
      sort: sortBy,
      submitted: submissionFilter,
      ...newParams // Override with new values
    };

    // Clear all existing filter params
    ['search', 'status', 'department', 'sort', 'submitted'].forEach(key => {
      url.searchParams.delete(key);
    });

    // Set new params
    Object.entries(currentParams).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "" && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    router.push(url.pathname + url.search, { scroll: false });
  };

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
  
  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Debounced search to avoid too many URL updates
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handler functions for filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for URL update
    const newTimeout = setTimeout(() => {
      updateURLParams({ search: value });
    }, 300); // 300ms debounce

    setSearchTimeout(newTimeout);
  };

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value);
    updateURLParams({ status: value });
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    updateURLParams({ department: value });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURLParams({ sort: value });
  };

  const handleSubmissionChange = (value: string) => {
    setSubmissionFilter(value);
    updateURLParams({ submitted: value });
  };

  if (loading) {
    return (
      <div className="py-8">
        <Loading size="lg" text="Loading applications..." className="py-12" />
      </div>
    );
  }

  return (
    <div>
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
                      <SelectItem value="all">All Applications ({applications.length})</SelectItem>
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
                        {Object.entries(DEPARTMENTS).map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
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