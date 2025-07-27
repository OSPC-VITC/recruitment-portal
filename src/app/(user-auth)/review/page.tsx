"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import UserNavbar from "@/components/ui/user-navbar";

import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import AuthCheck from "@/components/AuthCheck";
import { useApplicationStore } from "@/lib/store";
import { Loading } from "@/components/ui/loading";

// Enhanced StatusBadge component with better dark theme support
const StatusBadge = ({ 
  children, 
  className = "",
  variant = "default" 
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: "default" | "success" | "destructive" | "outline";
}) => {
  let variantClasses = "";
  
  switch (variant) {
    case "success":
      variantClasses = "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30";
      break;
    case "destructive":
      variantClasses = "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30";
      break;
    case "outline":
      variantClasses = "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600/30";
      break;
    default:
      variantClasses = "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/30";
      break;
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

// Maps department IDs to display names
const DEPARTMENT_NAMES: Record<string, string> = {
  "ai-ml": "AI & ML",
  "dev": "Development",
  "open-source": "Open Source",
  "game-dev": "Game Development",
  "cybersec": "Cybersecurity",
  "robotics": "Robotics & IoT",
  "events": "Events",
  "design": "Design",
  "marketing": "Marketing",
  "social-media": "Social Media"
};

export default function ReviewPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Get application data from store
  const { applicationData, resetApplicationData } = useApplicationStore();
  
  useEffect(() => {
    async function loadApplication() {
      if (!user) return;
      
      try {
        // First check if we have data in the store
        if (Object.keys(applicationData).length > 0) {
          // Application data from store
          setApplication(applicationData);
          
          // Check if the application in store is marked as submitted
          if ('submittedAt' in applicationData) {
            setIsSubmitted(true);
            // Set the applicationSubmitted cookie if application is submitted
            document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
          }
          
          setLoading(false);
          return;
        }
        
        // Otherwise load from Firebase
        const docRef = doc(db, "applications", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setApplication(data);
          const submitted = data.submittedAt ? true : false;
          setIsSubmitted(submitted);
          
          // Set the applicationSubmitted cookie if application is submitted
          if (submitted) {
            document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
          }
        } else {
          // No application data exists yet
          setApplication({});
        }
      } catch (error) {
        // Handle error loading application
        toast.error("Could not load your application data", { id: "review-load-error" });
      } finally {
        setLoading(false);
      }
    }
    
    loadApplication();
  }, [user, applicationData]);
  
  // Check if the application is complete
  const getUserDepartments = () => {
    if (!userData || !userData.departments) return [];
    return userData.departments;
  };
  
  const getCompletedDepartments = () => {
    if (!application) return [];
    
    const departments = getUserDepartments();
    return departments.filter(dept => {
      // Check if this department's form has been completed
      return application[formatDeptKey(dept)] !== undefined;
    });
  };
  
  // Format department key for the application object
  const formatDeptKey = (deptId: string) => {
    switch (deptId) {
      case "ai-ml": return "aiMl";
      case "open-source": return "openSource";
      case "game-dev": return "gameDev";
      case "social-media": return "socialMedia";
      default: return deptId;
    }
  };
  
  const isApplicationComplete = () => {
    const departments = getUserDepartments();
    const completed = getCompletedDepartments();
    return departments.length > 0 && completed.length === departments.length;
  };

  const getPercentageComplete = () => {
    const departments = getUserDepartments();
    const completed = getCompletedDepartments();
    return departments.length > 0 
      ? Math.round((completed.length / departments.length) * 100) 
      : 0;
  };
  
  const submitApplication = async () => {
    if (!user) return;
    
    setSubmitting(true);
    
    try {
      // Collect all form data from store
      const submissionData = { ...applicationData };
      
      // Add submission metadata
      submissionData.submittedAt = new Date();
      submissionData.userId = user.uid;
      
      // Submit application data
      const docRef = doc(db, "applications", user.uid);
      await setDoc(docRef, submissionData);
      
      // Update user document to mark application as submitted
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        applicationSubmitted: true,
        applicationSubmittedAt: new Date()
      });
      
      // Set application submitted cookie
      document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
      
      // Update local state
      setIsSubmitted(true);
      setShowSuccessMessage(true);
      
      // Reset store data after successful submission
      resetApplicationData();
      
      toast.success("Your application has been submitted!", { id: "application-submitted" });
      
      // Redirect to status page after a short delay
      setTimeout(() => {
        router.push('/status');
      }, 1500);
    } catch (error) {
      // Handle error submitting application
      toast.error("Failed to submit your application. Please try again.", { id: "submit-error" });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate a status badge for a department
  const DepartmentStatus = ({ deptId }: { deptId: string }) => {
    const isComplete = application && application[formatDeptKey(deptId)];
    
    if (isComplete) {
      return <StatusBadge variant="success" className="flex gap-1.5 items-center"><CheckCircle className="w-3 h-3" /> Complete</StatusBadge>;
    }
    
    return <StatusBadge variant="outline" className="flex gap-1.5 items-center"><AlertTriangle className="w-3 h-3" /> Incomplete</StatusBadge>;
  };
  
  const handleEditForm = () => {
    // Redirect to the forms page
    router.push("/forms");
  };
  
  // Add this function to format a department's data for display
  interface FormField {
    name: string;
    value: string;
  }
  
  const formatDepartmentData = (deptId: string, data: any): FormField[] => {
    if (!data) return [];

    const key = formatDeptKey(deptId);
    const deptData = data[key];
    
    if (!deptData) return [];
    
    // Convert the department data to display fields
    const displayFields: FormField[] = [];
    
    for (const [fieldKey, fieldValue] of Object.entries(deptData)) {
      // Skip empty values and handle dynamicFields separately
      if (!fieldValue || fieldKey === 'dynamicFields') continue;
      
      // Format field name for display (camelCase to Title Case)
      const displayName = fieldKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      let displayValue = fieldValue;
      
      // Format array values (like project links)
      if (Array.isArray(fieldValue)) {
        displayValue = fieldValue.join(', ');
      }
      
      displayFields.push({
        name: displayName,
        value: displayValue as string
      });
    }
    
    // Handle dynamic fields separately to add them to the display
    if (deptData.dynamicFields && typeof deptData.dynamicFields === 'object') {
      for (const [fieldId, fieldData] of Object.entries(deptData.dynamicFields)) {
        if (!fieldData) continue;
        
        // Check if the field data is in the new format (with value and label)
        if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData && 'label' in fieldData) {
          const typedFieldData = fieldData as { value: string; label: string };
          displayFields.push({
            name: typedFieldData.label,
            value: typedFieldData.value
          });
        } else {
          // Fallback for old format
          // Try to get the field label from the fieldId
          const fieldParts = fieldId.split('_');
          let displayName = fieldParts.length > 1 
            ? fieldParts[0].charAt(0).toUpperCase() + fieldParts[0].slice(1) + ' Question'
            : 'Custom Question';
          
          displayFields.push({
            name: displayName,
            value: String(fieldData)
          });
        }
      }
    }
    
    return displayFields;
  };
  
  if (isSubmitted) {
    return (
      <AuthCheck>
        <UserNavbar title="Application Review" />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm shadow-lg rounded-xl p-6 mb-8 z-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
              <h1 className="text-2xl font-bold">Review Your Application</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditForm}
                className="flex items-center gap-1.5 w-full sm:w-auto max-w-full overflow-hidden whitespace-nowrap"
              >
                <Edit className="w-3.5 h-3.5 flex-shrink-0" /> 
                <span className="truncate">Edit Forms</span>
              </Button>
            </div>
            
            {/* Progress Card */}
            <Card className="mb-8 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Application Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-foreground">
                      Completion: {getPercentageComplete()}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getCompletedDepartments().length}/{getUserDepartments().length} departments completed
                    </div>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-3 backdrop-blur-sm">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getPercentageComplete()}%` }}
                    />
                  </div>
                </div>
                
                {/* Department Status */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Department Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {getUserDepartments().map((dept) => (
                      <div key={dept} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2.5 border border-border/50 backdrop-blur-sm">
                        <span className="text-sm font-medium text-foreground">{DEPARTMENT_NAMES[dept] || dept}</span>
                        <DepartmentStatus deptId={dept} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {!isApplicationComplete() && (
                  <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    You need to complete all department forms before submitting
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Department Selection Card */}
            <Card className="mb-8 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <CardTitle className="text-xl font-semibold text-foreground">Department Selection</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/departments')}
                    className="flex items-center gap-2 w-full sm:w-auto max-w-full overflow-hidden whitespace-nowrap"
                  >
                    <Edit className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Edit Selection</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {userData?.departments?.map((dept) => (
                    <StatusBadge key={dept} className="bg-primary/10 text-primary dark:bg-primary/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                      {DEPARTMENT_NAMES[dept] || dept}
                    </StatusBadge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Application Forms */}
            {getUserDepartments().length > 0 ? (
              <div className="space-y-6 mb-8">
                {getUserDepartments().map((dept) => {
                  const formData = formatDepartmentData(dept, application);
                  const isComplete = application && application[formatDeptKey(dept)];
                  
                  return (
                    <Card key={dept} className={`transition-all duration-200 ${
                      isComplete 
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-900/5 backdrop-blur-sm" 
                        : "border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-900/5 backdrop-blur-sm"
                    }`}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
                            {DEPARTMENT_NAMES[dept] || dept}
                            <DepartmentStatus deptId={dept} />
                          </CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleEditForm}
                            className="flex items-center gap-2 w-full sm:w-auto max-w-full overflow-hidden"
                          >
                            <Edit className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Edit Form</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!isComplete ? (
                          <div className="text-center py-8">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-2">Form Incomplete</h3>
                            <p className="text-amber-600 dark:text-amber-400">
                              Please complete this form before submitting your application.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formData.map((field, i) => (
                              <div key={i} className="space-y-2 p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
                                <h4 className="text-sm font-semibold text-foreground">{field.name}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{field.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-300 mb-3">No Departments Selected</h3>
                  <p className="text-amber-600 dark:text-amber-400 mb-6 max-w-md mx-auto">
                    You haven't selected any departments yet. Please select departments to apply for before proceeding.
                  </p>
                  <Button 
                    onClick={() => router.push("/departments")}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Select Departments
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bottom Actions */}
            <Card className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="py-6 px-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push("/forms")}
                    className="flex items-center gap-2 w-full sm:w-auto min-w-[100px] max-w-full overflow-hidden"
                  >
                    <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Back to Forms</span>
                  </Button>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {!isApplicationComplete() && (
                      <p className="text-amber-600 dark:text-amber-400 text-sm font-medium text-center w-full sm:w-auto">
                        Complete all forms before final submission
                      </p>
                    )}
                    <Button 
                      onClick={submitApplication}
                      disabled={!isApplicationComplete() || submitting || isSubmitted}
                      className="min-w-[200px] w-full sm:w-auto max-w-full overflow-hidden text-ellipsis"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Submitting...</span>
                        </>
                      ) : isSubmitted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Already Submitted</span>
                        </>
                      ) : (
                        <>
                          <span className="truncate">Submit Application</span>
                          <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthCheck>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh]">
        <Loading 
          size="lg" 
          text="Loading your application data..." 
          fullscreen={false}
          className="py-12"
        />
      </div>
    );
  }
  
  return (
    <AuthCheck>
      <UserNavbar title="Application Review" />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm shadow-lg rounded-xl p-6 mb-8 z-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold">Review Your Application</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditForm}
              className="flex items-center gap-1.5 w-full sm:w-auto max-w-full overflow-hidden whitespace-nowrap"
            >
              <Edit className="w-3.5 h-3.5 flex-shrink-0" /> 
              <span className="truncate">Edit Forms</span>
            </Button>
          </div>
            
            {/* Progress Card */}
            <Card className="mb-8 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Application Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-foreground">
                      Completion: {getPercentageComplete()}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getCompletedDepartments().length}/{getUserDepartments().length} departments completed
                    </div>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-3 backdrop-blur-sm">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getPercentageComplete()}%` }}
                    />
                  </div>
                </div>
                
                {/* Department Status */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Department Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {getUserDepartments().map((dept) => (
                      <div key={dept} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2.5 border border-border/50 backdrop-blur-sm">
                        <span className="text-sm font-medium text-foreground">{DEPARTMENT_NAMES[dept] || dept}</span>
                        <DepartmentStatus deptId={dept} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {!isApplicationComplete() && (
                  <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    You need to complete all department forms before submitting
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Department Selection Card */}
            <Card className="mb-8 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <CardTitle className="text-xl font-semibold text-foreground">Department Selection</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/departments')}
                    className="flex items-center gap-2 w-full sm:w-auto max-w-full overflow-hidden whitespace-nowrap"
                  >
                    <Edit className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Edit Selection</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {userData?.departments?.map((dept) => (
                    <StatusBadge key={dept} className="bg-primary/10 text-primary dark:bg-primary/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                      {DEPARTMENT_NAMES[dept] || dept}
                    </StatusBadge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Application Forms */}
            {getUserDepartments().length > 0 ? (
              <div className="space-y-6 mb-8">
                {getUserDepartments().map((dept) => {
                  const formData = formatDepartmentData(dept, application);
                  const isComplete = application && application[formatDeptKey(dept)];
                  
                  return (
                    <Card key={dept} className={`transition-all duration-200 ${
                      isComplete 
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-900/5 backdrop-blur-sm" 
                        : "border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-900/5 backdrop-blur-sm"
                    }`}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
                            {DEPARTMENT_NAMES[dept] || dept}
                            <DepartmentStatus deptId={dept} />
                          </CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleEditForm}
                            className="flex items-center gap-2 w-full sm:w-auto max-w-full overflow-hidden"
                          >
                            <Edit className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Edit Form</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!isComplete ? (
                          <div className="text-center py-8">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-2">Form Incomplete</h3>
                            <p className="text-amber-600 dark:text-amber-400">
                              Please complete this form before submitting your application.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formData.map((field, i) => (
                              <div key={i} className="space-y-2 p-3 bg-white/10 dark:bg-zinc-800/10 rounded-md backdrop-blur-sm">
                                <h4 className="text-sm font-semibold text-foreground">{field.name}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{field.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-300 mb-3">No Departments Selected</h3>
                  <p className="text-amber-600 dark:text-amber-400 mb-6 max-w-md mx-auto">
                    You haven't selected any departments yet. Please select departments to apply for before proceeding.
                  </p>
                  <Button 
                    onClick={() => router.push("/departments")}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Select Departments
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bottom Actions */}
            <Card className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="py-6 px-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push("/forms")}
                    className="flex items-center gap-2 w-full sm:w-auto min-w-[100px] max-w-full overflow-hidden"
                  >
                    <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Back to Forms</span>
                  </Button>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {!isApplicationComplete() && (
                      <p className="text-amber-600 dark:text-amber-400 text-sm font-medium text-center w-full sm:w-auto">
                        Complete all forms before final submission
                      </p>
                    )}
                    <Button 
                      onClick={submitApplication}
                      disabled={!isApplicationComplete() || submitting || isSubmitted}
                      className="min-w-[200px] w-full sm:w-auto max-w-full overflow-hidden text-ellipsis"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Submitting...</span>
                        </>
                      ) : isSubmitted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Already Submitted</span>
                        </>
                      ) : (
                        <>
                          <span className="truncate">Submit Application</span>
                          <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthCheck>
  );
}