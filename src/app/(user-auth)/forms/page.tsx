"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import { ChevronLeft, ChevronRight, AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useApplicationStore } from "@/lib/store";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useAppSettings } from "@/components/AppSettingsProvider";
import UserNavbar from "@/components/ui/user-navbar";
import { Loading } from "@/components/ui/loading";
import { isBefore } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

// Import form components
import AiMlForm from "./components/AiMlForm";
import DevForm from "./components/DevForm";
import OpenSourceForm from "./components/OpenSourceForm";
import GameDevForm from "./components/GameDevForm";
import CybersecForm from "./components/CybersecForm";
import RoboticsForm from "./components/RoboticsForm";
import EventsForm from "./components/EventsForm";
import DesignForm from "./components/DesignForm";
import MarketingForm from "./components/MarketingForm";
import SocialMediaForm from "./components/SocialMediaForm";

// Department name mapping
const DEPARTMENT_NAMES: Record<string, string> = {
  'ai-ml': 'AI & ML',
  'dev': 'Development',
  'opensource': 'Open Source',
  'open-source': 'Open Source',
  'gamedev': 'Game Dev',
  'game-dev': 'Game Dev',
  'cybersec': 'Cybersecurity',
  'robotics': 'Robotics',
  'events': 'Management',
  'design': 'Design',
  'marketing': 'Marketing',
  'social-media': 'Social Media'
};

export default function FormsPage() {
  const router = useRouter();
  const { userData, user, loading } = useAuth();
  const { 
    applicationClosed, 
    applicationDeadline, 
    allowLateSubmissions, 
    isLoaded: areSettingsLoaded 
  } = useAppSettings();
  const { 
    departmentSelection,
    selectDepartment,
    deselectDepartment
  } = useApplicationStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [allFormsComplete, setAllFormsComplete] = useState(false);
  const [departmentsChanged, setDepartmentsChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  // Check auth state for forms page
  useEffect(() => {
    // If user is authenticated but userData is still loading, wait
    if (!loading && user && !userData) {
      // User is authenticated but userData not loaded yet
      return;
    }

    // If no departments selected, redirect to departments page
    if (!loading && user && (!userData?.departments || userData.departments.length === 0)) {
      // No departments selected, redirecting to /departments
      router.push("/departments");
      return;
    }

    // Set the first selected department as active tab
    if (!loading && userData?.departments && userData.departments.length > 0 && !activeTab) {
      // Setting active tab to: userData.departments[0]
      setActiveTab(userData.departments[0]);
    }

    // Check if all required forms are complete
    // This is a simplified check - in a real app, you'd check the actual form submission status
    // For this demo, we'll just set it to true
    setAllFormsComplete(true);
  }, [userData, loading, router, user, activeTab]);

  // Sync store with Firestore data if needed
  useEffect(() => {
    if (departmentsChanged && userData?.departments) {
      // Sync application store departments with Firestore data
      
      // Clear current selections
      departmentSelection.selectedDepartments.forEach(dept => {
        deselectDepartment(dept);
      });
      
      // Add departments from Firestore
      userData.departments.forEach(dept => {
        selectDepartment(dept);
      });
      
      // Reset the changed flag
      setDepartmentsChanged(false);
      
      // Show a notification
      toast.info("Department selections have been updated", { id: "dept-sync" });
    }
  }, [departmentsChanged, userData, departmentSelection.selectedDepartments, selectDepartment, deselectDepartment]);

  // Navigate to next department tab
  const goToNextDepartment = () => {
    if (!userData?.departments || userData.departments.length <= 1) return;
    
    const currentIndex = userData.departments.findIndex(dept => dept === activeTab);
    if (currentIndex < userData.departments.length - 1) {
      const nextDept = userData.departments[currentIndex + 1];
      setActiveTab(nextDept);
    }
  };

  // Check if the active department is the last one
  const isLastDepartment = () => {
    if (!userData?.departments || !activeTab) return false;
    const currentIndex = userData.departments.findIndex(dept => dept === activeTab);
    return currentIndex === userData.departments.length - 1;
  };

  // Form mapping based on department selection
  const formComponents: Record<string, React.ReactNode> = {
    'ai-ml': <AiMlForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'dev': <DevForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'open-source': <OpenSourceForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'opensource': <OpenSourceForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'game-dev': <GameDevForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'gamedev': <GameDevForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'cybersec': <CybersecForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'robotics': <RoboticsForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'events': <EventsForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'design': <DesignForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'marketing': <MarketingForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
    'social-media': <SocialMediaForm isLastDepartment={isLastDepartment()} onContinue={goToNextDepartment} />,
  };

  const handleBack = () => {
    // Navigate back to departments page
    // Use window.location.href for consistent navigation
    window.location.href = "/departments";
  };

  const handleReview = () => {
    router.push("/review");
  };

  const submitApplication = async () => {
    if (submitting || isSubmitted) return;
    setSubmitting(true);
    setIsSubmitted(true);

    try {
      // Application submitted successfully
      toast.success("Application submitted successfully");
    } catch (error) {
      // Handle error submitting application
      toast.error("Error submitting application");
    } finally {
      setSubmitting(false);
    }
  };

  const isApplicationComplete = () => {
    return allFormsComplete;
  };

  // If loading auth state, show loading spinner
  if (loading || !areSettingsLoaded) {
    return (
      <div className="min-h-[60vh]">
        <Loading 
          size="lg" 
          text="Loading application forms..." 
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
        <UserNavbar title="Application Forms" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="container max-w-2xl w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm shadow-xl rounded-2xl p-8 sm:p-12 my-8 z-10">
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

  return (
    <AuthCheck>
      <UserNavbar title="Application Forms" />
      <div className="container max-w-4xl mx-auto px-4 py-6">
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
          <h1 className="text-3xl font-bold mb-3">Application Forms</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Complete the application forms for your selected departments.
          </p>
        </div>

        {departmentsChanged && (
          <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md p-4 mb-6 text-center backdrop-blur-sm">
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              Your department selections have changed. Please make sure to fill out the forms for all selected departments.
            </p>
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mt-2 bg-amber-100/50 hover:bg-amber-200/50 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50"
            >
              Go Back to Review Departments
            </Button>
          </div>
        )}

        {userData?.departments && userData.departments.length > 0 ? (
          <>
            <Tabs value={activeTab || ""} className="w-full">
              <TabsList className="mb-8 w-full justify-center bg-gray-100/70 dark:bg-gray-800/70 p-1 rounded-xl backdrop-blur-sm">
                {userData.departments.map((dept) => (
                  <TabsTrigger 
                    key={dept} 
                    value={dept}
                    onClick={() => setActiveTab(dept)}
                    className="min-w-[120px] data-[state=active]:bg-white/70 dark:data-[state=active]:bg-gray-900/70 data-[state=active]:shadow-sm backdrop-blur-sm"
                  >
                    {DEPARTMENT_NAMES[dept] || dept}
                  </TabsTrigger>
                ))}
              </TabsList>

              {userData.departments.map((dept) => (
                <TabsContent key={dept} value={dept} className="mt-0">
                  {formComponents[dept]}
                </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md p-6 text-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800 dark:text-amber-400 font-medium mb-4">No departments selected</p>
            <p className="text-amber-700 dark:text-amber-300 mb-6">
              You need to select at least one department before you can proceed with the application process.
            </p>
            <Button onClick={handleBack} className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Select Departments
            </Button>
          </div>
        )}
      </div>
    </AuthCheck>
  );
} 