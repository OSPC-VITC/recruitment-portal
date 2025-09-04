"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  FileCheck,
  TrendingUp,
  Filter
} from "lucide-react";
import { getDepartmentName, DepartmentId } from "@/lib/adminConfig";
import { DEPARTMENT_IDS, normalizeDepartmentId } from "@/lib/departmentMapping";

interface ApplicationUser {
  id: string;
  name?: string;
  email?: string;
  regNo?: string;
  departments?: string[];
  status?: string;
  departmentStatuses?: Record<string, any>;
  applicationSubmitted?: boolean;
  applicationSubmittedAt?: Date;
  createdAt?: Date; // Changed from required to optional
}

interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalApplications: number;
  submittedApplications: number;
  nonSubmittedApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

interface DepartmentStatisticsProps {
  applications: ApplicationUser[];
  allUsers?: ApplicationUser[];
  isCoreTeam: boolean;
  currentDepartmentId?: string | null;
  onFilterByDepartment: (departmentId: string) => void;
  onFilterByStatus: (status: string | null) => void;
  onFilterBySubmission: (submission: string) => void;
}

export function DepartmentStatistics({
  applications,
  allUsers,
  isCoreTeam,
  currentDepartmentId,
  onFilterByDepartment,
  onFilterByStatus,
  onFilterBySubmission
}: DepartmentStatisticsProps) {
  
  // Calculate statistics for each department
  const calculateDepartmentStats = (): DepartmentStats[] => {
    const departmentStatsMap = new Map<string, DepartmentStats>();

    // Initialize stats for all departments
    Object.values(DEPARTMENT_IDS).forEach(deptId => {
      const normalizedId = normalizeDepartmentId(deptId);
      departmentStatsMap.set(normalizedId, {
        departmentId: normalizedId,
        departmentName: getDepartmentDisplayName(normalizedId),
        totalApplications: 0,
        submittedApplications: 0,
        nonSubmittedApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
      });
    });

    // Process applications
    applications.forEach(app => {
      if (!app.departments || app.departments.length === 0) {
        return;
      }

      // Deduplicate departments after normalization to prevent double counting
      const uniqueNormalizedDepartments = Array.from(new Set(
        app.departments.map((deptId) => normalizeDepartmentId(deptId))
      ));

      uniqueNormalizedDepartments.forEach(normalizedDeptId => {
        const stats = departmentStatsMap.get(normalizedDeptId);

        if (!stats) {
          return;
        }

        stats.totalApplications++;

        // Check submission status - explicit check for true value
        if (app.applicationSubmitted === true) {
          stats.submittedApplications++;
        } else {
          stats.nonSubmittedApplications++;
        }

        // Check department-specific status first, then overall status
        let status = app.status || 'pending';
        if (app.departmentStatuses && app.departmentStatuses[normalizedDeptId]) {
          status = app.departmentStatuses[normalizedDeptId].status || status;
        }

        // Count status metrics only for submitted applications when pending
        // Approved/Rejected are counted regardless of submission flag (backward compatibility)
        if (status === 'approved') {
          stats.approvedApplications++;
        } else if (status === 'rejected') {
          stats.rejectedApplications++;
        } else if (status === 'pending' && app.applicationSubmitted === true) {
          // Only treat as pending if the application was actually submitted
          stats.pendingApplications++;
        }
      });
    });

    // Convert to array and filter out departments with no applications (unless core team)
    const statsArray = Array.from(departmentStatsMap.values());
    
    if (isCoreTeam) {
      return statsArray.sort((a, b) => b.totalApplications - a.totalApplications);
    } else if (currentDepartmentId) {
      // For department leads, only show their department
      const normalizedCurrentDept = normalizeDepartmentId(currentDepartmentId);
      return statsArray.filter(stats => stats.departmentId === normalizedCurrentDept);
    }
    
    return [];
  };

  // Get display name for department
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

  const departmentStats = calculateDepartmentStats();

  // Calculate overall statistics including all registered users
  // Use allUsers for overall stats to include users who haven't applied to any departments
  const calculateOverallStats = () => {
    const overallStats = {
      totalApplications: 0,
      submittedApplications: 0,
      nonSubmittedApplications: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
    };

    // Use allUsers if available (includes all registered users), otherwise fall back to applications
    const usersToCount = allUsers || applications;

    // Count each user only once, including those who haven't applied to any departments
    usersToCount.forEach(user => {
      overallStats.totalApplications++;

      // Check submission status - explicit check for true value only
      if (user.applicationSubmitted === true) {
        overallStats.submittedApplications++;
      } else {
        // Include users who haven't applied to any departments in "not submitted"
        overallStats.nonSubmittedApplications++;
      }

      // For overall status, use the general application status if present
      const status = user.status || 'pending';
      
      // First check if the user has any department with approved status
      let hasApproved = false;
      let hasRejected = false;
      
      // Check department-specific statuses
      if (user.departmentStatuses) {
        Object.values(user.departmentStatuses).forEach(deptStatus => {
          if (deptStatus.status === 'approved') {
            hasApproved = true;
          } else if (deptStatus.status === 'rejected') {
            hasRejected = true;
          }
        });
      }
      
      // Only classify into pending/approved/rejected for submitted applications
      if (user.applicationSubmitted === true) {
        // Prioritize department-specific status over overall status
        if (hasApproved) {
          overallStats.approvedApplications++;
        } else if (hasRejected) {
          overallStats.rejectedApplications++;
        } else {
          // Fall back to overall status if no department-specific status
          if (status === 'approved') {
            overallStats.approvedApplications++;
          } else if (status === 'rejected') {
            overallStats.rejectedApplications++;
          } else if (status === 'pending') {
            overallStats.pendingApplications++;
          }
        }
      }
    });

    return overallStats;
  };

  const totalStats = calculateOverallStats();

  // Validation and debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    const submissionMathCheck = totalStats.submittedApplications + totalStats.nonSubmittedApplications === totalStats.totalApplications;
    // Status counts now reflect only submitted applications
    const statusMathCheck = totalStats.pendingApplications + totalStats.approvedApplications + totalStats.rejectedApplications === totalStats.submittedApplications;
    const usersToCount = allUsers || applications;

    console.log('📊 Overall Statistics Validation:', {
      dataSource: allUsers ? 'allUsers (includes non-applicants)' : 'applications (applicants only)',
      totalUsers: usersToCount.length,
      totalApplications: totalStats.totalApplications,
      submittedApplications: totalStats.submittedApplications,
      nonSubmittedApplications: totalStats.nonSubmittedApplications,
      approvedApplications: totalStats.approvedApplications,  // Added for debugging
      rejectedApplications: totalStats.rejectedApplications,  // Added for debugging
      submissionMathCheck,
      statusMathCheck,
      submissionBreakdown: {
        submitted: totalStats.submittedApplications,
        notSubmitted: totalStats.nonSubmittedApplications,
        sum: totalStats.submittedApplications + totalStats.nonSubmittedApplications,
        total: totalStats.totalApplications
      },
      userBreakdown: {
        withDepartments: usersToCount.filter(u => u.departments && u.departments.length > 0).length,
        withoutDepartments: usersToCount.filter(u => !u.departments || u.departments.length === 0).length
      },
      // Added detailed status breakdown for debugging
      statusBreakdown: {
        pending: totalStats.pendingApplications,
        approved: totalStats.approvedApplications,
        rejected: totalStats.rejectedApplications,
        sum: totalStats.pendingApplications + totalStats.approvedApplications + totalStats.rejectedApplications,
        submittedTotal: totalStats.submittedApplications
      }
    });

    if (!submissionMathCheck) {
      console.error('❌ SUBMISSION MATH ERROR in Overall Statistics');
    }
    if (!statusMathCheck) {
      console.error('❌ STATUS MATH ERROR in Overall Statistics');
    }
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Development validation indicator */}
      {process.env.NODE_ENV === 'development' && isCoreTeam && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
          <strong>Debug:</strong> Overall Statistics ({allUsers ? 'All Users' : 'Applicants Only'}) -
          Submitted: {totalStats.submittedApplications},
          Not Submitted: {totalStats.nonSubmittedApplications},
          Total: {totalStats.totalApplications}
          {allUsers && (
            <span className="text-blue-600 ml-2">
              (Includes {(allUsers || []).filter(u => !u.departments || u.departments.length === 0).length} non-applicants)
            </span>
          )}
          {totalStats.submittedApplications + totalStats.nonSubmittedApplications === totalStats.totalApplications ?
            <span className="text-green-600 ml-2">✓ Math Check Passed</span> :
            <span className="text-red-600 ml-2">✗ Math Check Failed</span>
          }
        </div>
      )}

      {/* Overall Statistics */}
      {isCoreTeam && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-md">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="h-5 w-5" />
              Overall Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-2 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalStats.totalApplications}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Applications</div>
              </div>
              <div className="text-center p-2 border rounded-md bg-green-50 dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStats.submittedApplications}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
              </div>
              <div className="text-center p-2 border rounded-md bg-orange-50 dark:bg-orange-900/20">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalStats.nonSubmittedApplications}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Incomplete</div>
              </div>
              <div className="text-center p-2 border rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalStats.pendingApplications}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center p-2 border rounded-md bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-1" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalStats.approvedApplications}</div>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</div>
              </div>
              <div className="text-center p-2 border rounded-md bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-center mb-1">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-1" />
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalStats.rejectedApplications}</div>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Department Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStats.map((dept) => (
              <Card key={dept.departmentId} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Applications:</span>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-50" 
                           onClick={() => onFilterByDepartment(dept.departmentId)}>
                      {dept.totalApplications}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center hover:bg-green-50"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterBySubmission('submitted');
                      }}
                    >
                      <FileCheck className="h-4 w-4 text-green-600 mb-1" />
                      <span className="text-green-600 font-medium">{dept.submittedApplications}</span>
                      <span className="text-xs text-gray-500">Submitted</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-center justify-center hover:bg-orange-50"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterBySubmission('not-submitted');
                      }}
                    >
                      <FileText className="h-4 w-4 text-orange-600 mb-1" />
                      <span className="text-orange-600 font-medium">{dept.nonSubmittedApplications}</span>
                      <span className="text-xs text-gray-500">Incomplete</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 flex flex-col items-center hover:bg-yellow-50"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterByStatus('pending');
                      }}
                    >
                      <Clock className="h-3 w-3 text-yellow-600 mb-1" />
                      <span className="text-yellow-600 font-medium">{dept.pendingApplications}</span>
                      <span className="text-gray-500">Pending</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 flex flex-col items-center hover:bg-green-50 border border-green-200 dark:border-green-900"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterByStatus('approved');
                      }}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 mb-1" />
                      <span className="text-green-600 font-medium text-sm">{dept.approvedApplications}</span>
                      <span className="text-gray-500">Approved</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 flex flex-col items-center hover:bg-red-50 border border-red-200 dark:border-red-900"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterByStatus('rejected');
                      }}
                    >
                      <XCircle className="h-4 w-4 text-red-600 mb-1" />
                      <span className="text-red-600 font-medium text-sm">{dept.rejectedApplications}</span>
                      <span className="text-gray-500">Rejected</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
