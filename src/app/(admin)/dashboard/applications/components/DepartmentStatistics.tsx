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
  createdAt: Date;
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
  isCoreTeam: boolean;
  currentDepartmentId?: string | null;
  onFilterByDepartment: (departmentId: string) => void;
  onFilterByStatus: (status: string | null) => void;
  onFilterBySubmission: (submission: string) => void;
}

export function DepartmentStatistics({
  applications,
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

      app.departments.forEach(deptId => {
        const normalizedDeptId = normalizeDepartmentId(deptId);
        const stats = departmentStatsMap.get(normalizedDeptId);

        if (!stats) {
          return;
        }

        stats.totalApplications++;

        // Check submission status
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

        switch (status) {
          case 'approved':
            stats.approvedApplications++;
            break;
          case 'rejected':
            stats.rejectedApplications++;
            break;
          default:
            stats.pendingApplications++;
            break;
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
  const totalStats = departmentStats.reduce((acc, dept) => ({
    totalApplications: acc.totalApplications + dept.totalApplications,
    submittedApplications: acc.submittedApplications + dept.submittedApplications,
    nonSubmittedApplications: acc.nonSubmittedApplications + dept.nonSubmittedApplications,
    pendingApplications: acc.pendingApplications + dept.pendingApplications,
    approvedApplications: acc.approvedApplications + dept.approvedApplications,
    rejectedApplications: acc.rejectedApplications + dept.rejectedApplications,
  }), {
    totalApplications: 0,
    submittedApplications: 0,
    nonSubmittedApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });

  return (
    <div className="space-y-6 mb-8">
      {/* Overall Statistics */}
      {isCoreTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalStats.totalApplications}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalStats.submittedApplications}</div>
                <div className="text-sm text-gray-600">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totalStats.nonSubmittedApplications}</div>
                <div className="text-sm text-gray-600">Incomplete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{totalStats.pendingApplications}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalStats.approvedApplications}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalStats.rejectedApplications}</div>
                <div className="text-sm text-gray-600">Rejected</div>
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
                      className="h-auto p-1 flex flex-col items-center hover:bg-green-50"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterByStatus('approved');
                      }}
                    >
                      <CheckCircle className="h-3 w-3 text-green-600 mb-1" />
                      <span className="text-green-600 font-medium">{dept.approvedApplications}</span>
                      <span className="text-gray-500">Approved</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 flex flex-col items-center hover:bg-red-50"
                      onClick={() => {
                        onFilterByDepartment(dept.departmentId);
                        onFilterByStatus('rejected');
                      }}
                    >
                      <XCircle className="h-3 w-3 text-red-600 mb-1" />
                      <span className="text-red-600 font-medium">{dept.rejectedApplications}</span>
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
