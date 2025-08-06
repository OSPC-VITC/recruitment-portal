"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Mail, 
  Phone,
  Save,
  FileText,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { DEPARTMENTS, User as UserType, ApplicationStatus, DepartmentStatus } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { departmentToFirestoreId } from "@/lib/adminConfig";

// Status badge component for this page
function ApplicationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex gap-1 items-center">
          <CheckCircle className="h-3 w-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 flex gap-1 items-center">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex gap-1 items-center">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
  }
}

// Define types for the application data
interface ApplicationData {
  id: string;
  userId: string;
  department: string;
  responses: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// User data extended from UserType
interface ExtendedUserData extends Omit<UserType, 'departments' | 'status'> {
  departments?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  departmentStatuses?: Record<string, DepartmentStatus>;
  feedback?: string;
  [key: string]: unknown;
}

// Form field type
interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  departmentId: string;
  order?: number;
  [key: string]: unknown;
}

export default function ApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isCoreTeam, department } = useAdminAuth();
  const departmentId = department ? departmentToFirestoreId[department] : null;
  
  const [userData, setUserData] = useState<ExtendedUserData | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  const [formFields, setFormFields] = useState<Record<string, FormField[]>>({});
  const [activeTab, setActiveTab] = useState("");
  
  // Department-specific statuses
  const [departmentStatuses, setDepartmentStatuses] = useState<Record<string, DepartmentStatus>>({});
  const [currentDepartmentStatus, setCurrentDepartmentStatus] = useState<ApplicationStatus>("pending");
  const [currentDepartmentFeedback, setCurrentDepartmentFeedback] = useState("");
  
  // Fetch application data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, "users", id));
        if (!userDoc.exists()) {
          toast.error("Application not found", { id: "admin-app-not-found" });
          router.push("/dashboard/applications");
          return;
        }
        
        const userData: ExtendedUserData = {
          id: userDoc.id,
          ...userDoc.data()
        } as ExtendedUserData;
        
        // Check if department lead has access to this application
        if (!isCoreTeam && departmentId) {
          const userDepartments = userData.departments || [];
          if (!userDepartments.includes(departmentId)) {
            setUnauthorized(true);
            setLoading(false);
            return;
          }
        }
        
        setUserData(userData);
        
        // Initialize department statuses
        const initialDeptStatuses = userData.departmentStatuses || {};
        setDepartmentStatuses(initialDeptStatuses);
        
        // Get application data
        const applicationQuery = query(
          collection(db, "applications"),
          where("userId", "==", id)
        );
        
        const appSnapshot = await getDocs(applicationQuery);
        if (!appSnapshot.empty) {
          const appData: ApplicationData = {
            id: appSnapshot.docs[0].id,
            ...appSnapshot.docs[0].data()
          } as ApplicationData;
          setApplicationData(appData);
          
          // console.log("Application data loaded:", appData);
        } else {
          // console.log("No application data found for user:", id);
        }
        
        // Set active tab based on user role
        if (userData.departments && userData.departments.length > 0) {
          let firstDept;
          
          // For department leads, set active tab to their department
          if (!isCoreTeam && departmentId && userData.departments.includes(departmentId)) {
            firstDept = departmentId;
          } else {
            // For core team, use the first department
            firstDept = userData.departments[0];
          }
          
          setActiveTab(firstDept);
          
          // Set current department status
          if (initialDeptStatuses[firstDept]) {
            setCurrentDepartmentStatus(initialDeptStatuses[firstDept].status);
            setCurrentDepartmentFeedback(initialDeptStatuses[firstDept].feedback || "");
          } else {
            setCurrentDepartmentStatus("pending");
            setCurrentDepartmentFeedback("");
          }
        }
        
        // Fetch form fields for each department
        if (userData.departments && userData.departments.length > 0) {
          // Filter departments based on user role
          const departmentsToFetch = !isCoreTeam && departmentId 
            ? userData.departments.filter(deptId => deptId === departmentId)
            : userData.departments;
          
          const departmentFieldsPromises = departmentsToFetch.map(async (deptId: string) => {
            const fieldQuery = query(
              collection(db, "formFields"),
              where("departmentId", "==", deptId)
            );
            
            const fieldsSnapshot = await getDocs(fieldQuery);
            return {
              departmentId: deptId,
              fields: fieldsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
            };
          });
          
          const departmentFields = await Promise.all(departmentFieldsPromises);
          const formFieldsObject: Record<string, FormField[]> = {};
          
          departmentFields.forEach(({ departmentId, fields }) => {
            formFieldsObject[departmentId] = fields as FormField[];
          });
          
          setFormFields(formFieldsObject);
        }
      } catch (error) {
        console.error("Error fetching application data:", error);
        toast.error("Unable to load application data", { id: "admin-app-load-error" });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id, router, isCoreTeam, departmentId]);
  
  // Handle department-specific status update
  const updateDepartmentStatus = async () => {
    if (!userData || !activeTab) return;
    
    setSaving(true);
    try {
      // Create updated department statuses
      const updatedDeptStatuses = {
        ...departmentStatuses,
        [activeTab]: {
          status: currentDepartmentStatus,
          feedback: currentDepartmentFeedback,
          updatedAt: new Date()
        }
      };
      
      // Update in Firestore
      await updateDoc(doc(db, "users", id), {
        departmentStatuses: updatedDeptStatuses
      });
      
      toast.success(`${getDepartmentName(activeTab)} status updated`, { id: `admin-dept-${activeTab}-update` });
      
      // Update local state
      setDepartmentStatuses(updatedDeptStatuses);
    } catch (error) {
      console.error("Error updating department status:", error);
      toast.error("Failed to update department status");
    } finally {
      setSaving(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (deptId: string) => {
    setActiveTab(deptId);
    
    // Update current department status and feedback based on the selected tab
    if (departmentStatuses[deptId]) {
      setCurrentDepartmentStatus(departmentStatuses[deptId].status);
      setCurrentDepartmentFeedback(departmentStatuses[deptId].feedback || "");
    } else {
      setCurrentDepartmentStatus("pending");
      setCurrentDepartmentFeedback("");
    }
  };
  
  // Get department data from application
  const getDepartmentData = (deptId: string) => {
    if (!applicationData) return null;
    
    // Convert department ID to the format used in the application data
    let deptKey;
    switch (deptId) {
      case "ai-ml": deptKey = "aiMl"; break;
      case "open-source": deptKey = "openSource"; break;
      case "game-dev": deptKey = "gameDev"; break;
      case "social-media": deptKey = "socialMedia"; break;
      default: deptKey = deptId;
    }
    
    // Get the department data
    const deptData = applicationData[deptKey as keyof typeof applicationData];
    
    // If no data found for this department, check if there are dynamic fields
    if (!deptData && applicationData.dynamicFields) {
      // Filter dynamic fields for this department
      const deptDynamicFields = Object.entries(applicationData.dynamicFields as Record<string, any>)
        .filter(([key]) => key.startsWith(`${deptKey}_`))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
      
      if (Object.keys(deptDynamicFields).length > 0) {
        return { dynamicFields: deptDynamicFields };
      }
    }
    
    return deptData || null;
  };
  
  // Get department name
  const getDepartmentName = (deptId: string): string => {
    return DEPARTMENTS[deptId as keyof typeof DEPARTMENTS] || deptId;
  };
  
  // Format URL for display
  const formatURL = (url: string): string => {
    if (!url) return "";
    
    try {
      // Remove protocol
      let formatted = url.replace(/^https?:\/\//, "");
      
      // Truncate if too long
      if (formatted.length > 30) {
        formatted = formatted.substring(0, 27) + "...";
      }
      
      return formatted;
    } catch (e) {
      return url;
    }
  };
  
  // Render department tabs
  const renderDepartmentTabs = () => {
    if (!userData?.departments || userData.departments.length === 0) {
      return <p className="text-gray-500">No departments selected</p>;
    }

    // Filter departments based on user role
    const visibleDepartments = !isCoreTeam && departmentId 
      ? userData.departments.filter(deptId => deptId === departmentId)
      : userData.departments;

    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-flow-col auto-cols-fr">
          {visibleDepartments.map((deptId) => (
            <TabsTrigger key={deptId} value={deptId} className="text-sm">
              {getDepartmentName(deptId)}
              {departmentStatuses[deptId] && (
                <span className="ml-2">
                  {departmentStatuses[deptId].status === "approved" && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                  {departmentStatuses[deptId].status === "rejected" && (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {visibleDepartments.map((deptId) => (
          <TabsContent key={deptId} value={deptId} className="pt-4">
            {renderDepartmentApplication(deptId)}
          </TabsContent>
        ))}
      </Tabs>
    );
  };
  
  // Render application form for a specific department
  const renderDepartmentApplication = (deptId: string) => {
    const deptData = getDepartmentData(deptId);
    const fields = formFields[deptId] || [];
    
    if (!deptData) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
          <p className="font-medium">No form data submitted for this department yet.</p>
        </div>
      );
    }
    
    // Get dynamic fields from department data
    const dynamicFieldsData = (deptData && typeof deptData === 'object' && 'dynamicFields' in deptData) 
      ? deptData.dynamicFields as Record<string, any>
      : {};
    
    return (
      <div className="space-y-6">
        {fields.length > 0 ? (
          fields.map((field) => {
            const fieldValue = dynamicFieldsData[field.id];
            let displayValue = '';
            
            if (typeof fieldValue === 'string') {
              displayValue = fieldValue;
            } else if (fieldValue && typeof fieldValue === 'object' && 'value' in fieldValue) {
              displayValue = fieldValue.value;
            }
            
            return (
              <div key={field.id} className="border rounded-md p-4">
                <h3 className="font-medium text-gray-800 mb-1">{field.label}</h3>
                {renderFieldValue(field, displayValue)}
              </div>
            );
          })
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-gray-600">
            <p>No form fields defined for this department.</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render field value based on field type
  const renderFieldValue = (field: FormField, value: string) => {
    if (!value || value.trim() === '') {
      return <span className="text-gray-400">Not provided</span>;
    }
    
    if (field.type === 'url' && value) {
      const formattedUrl = formatURL(value);
      return (
        <a 
          href={formattedUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          {value} <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      );
    }
    
    if (field.type === 'email' && value) {
      return (
        <a 
          href={`mailto:${value}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {value}
        </a>
      );
    }
    
    // Handle multi-line text
    if (field.type === 'textarea' || value.includes('\n')) {
      return value.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? "mt-1" : ""}>{line || <br />}</p>
      ));
    }
    
    return value;
  };
  
  const handleError = (error: unknown) => {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    toast.error(errorMessage);
    setSaving(false);
  };

  const handleUpdateSuccess = () => {
    setSaving(false);
    toast.success("Application updated successfully");
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    updateDepartmentStatus();
  };
  
  if (loading) {
    return (
      <div className="container max-w-6xl py-10">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="sm" className="mr-2" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading application...</h1>
        </div>
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="container max-w-6xl py-10">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="sm" className="mr-2" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Application not found</h1>
        </div>
        <p>The requested application could not be found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/applications">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Applications
          </Link>
        </Button>
      </div>
      
      {unauthorized ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              You do not have permission to view this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">
              As a department lead, you can only view applications for your own department.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/dashboard/applications">
                Return to Applications List
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Applicant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{userData?.name}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span>{userData?.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span>{userData?.regNo}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>{userData?.phone}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Applied On</div>
                    <div>
                      {userData?.createdAt
                        ? (() => {
                            try {
                              // Handle different timestamp formats
                              const timestamp = userData.createdAt;
                              // If it's a Firestore timestamp with seconds and nanoseconds
                              if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
                                return format(new Date(timestamp.seconds * 1000), "MMMM d, yyyy");
                              }
                              // If it's a string or number timestamp
                              return format(new Date(timestamp), "MMMM d, yyyy");
                            } catch (e) {
                              console.error("Error formatting date:", e);
                              return "Invalid date";
                            }
                          })()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Department-specific Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>Review the applicant's responses</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDepartmentTabs()}
            </CardContent>
          </Card>
          
          {/* Department-specific Review - For both core team and department leads */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle>Department Review</CardTitle>
              <CardDescription>
                {activeTab ? `Update ${getDepartmentName(activeTab)} department status and provide feedback` : "Select a department tab above to review"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Department status selector */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={currentDepartmentStatus} 
                  onValueChange={(value) => setCurrentDepartmentStatus(value as ApplicationStatus)}
                  disabled={!activeTab}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Department feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea 
                  id="feedback" 
                  placeholder="Provide feedback to the applicant (optional)"
                  value={currentDepartmentFeedback}
                  onChange={(e) => setCurrentDepartmentFeedback(e.target.value)}
                  disabled={!activeTab}
                  className="min-h-32"
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={updateDepartmentStatus} 
                disabled={saving || !activeTab}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update {activeTab ? getDepartmentName(activeTab) : "Department"} Status
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
} 