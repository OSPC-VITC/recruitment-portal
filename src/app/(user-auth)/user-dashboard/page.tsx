"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getUserDocument } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import UserNavbar from "@/components/ui/user-navbar";
import { Loading } from "@/components/ui/loading";
import { Calendar, Clock, InfoIcon } from "lucide-react";
import { format, formatDistanceToNow, isBefore, parseISO } from "date-fns";
import { useAppSettings } from "@/components/AppSettingsProvider";

export default function UserDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { 
    applicationDeadline, 
    allowLateSubmissions,
    applicationClosed,
    isLoaded: areSettingsLoaded 
  } = useAppSettings();

  // Set cookie to track that user entered dashboard
  useEffect(() => {
    if (user && !loading) {
      document.cookie = "userInDashboard=true; path=/; max-age=31536000"; // 1 year
    }
  }, [user, loading]);

  // Check if user has submitted application
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getUserDocument();
        
        if (userDoc?.applicationSubmitted) {
          // Set the cookie for application submitted
          document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
          router.push("/status");
        }
      } catch (error) {
        // Handle error checking application status
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkApplicationStatus();
  }, [user, router]);

  // Prevent browser back navigation
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

  // Calculate if deadline has passed
  let isDeadlinePassed = false;
  
  useEffect(() => {
    if (areSettingsLoaded) {
      // Settings loaded for user dashboard
    }
  }, [areSettingsLoaded, applicationDeadline, allowLateSubmissions, applicationClosed]);

  // Navigate to departments function
  const navigateToDepartments = () => {
    router.push("/departments");
  };
  
  if (applicationDeadline && typeof applicationDeadline === 'string' && applicationDeadline.trim() !== '') {
    try {
      // Ensure we're working with a valid date format (YYYY-MM-DD)
      const deadlineDate = parseISO(applicationDeadline);
      const currentDate = new Date();
      
      // Date comparison for deadline
      
      isDeadlinePassed = isBefore(deadlineDate, currentDate);
    } catch (error) {
      // Handle error parsing deadline date
    }
  }
  
  // Check if applications are manually closed regardless of deadline
  const isApplicationClosed = applicationClosed || (isDeadlinePassed && !allowLateSubmissions);
  
  // Format the deadline display
  const formattedDeadline = applicationDeadline && typeof applicationDeadline === 'string' && applicationDeadline.trim() !== '' ? 
    format(parseISO(applicationDeadline), "MMMM d, yyyy") : 
    "Not set";
  
  // Calculate time remaining
  const timeRemaining = applicationDeadline && typeof applicationDeadline === 'string' && applicationDeadline.trim() !== '' ?
    formatDistanceToNow(parseISO(applicationDeadline), { addSuffix: true }) :
    "Unknown";

  // If loading auth state or application data, show loading spinner
  if (loading || checkingStatus || !areSettingsLoaded) {
    return (
      <div className="min-h-[60vh]">
        <Loading 
          size="lg" 
          text="Loading dashboard..." 
          fullscreen={false}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <>
      <UserNavbar title="User Dashboard" />
      <div className="container mx-auto px-4 py-8 pt-20 flex flex-col items-center justify-center min-h-[80vh] relative z-100">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <Link href="https://ospcvitc.club/" target="_blank" rel="noopener noreferrer">
            <Image 
              src="/images/ospc_logo.png" 
              alt="OSPC Logo" 
              width={60} 
              height={60} 
              className="rounded-lg shadow-md"
            />
          </Link>
          <h1 className="text-3xl font-bold">Welcome to OSPC</h1>
        </div>
        <p className="mb-6 text-lg text-center max-w-2xl">You're logged in and ready to start your application process.</p>
        
        {/* Application Deadline Information */}
        <div className="w-full max-w-md mb-6">
          <div className={`p-4 border rounded-lg mb-6 flex items-center ${
            isDeadlinePassed 
              ? "bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900" 
              : "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
          }`}>
            <Calendar className={`h-5 w-5 mr-3 ${
              isDeadlinePassed 
                ? "text-red-500 dark:text-red-400" 
                : "text-blue-500 dark:text-blue-400"
            }`} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {isDeadlinePassed ? "Application Deadline Passed" : "Application Deadline"}
              </h3>
              <p className={`text-sm ${
                isDeadlinePassed 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-blue-600 dark:text-blue-400"
              }`}>
                {formattedDeadline}
              </p>
            </div>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              isDeadlinePassed
                ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300"
                : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
            }`}>
              <Clock className="h-3 w-3" />
              <span>{isDeadlinePassed ? "Closed" : timeRemaining}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 w-full max-w-md">
          <div className="p-8 border rounded-lg shadow-sm bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm text-center">
            <h2 className="text-xl font-semibold mb-4">Begin Your Application</h2>
            <p className="mb-6">Start by selecting departments you're interested in joining.</p>
            <Button 
              onClick={navigateToDepartments} 
              className="font-medium px-6 py-2"
              disabled={isApplicationClosed}
            >
              Start Application
            </Button>
            
            {isApplicationClosed && (
              <div className="mt-4 p-3 text-sm rounded bg-red-50/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
                <InfoIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                Applications are currently closed as the deadline has passed.
              </div>
            )}
            
            {isDeadlinePassed && allowLateSubmissions && !applicationClosed && (
              <div className="mt-4 p-3 text-sm rounded bg-amber-50/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center">
                <InfoIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                The deadline has passed but late submissions are still being accepted.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}