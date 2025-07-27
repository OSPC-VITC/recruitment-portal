"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ThemeToggle from "@/components/ui/theme-toggle";
import ParticlesBackground from "@/components/ParticlesBackground";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Sun, Moon } from "lucide-react";
import { isBefore } from "date-fns";

import { useAuth } from "@/lib/AuthContext";
import { useApplicationStore } from "@/lib/store";
import { saveDepartmentSelection } from "@/lib/firebaseHelpers";
import { DEPARTMENT_INFO } from "@/types";
import { useAppSettings } from "@/components/AppSettingsProvider";
import AuthCheck from "@/components/AuthCheck";
import { useTheme } from "@/components/ThemeProvider";
import UserNavbar from "@/components/ui/user-navbar";
import { Loading } from "@/components/ui/loading";

export default function DepartmentsPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  
  const { 
    departmentSelection, 
    selectDepartment, 
    deselectDepartment,
    resetDepartmentSelection
  } = useApplicationStore();
  
  const { selectedDepartments, maxSelections } = departmentSelection;

  const { applicationClosed, applicationDeadline, allowLateSubmissions, isLoaded: areSettingsLoaded } = useAppSettings();

  // Set cookie to track that user entered application workflow
  useEffect(() => {
    if (user && !loading) {
      document.cookie = "userInDashboard=true; path=/; max-age=31536000"; // 1 year
    }
  }, [user, loading]);

  // Prevent browser back navigation once in application workflow
  useEffect(() => {
    const preventNavigation = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.pathname);
    };

    // Push a new state so the first back button press doesn't exit the site
    window.history.pushState(null, "", window.location.pathname);
    
    window.addEventListener('popstate', preventNavigation);
    
    return () => {
      window.removeEventListener('popstate', preventNavigation);
    };
  }, []);

  // Load saved departments from user data
  useEffect(() => {
    // Check for saved departments

          // Only proceed if we have user data and departments
      if (userData?.departments && userData.departments.length > 0) {
        // Found saved departments in userData
      
      // Always clear current selections first to avoid stale state
      const departmentsToRemove = [...selectedDepartments];
      departmentsToRemove.forEach(dept => deselectDepartment(dept));
      
              // Then add saved departments
        userData.departments.forEach(dept => {
          // Select department from userData
          selectDepartment(dept);
        });
          } else {
        // No saved departments found in userData
        
        // If no departments in userData but we have selections in store,
        // clear those as they might be stale
        if (selectedDepartments.length > 0) {
          // Clear stale department selections
        selectedDepartments.forEach(dept => deselectDepartment(dept));
      }
    }
  }, [userData, selectDepartment, deselectDepartment]);

  // Handle department selection
  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    // Toggle department selection
    
          if (checked) {
        if (selectedDepartments.includes(departmentId)) {
          // Department already selected, skipping
          return;
        }
      
              if (selectedDepartments.length >= maxSelections) {
          // Maximum selections reached, cannot select more
          toast.error(`You can select a maximum of ${maxSelections} departments`, { id: "max-selections" });
          return;
        }
      
              // Select department
        selectDepartment(departmentId);
      toast.success(`Added ${DEPARTMENT_INFO.find(d => d.id === departmentId)?.name || departmentId} to your selection`, { id: `add-dept-${departmentId}` });
          } else {
        // Deselect department
        deselectDepartment(departmentId);
      toast.info(`Removed ${DEPARTMENT_INFO.find(d => d.id === departmentId)?.name || departmentId} from your selection`, { id: `remove-dept-${departmentId}` });
    }
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (!user) {
      toast.error("User not authenticated. Please log in again.", { id: "auth-error" });
      return;
    }
    
    if (selectedDepartments.length === 0) {
      toast.error("Please select at least one department to continue.", { id: "no-selection" });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Save departments
      
      // Save to Firestore
      const success = await saveDepartmentSelection(user.uid, selectedDepartments);
      
      if (success) {
        // Success message
        toast.success("Department selections saved!", { id: "dept-saved" });
        
        // Add a small delay to ensure database updates are processed
        setTimeout(() => {
          // Directly redirect to forms using window.location
          window.location.href = "/forms";
        }, 500);
      } else {
        throw new Error("Failed to save department selections");
      }
    } catch (error: any) {
      // Handle error saving departments
      setError("Failed to save department selection: " + (error.message || "Unknown error"));
      toast.error("Failed to save department selections", { id: "save-error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset selections function
  const handleResetSelections = () => {
    resetDepartmentSelection();
    toast.info("Department selections have been reset", { id: "reset-selections" });
  };

  // Check if applications are closed based on deadline and settings
  let isApplicationClosed = applicationClosed;
  
  // If applicationClosed is false, we still need to check if the deadline has passed
  if (!isApplicationClosed && applicationDeadline && typeof applicationDeadline === 'string' && applicationDeadline.trim() !== '') {
    const deadlineDate = new Date(applicationDeadline);
    const currentDate = new Date();
    const isDeadlinePassed = isBefore(deadlineDate, currentDate);
    
    // Applications are closed if deadline has passed and late submissions are not allowed
    isApplicationClosed = isDeadlinePassed && !allowLateSubmissions;
  }

  // If loading auth state or settings, show loading spinner
  if (loading || !areSettingsLoaded) {
    return (
      <div className="min-h-[60vh]">
        <Loading 
          size="lg" 
          text="Loading departments..." 
          fullscreen={false}
          className="py-12"
        />
      </div>
    );
  }

  // If applications are closed
  if (isApplicationClosed) {
    return (
      <AuthCheck>
        <div className="flex min-h-screen items-center justify-center bg-transparent">
          <div className="container max-w-2xl w-full bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm shadow-xl rounded-2xl p-8 sm:p-12 my-8 z-100">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <Link href="https://ospcvitc.club/" target="_blank" rel="noopener noreferrer">
                  <Image 
                    src="/images/ospc_logo.png" 
                    alt="OSPC Logo" 
                    width={48} 
                    height={48} 
                    className="rounded-lg shadow-md"
                  />
                </Link>
              </div>
              <h1 className="text-3xl font-bold mb-3">Applications Closed</h1>
              <div className="flex justify-center mb-6">
                <AlertCircle className="text-red-500 w-16 h-16" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
                The application period is currently closed. Thank you for your interest in OSPC. 
                Please check back later or follow our social media for announcements about the next recruitment cycle.
              </p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthCheck>
    );
  }

  // If there are no selections, disable continue button
  const isContinueDisabled = selectedDepartments.length === 0 || isSubmitting;

  return (
    <div className="min-h-screen font-mono relative bg-white text-black dark:bg-black dark:text-white">
      {/* Particles Background */}
      <ParticlesBackground />
      
      {/* User Navbar with Theme Toggle */}
      <UserNavbar title="Department Selection" />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pt-20">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Link href="https://ospcvitc.club/" target="_blank" rel="noopener noreferrer">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={48} 
                height={48} 
                className="rounded-lg shadow-md"
              />
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-3 font-mono">Select Your Departments</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-xl mx-auto font-mono text-sm">
            Select up to 2 departments you'd like to apply for. You'll need to complete an application form for each selected department.
          </p>
          <div className="mt-4 flex flex-col items-center">
            {selectedDepartments.length > 0 ? (
              <div className="flex flex-col items-center">
                <p className="text-black dark:text-white font-medium mb-2 font-mono">
                  Currently selected: {selectedDepartments.map(dept => 
                    DEPARTMENT_INFO.find(d => d.id === dept)?.name
                  ).join(", ")}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetSelections}
                  className="mt-1 font-mono border-black text-black dark:border-white dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors max-w-full overflow-hidden"
                >
                  <span className="truncate">Reset Selections</span>
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 font-medium font-mono">No departments selected yet</p>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6 border border-red-300 dark:border-red-800 flex items-center gap-3 font-mono backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="font-mono">{error}</span>
          </div>
        )}
        
        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {DEPARTMENT_INFO.map((department) => {
            const isSelected = selectedDepartments.includes(department.id);
            const isDisabled = !isSelected && selectedDepartments.length >= maxSelections;
            return (
              <Card
                key={department.id}
                className={`transition-all duration-200 backdrop-blur-sm bg-white/0 text-black border-black font-mono dark:bg-black/0 dark:text-white dark:border-white ${
                  isSelected 
                    ? "border-black shadow-lg bg-gray-100/20 dark:border-white dark:bg-gray-900/20" 
                    : ""
                } ${
                  isDisabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-400 cursor-pointer hover:bg-gray-50/20 dark:hover:bg-gray-800/20"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 font-mono">
                      {department.name}
                      {isSelected && (
                        <span className="text-xs bg-black/80 text-white dark:bg-white/80 dark:text-black px-2 py-1 rounded-full font-mono backdrop-blur-sm">
                          Selected
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={department.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          handleDepartmentToggle(department.id, checked === true);
                        }}
                        className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white h-5 w-5 border-black dark:border-white"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent 
                  onClick={() => {
                    if (!isDisabled) {
                      handleDepartmentToggle(department.id, !isSelected);
                    }
                  }}
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{department.description}</p>
                  <div className="mt-3">
                    {isSelected ? (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-xs font-mono max-w-full overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDepartmentToggle(department.id, false);
                        }}
                      >
                        <span className="truncate">Remove Selection</span>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-xs font-mono max-w-full overflow-hidden"
                        disabled={isDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDepartmentToggle(department.id, true);
                        }}
                      >
                        <span className="truncate">{isDisabled ? `Max ${maxSelections} Selections` : "Select Department"}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleContinue} 
            disabled={isContinueDisabled}
            className="px-8 py-6 font-mono border-2 border-black text-black bg-white hover:bg-black hover:text-white dark:border-white dark:text-white dark:bg-zinc-800 dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 max-w-full overflow-hidden"
            size="lg"
          >
            <span className="truncate">{isSubmitting ? "Saving..." : "Continue to Application Forms"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}