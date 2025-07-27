"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getApplication } from "@/lib/firebaseHelpers";
import { Application, TechApplication, DesignApplication, MarketingApplication, DEPARTMENTS, DepartmentStatus } from "@/types";
import AuthCheck from "@/components/AuthCheck";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import Link from "next/link";
import UserNavbar from "@/components/ui/user-navbar";
import { Loading } from "@/components/ui/loading";

// Simple badge component to avoid import issues
const StatusBadge = ({ 
  children, 
  className = ""
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
    {children}
  </span>
);

// Extend the Application interface to include isSubmitted
interface ExtendedApplication extends Application {
  isSubmitted?: boolean;
  [key: string]: any; // Add index signature to allow string indexing
}

// User data with extended properties
interface UserWithFeedback {
  id: string;
  name?: string;
  email?: string;
  regNo?: string;
  phone?: string;
  departments?: string[];
  status?: string;
  feedback?: string; 
  departmentStatuses?: Record<string, DepartmentStatus>;
  applicationSubmitted?: boolean;
  [key: string]: any;
}

export default function StatusPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { theme } = useTheme();
  // Type assertion for userData
  const typedUserData = userData as UserWithFeedback;
  const [application, setApplication] = useState<ExtendedApplication | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Simplified navigation lockdown system with proper error handling
  useEffect(() => {
    // Only apply navigation restrictions if application is actually submitted
    if (!userData?.applicationSubmitted) {
      return;
    }

    let isLocked = true;
    let lockdownActive = false;

    // Safe history manipulation with error handling
    const safeHistoryPush = () => {
      try {
        if (!isLocked || lockdownActive) return;
        lockdownActive = true;
        
        // Add a single history entry instead of flooding
        window.history.pushState(null, "", window.location.pathname);
        
        setTimeout(() => {
          lockdownActive = false;
        }, 100);
      } catch (error) {
        // Silently handle history API errors
        console.warn("History API error:", error);
      }
    };

    // Enhanced popstate prevention with error handling
    const preventNavigation = (e: PopStateEvent) => {
      try {
        if (!isLocked) return;
        
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Push state safely
        safeHistoryPush();
        
        // Show user-friendly message less frequently
        if (!document.querySelector('[data-sonner-toaster]')?.querySelector('[data-type="error"]')) {
          toast.error("Navigation blocked", {
            description: "Your application has been submitted",
            duration: 2000,
            id: "navigation-blocked"
          });
        }
      } catch (error) {
        console.warn("Navigation prevention error:", error);
      }
    };

    // Store original methods safely
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const originalBack = window.history.back;
    const originalForward = window.history.forward;
    const originalGo = window.history.go;

    // Override navigation methods with error handling
    try {
      window.history.pushState = function(state, title, url) {
        if (!isLocked) return originalPushState.call(this, state, title, url);
        if (url && url !== window.location.pathname) {
          return;
        }
        return originalPushState.call(this, state, title, url);
      };

      window.history.replaceState = function(state, title, url) {
        if (!isLocked) return originalReplaceState.call(this, state, title, url);
        if (url && url !== window.location.pathname) {
          return;
        }
        return originalReplaceState.call(this, state, title, url);
      };

      window.history.back = function() {
        if (!isLocked) return originalBack.call(this);
        // Silent prevention
      };

      window.history.forward = function() {
        if (!isLocked) return originalForward.call(this);
        // Silent prevention
      };

      window.history.go = function(delta?: number) {
        if (!isLocked) return originalGo.call(this, delta);
        // Silent prevention
      };
    } catch (error) {
      console.warn("Error overriding history methods:", error);
    }

    // Simplified event blocking
    const blockNavigation = (e: Event) => {
      try {
        if (!isLocked) return;
        
        const target = e.target as HTMLElement;
        
        // Allow logout functionality
        const isLogoutElement = target.closest('[data-logout="true"]') || 
                               target.closest('button')?.textContent?.toLowerCase().includes('log out') ||
                               target.closest('[role="menuitem"]')?.textContent?.toLowerCase().includes('log out');
        
        if (isLogoutElement) {
          return;
        }
        
        // Handle beforeunload
        if (e.type === 'beforeunload') {
          const beforeUnloadEvent = e as BeforeUnloadEvent;
          beforeUnloadEvent.returnValue = "Your application has been submitted.";
          return "Your application has been submitted.";
        }
        
        // Block navigation for links
        if (target.tagName === 'A' || target.closest('a')) {
          const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a');
          const href = link?.getAttribute('href');
          
          if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
            // Allow external links
            link?.setAttribute('target', '_blank');
            link?.setAttribute('rel', 'noopener noreferrer');
            return;
          } else if (href && !href.startsWith('#')) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }
      } catch (error) {
        console.warn("Event blocking error:", error);
      }
    };

    // Keyboard navigation blocking with error handling
    const blockKeyboard = (e: KeyboardEvent) => {
      try {
        if (!isLocked) return;

        const blockedKeys = ['F5', 'F12'];
        const blockedCombos = [
          { ctrl: true, key: 'r' },
          { meta: true, key: 'r' },
          { ctrl: true, key: 'w' },
          { meta: true, key: 'w' },
          { ctrl: true, key: 'l' },
          { meta: true, key: 'l' }
        ];

        if (blockedKeys.includes(e.key)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        for (const combo of blockedCombos) {
          if ((combo.ctrl && e.ctrlKey) || (combo.meta && e.metaKey)) {
            if (combo.key === e.key) {
              e.preventDefault();
              e.stopImmediatePropagation();
              return;
            }
          }
        }
      } catch (error) {
        console.warn("Keyboard blocking error:", error);
      }
    };

    // Add initial history state
    safeHistoryPush();
    
    // Add event listeners with error handling
    try {
      window.addEventListener('popstate', preventNavigation, true);
      window.addEventListener('beforeunload', blockNavigation, true);
      document.addEventListener('click', blockNavigation, true);
      document.addEventListener('keydown', blockKeyboard, true);
    } catch (error) {
      console.warn("Error adding event listeners:", error);
    }

    // Show a single notification
    toast.info("Page locked - Application submitted", {
      description: "Navigation has been restricted",
      duration: 3000,
      id: "page-locked"
    });

    // Cleanup function
    return () => {
      isLocked = false;
      
      try {
        // Remove event listeners
        window.removeEventListener('popstate', preventNavigation, true);
        window.removeEventListener('beforeunload', blockNavigation, true);
        document.removeEventListener('click', blockNavigation, true);
        document.removeEventListener('keydown', blockKeyboard, true);
        
        // Restore original methods
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        window.history.back = originalBack;
        window.history.forward = originalForward;
        window.history.go = originalGo;
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
    };
  }, [userData?.applicationSubmitted]);
  
  useEffect(() => {
    async function fetchApplication() {
      if (!user) return;
      
      try {
        const applicationData = await getApplication(user.uid);
        setApplication(applicationData);
      } catch (error: any) {
        console.error("Error fetching application:", error);
        
        // User-friendly error messages without exposing Firebase details
        if (error?.code === 'permission-denied') {
          toast.error("Unable to access application data", {
            id: "status-permission-error"
          });
        } else if (error?.code === 'not-found') {
          toast.error("Application not found", {
            id: "status-not-found-error"
          });
        } else {
          toast.error("Unable to load application data", {
            id: "status-fetch-error"
          });
        }
      } finally {
        setLoadingData(false);
      }
    }
    
    fetchApplication();
  }, [user]);
  
  // Department-specific statuses
  const departmentStatuses = typedUserData?.departmentStatuses || {};
  
  // Helper function to get department name from ID
  const getDepartmentName = (id: string) => {
    return DEPARTMENTS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
  };
  
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <StatusBadge className="bg-green-500 text-black font-medium">
            Approved
          </StatusBadge>
        );
      case "rejected":
        return (
          <StatusBadge className="bg-red-500 text-white">
            Rejected
          </StatusBadge>
        );
      default:
        return (
          <StatusBadge className="bg-amber-500 text-black font-medium">
            Pending
          </StatusBadge>
        );
    }
  };
  
  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };
  
  // Function to render dynamic fields from responses
  const renderDynamicFields = (deptId: string) => {
    if (!application) return null;
    
    const deptKey = formatDeptKey(deptId);
    const deptData = application[deptKey];
    
    if (!deptData || !deptData.dynamicFields) return null;
    
    return (
      <div className="space-y-5 mt-5">
        {Object.entries(deptData.dynamicFields).map(([fieldId, fieldData]) => {
          // Handle both string and object formats
          const label = fieldData && typeof fieldData === 'object' && 'label' in fieldData 
            ? fieldData.label as string 
            : 'Custom Question';
            
          const value = fieldData && typeof fieldData === 'object' && 'value' in fieldData
            ? fieldData.value as string
            : fieldData as string;
          
          return (
            <div key={fieldId} className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
              <h3 className="font-medium text-gray-700 dark:text-white mb-2">{label}</h3>
              <p className="text-gray-600 dark:text-gray-400">{value}</p>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Helper to format dept key
  const formatDeptKey = (deptId: string): string => {
    switch (deptId) {
      case "ai-ml": return "aiMl";
      case "open-source": return "openSource";
      case "game-dev": return "gameDev";
      case "social-media": return "socialMedia";
      default: return deptId;
    }
  };
  
  // Function to render tech application details
  const renderTechApplication = (techApp: TechApplication) => (
    <div className="space-y-5">
      {techApp.whyJoin && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Why do you want to join?</h3>
          <p className="text-gray-600 dark:text-gray-400">{techApp.whyJoin}</p>
        </div>
      )}
      {techApp.codingExperience && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Coding Experience</h3>
          <p className="text-gray-600 dark:text-gray-400">{techApp.codingExperience}</p>
        </div>
      )}
      {techApp.githubLink && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">GitHub Profile</h3>
          <a 
            href={techApp.githubLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-amber-400 hover:underline break-all"
          >
            {techApp.githubLink}
          </a>
        </div>
      )}
    </div>
  );
  
  // Function to render design application details
  const renderDesignApplication = (designApp: DesignApplication) => (
    <div className="space-y-5">
      {designApp.whyJoin && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Why do you want to join?</h3>
          <p className="text-gray-600 dark:text-gray-400">{designApp.whyJoin}</p>
        </div>
      )}
      {designApp.portfolioLink && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Portfolio Link</h3>
          <a 
            href={designApp.portfolioLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-amber-400 hover:underline break-all"
          >
            {designApp.portfolioLink}
          </a>
        </div>
      )}
      {designApp.tools && designApp.tools.length > 0 && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Design Tools</h3>
          <div className="flex flex-wrap gap-2">
            {designApp.tools.map((tool, index) => (
              <StatusBadge key={index} className="bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300">
                {tool}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // Function to render marketing application details
  const renderMarketingApplication = (marketingApp: MarketingApplication) => (
    <div className="space-y-5">
      {marketingApp.whyJoin && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Why do you want to join?</h3>
          <p className="text-gray-600 dark:text-gray-400">{marketingApp.whyJoin}</p>
        </div>
      )}
      {marketingApp.experience && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Marketing Experience</h3>
          <p className="text-gray-600 dark:text-gray-400">{marketingApp.experience}</p>
        </div>
      )}
      {marketingApp.socialMediaLinks && marketingApp.socialMediaLinks.length > 0 && (
        <div className="p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
          <h3 className="font-medium text-gray-700 dark:text-white mb-2">Social Media Profiles</h3>
          <div className="space-y-2">
            {marketingApp.socialMediaLinks.map((link, index) => (
              <a 
                key={index}
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-blue-600 dark:text-amber-400 hover:underline break-all"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // If loading auth state or application data, show loading spinner
  if (loading || loadingData) {
    return (
      <div className="min-h-[60vh]">
        <Loading 
          size="lg" 
          text="Loading your application status..." 
          fullscreen={false}
          className="py-12"
        />
      </div>
    );
  }
  
  return (
    <AuthCheck>
      <UserNavbar title="Application Status" />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm shadow-lg rounded-xl p-6 mb-8 z-100">
          <div className="flex flex-col items-center mb-6">
            <Link href="https://ospcvitc.club/" target="_blank" rel="noopener noreferrer" className="mb-3">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={48} 
                height={48} 
                className="rounded-lg shadow-md"
              />
            </Link>
            <h1 className="text-2xl font-bold mb-4">Application Status</h1>
          </div>
          
          {/* Departments Applied */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Departments Applied</h2>
            <div className="flex flex-wrap gap-2">
              {typedUserData?.departments?.map((dept) => (
                <div 
                  key={dept}
                  className="inline-flex items-center gap-1.5 bg-gray-100/30 dark:bg-zinc-800/30 px-2.5 py-1 rounded-md text-sm backdrop-blur-sm"
                >
                  {getStatusIcon(departmentStatuses[dept]?.status || "pending")}
                  <span>{getDepartmentName(dept)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Department status cards */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Department-specific Status</h2>
            
            {typedUserData?.departments?.map((dept) => {
              const deptStatus = departmentStatuses[dept] || { status: "pending" };
              const deptKey = formatDeptKey(dept);
              const deptData = application?.[deptKey];
              
              return (
                <Card key={dept} className="bg-white/0 dark:bg-zinc-800/0 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{getDepartmentName(dept)}</CardTitle>
                      {renderStatusBadge(deptStatus.status || "pending")}
                    </div>
                    <CardDescription>
                      <span>Application status will be updated here</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Department-specific feedback */}
                    {deptStatus.feedback && (
                      <div className="mb-4 bg-gray-50/30 dark:bg-zinc-700/20 p-4 rounded-md backdrop-blur-sm">
                        <h3 className="font-medium text-gray-700 dark:text-white mb-2">Feedback</h3>
                        <p className="text-gray-600 dark:text-gray-300">{deptStatus.feedback}</p>
                      </div>
                    )}
                    
                    {/* Show application details */}
                    {deptData && (
                      <div className="p-1">
                        <h3 className="font-medium text-gray-700 dark:text-white mb-3">Your Application</h3>
                        
                        {/* Render department-specific application data */}
                        {dept === "dev" || dept === "ai-ml" || dept === "open-source" || 
                         dept === "cybersec" || dept === "robotics" || dept === "game-dev" ? (
                          renderTechApplication(deptData as TechApplication)
                        ) : dept === "design" ? (
                          renderDesignApplication(deptData as DesignApplication)
                        ) : dept === "marketing" || dept === "social-media" || dept === "events" ? (
                          renderMarketingApplication(deptData as MarketingApplication)
                        ) : null}
                        
                        {/* Render dynamic fields */}
                        {renderDynamicFields(dept)}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    {deptStatus.status === "approved" && (
                      <Button variant="outline" size="sm" className="w-full max-w-full overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-500" />
                        <span className="truncate">Congratulations! You've been selected</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AuthCheck>
  );
}