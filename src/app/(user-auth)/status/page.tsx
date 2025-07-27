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
  
  // COMPLETE NAVIGATION LOCKDOWN - Multi-layered defense system
  useEffect(() => {
    // Only apply navigation restrictions if application is actually submitted
    if (!userData?.applicationSubmitted) {
      return;
    }

    let isLocked = true;
    let lockdownTimer: NodeJS.Timeout;

    // Layer 1: Aggressive history manipulation
    const floodHistory = () => {
      if (!isLocked) return;
      
      // Push multiple states aggressively
      for (let i = 0; i < 50; i++) {
        window.history.pushState(null, "", window.location.pathname);
      }
      
      // Keep flooding the history
      lockdownTimer = setTimeout(floodHistory, 100);
    };

    // Layer 2: Enhanced popstate prevention
    const preventNavigation = (e: PopStateEvent) => {
      if (!isLocked) return;
      
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Immediately flood history again
      setTimeout(() => {
        for (let i = 0; i < 20; i++) {
          window.history.pushState(null, "", window.location.pathname);
        }
      }, 0);
      
      toast.error("Navigation is completely blocked", {
        description: "Your application has been submitted - you cannot leave this page",
        duration: 3000,
        id: "navigation-blocked"
      });
    };

    // Layer 3: Override browser navigation methods
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const originalBack = window.history.back;
    const originalForward = window.history.forward;
    const originalGo = window.history.go;

    window.history.pushState = function(state, title, url) {
      if (!isLocked) return originalPushState.call(this, state, title, url);
      if (url && url !== window.location.pathname) {
        toast.error("Navigation blocked", { id: "nav-blocked" });
        return;
      }
      return originalPushState.call(this, state, title, url);
    };

    window.history.replaceState = function(state, title, url) {
      if (!isLocked) return originalReplaceState.call(this, state, title, url);
      if (url && url !== window.location.pathname) {
        toast.error("Navigation blocked", { id: "nav-blocked" });
        return;
      }
      return originalReplaceState.call(this, state, title, url);
    };

    window.history.back = function() {
      if (!isLocked) return originalBack.call(this);
      toast.error("Back navigation is disabled", { id: "back-blocked" });
    };

    window.history.forward = function() {
      if (!isLocked) return originalForward.call(this);
      toast.error("Forward navigation is disabled", { id: "forward-blocked" });
    };

    window.history.go = function(delta?: number) {
      if (!isLocked) return originalGo.call(this, delta);
      toast.error("Navigation is disabled", { id: "go-blocked" });
    };

    // Layer 4: Comprehensive event blocking with logout exceptions
    const blockAllNavigation = (e: Event) => {
      if (!isLocked) return;
      
      const target = e.target as HTMLElement;
      
      // Check if this is a logout-related interaction
      const isLogoutInteraction = target.closest('[data-logout="true"]') || 
                                 target.closest('[data-radix-popper-content-wrapper]') || // Dropdown content
                                 target.closest('[role="dialog"]') || // Dialog/modal
                                 target.closest('button[data-state]') || // Radix UI buttons
                                 target.closest('[data-radix-menu-content]') || // Menu content
                                 target.closest('.lucide-log-out') ||
                                 (target.textContent && target.textContent.toLowerCase().includes('log out')) ||
                                 target.closest('button')?.textContent?.toLowerCase().includes('log out');
      
      if (isLogoutInteraction) {
        // Allow logout interactions to proceed normally
        return;
      }
      
      // Only block navigation-related events, not UI interactions
      if (e.type === 'beforeunload') {
        const beforeUnloadEvent = e as BeforeUnloadEvent;
        beforeUnloadEvent.returnValue = "You cannot leave this page - your application has been submitted.";
        return "You cannot leave this page - your application has been submitted.";
      }
      
      // Don't block general click events that might be needed for UI
      if (e.type === 'click' || e.type === 'mousedown' || e.type === 'mouseup') {
        return;
      }
      
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      
      return false;
    };

    // Layer 5: Enhanced keyboard blocking
    const blockKeyboardNavigation = (e: KeyboardEvent) => {
      if (!isLocked) return;

      const blockedKeys = [
        'F5', 'F12', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown'
      ];

      const blockedCombos = [
        { ctrl: true, key: 'r' }, { meta: true, key: 'r' }, // Refresh
        { ctrl: true, key: 'w' }, { meta: true, key: 'w' }, // Close tab
        { ctrl: true, key: 't' }, { meta: true, key: 't' }, // New tab
        { ctrl: true, key: 'n' }, { meta: true, key: 'n' }, // New window
        { ctrl: true, key: 'l' }, { meta: true, key: 'l' }, // Address bar
        { ctrl: true, key: 'h' }, { meta: true, key: 'h' }, // History
        { ctrl: true, key: 'j' }, { meta: true, key: 'j' }, // Downloads
        { ctrl: true, key: 'u' }, { meta: true, key: 'u' }, // View source
        { alt: true, key: 'ArrowLeft' }, { alt: true, key: 'ArrowRight' }, // Alt+arrows
        { ctrl: true, key: 'Tab' }, { meta: true, key: 'Tab' }, // Switch tabs
        { ctrl: true, shift: true, key: 'Delete' }, // Clear data
      ];

      // Check for blocked single keys
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast.error(`${e.key} key is disabled`, { id: "key-blocked" });
        return false;
      }

      // Check for blocked combinations
      for (const combo of blockedCombos) {
        if ((combo.ctrl && e.ctrlKey) || (combo.meta && e.metaKey) || (combo.alt && e.altKey)) {
          if (combo.key === e.key || combo.shift === e.shiftKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            toast.error("Keyboard shortcut disabled", { id: "combo-blocked" });
            return false;
          }
        }
      }

      return true;
    };

    // Layer 6: Mouse/touch event blocking
    const blockMouseNavigation = (e: Event) => {
      if (!isLocked) return;

      const target = e.target as HTMLElement;
      
      // Allow logout functionality - check if click is on logout elements
      const isLogoutElement = target.closest('[data-logout="true"]') || 
                             target.closest('button[aria-label*="logout"]') ||
                             target.closest('button:has(svg[data-lucide="log-out"])') ||
                             target.textContent?.toLowerCase().includes('log out') ||
                             target.closest('[role="menuitem"]')?.textContent?.toLowerCase().includes('log out');
      
      if (isLogoutElement) {
        // Allow logout clicks to proceed
        return;
      }
      
      // Block all link clicks except external ones and logout
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a');
        const href = link?.getAttribute('href');
        
        if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
          // Allow external links but force new tab
          link?.setAttribute('target', '_blank');
          link?.setAttribute('rel', 'noopener noreferrer');
          return;
        } else if (href && !href.startsWith('#')) {
          // Block internal navigation
          e.preventDefault();
          e.stopImmediatePropagation();
          toast.error("Internal links are disabled", { id: "link-blocked" });
          return false;
        }
      }

      // Block context menu
      if (e.type === 'contextmenu') {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast.error("Right-click menu is disabled", { id: "context-blocked" });
        return false;
      }

      // Block drag operations that might navigate
      if (e.type.startsWith('drag')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Layer 7: Focus management
    const preventFocusNavigation = (e: FocusEvent) => {
      if (!isLocked) return;
      
      // Prevent focus on address bar or other browser UI
      if (!document.body.contains(e.target as Node)) {
        e.preventDefault();
        document.body.focus();
      }
    };

    // Start the lockdown
    floodHistory();
    
    // Add all event listeners with capture=true for maximum priority
    const targetedEvents = [
      'popstate', 'beforeunload', 'unload', 'pagehide'
    ];
    
    const uiEvents = [
      'keydown', 'keyup', 'keypress'
    ];

    // Add navigation blocking events
    targetedEvents.forEach(eventType => {
      window.addEventListener(eventType, preventNavigation as EventListener, true);
      window.addEventListener(eventType, blockAllNavigation as EventListener, true);
    });

    // Add keyboard blocking events
    uiEvents.forEach(eventType => {
      window.addEventListener(eventType, blockKeyboardNavigation as EventListener, true);
      document.addEventListener(eventType, blockKeyboardNavigation as EventListener, true);
    });

    // Add targeted mouse event blocking (only for specific navigation events)
    document.addEventListener('click', blockMouseNavigation as EventListener, true);
    document.addEventListener('contextmenu', blockMouseNavigation as EventListener, true);
    
    // Layer 8: Periodic history flooding and state monitoring
    const monitorAndMaintain = () => {
      if (!isLocked) return;
      
      // Continuously flood history
      for (let i = 0; i < 10; i++) {
        window.history.pushState(null, "", window.location.pathname);
      }
      
      // Ensure we're still on the right page
      if (window.location.pathname !== '/status') {
        window.location.replace('/status');
      }
      
      setTimeout(monitorAndMaintain, 50);
    };

    monitorAndMaintain();

    // Show lockdown warning
    toast.error("🔒 Page Locked - Application Submitted", {
      description: "All navigation has been disabled. You cannot leave this page.",
      duration: 8000,
      id: "page-locked-warning"
    });

    // Cleanup function
    return () => {
      isLocked = false;
      
      if (lockdownTimer) {
        clearTimeout(lockdownTimer);
      }
      
      // Remove all event listeners
      targetedEvents.forEach(eventType => {
        window.removeEventListener(eventType, preventNavigation as EventListener, true);
        window.removeEventListener(eventType, blockAllNavigation as EventListener, true);
      });
      
      uiEvents.forEach(eventType => {
        window.removeEventListener(eventType, blockKeyboardNavigation as EventListener, true);
        document.removeEventListener(eventType, blockKeyboardNavigation as EventListener, true);
      });
      
      document.removeEventListener('click', blockMouseNavigation as EventListener, true);
      document.removeEventListener('contextmenu', blockMouseNavigation as EventListener, true);
      
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.history.back = originalBack;
      window.history.forward = originalForward;
      window.history.go = originalGo;
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
        if (error.code === 'permission-denied') {
          toast.error("You don't have permission to access this application", {
            id: "status-permission-error"
          });
        } else if (error.code === 'not-found') {
          toast.error("Application not found. Please complete your application first", {
            id: "status-not-found-error"
          });
        } else {
          toast.error("Unable to load your application. Please try again", {
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