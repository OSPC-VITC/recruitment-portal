"use client";

import { toast } from "sonner";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import {
  TechApplicationFormData,
  DesignApplicationFormData,
  MarketingApplicationFormData
} from "./schemas";
import { User, Application } from "@/types";
import { normalizeDepartmentId } from "./departmentMapping";

// Helper to save tech form data
export const saveTechForm = async (userId: string, data: TechApplicationFormData, existingApplicationData: any) => {
  try {
    // Clean data for Firebase
    const techData = {
      ...data,
      githubLink: data.githubLink || null
    };
    
    await setDoc(doc(db, "applications", userId), {
      ...existingApplicationData,
      tech: techData,
      userId,
      updatedAt: new Date(),
    }, { merge: true });
    
    toast.success("Tech form saved successfully", { id: "tech-form-saved" });
    return true;
  } catch (error: any) {
    // Error saving tech form
    
    // User-friendly error message
    toast.error("Unable to save your form. Please try again", { id: "tech-form-error" });
    return false;
  }
};

// Helper to save design form data
export const saveDesignForm = async (userId: string, data: DesignApplicationFormData, existingApplicationData: any) => {
  try {
    // Clean data for Firebase
    const designData = {
      ...data,
      portfolioLink: data.portfolioLink || null
    };
    
    await setDoc(doc(db, "applications", userId), {
      ...existingApplicationData,
      design: designData,
      userId,
      updatedAt: new Date(),
    }, { merge: true });
    
    toast.success("Design form saved successfully", { id: "design-form-saved" });
    return true;
  } catch (error: any) {
    // Error saving design form
    
    // User-friendly error message
    toast.error("Unable to save your form. Please try again", { id: "design-form-error" });
    return false;
  }
};

// Helper to save marketing form data
export const saveMarketingForm = async (userId: string, data: MarketingApplicationFormData, existingApplicationData: any) => {
  try {
    // Clean data for Firebase
    const marketingData = {
      ...data,
      socialMediaLinks: data.socialMediaLinks || null
    };
    
    await setDoc(doc(db, "applications", userId), {
      ...existingApplicationData,
      marketing: marketingData,
      userId,
      updatedAt: new Date(),
    }, { merge: true });
    
    toast.success("Marketing form saved successfully", { id: "marketing-form-saved" });
    return true;
  } catch (error: any) {
    // Error saving marketing form
    
    // User-friendly error message
    toast.error("Unable to save your form. Please try again", { id: "marketing-form-error" });
    return false;
  }
};

// Helper to save department selection
export const saveDepartmentSelection = async (userId: string, departments: string[]) => {
  try {
    // Get the current time
    const now = new Date();
    
    // Use setDoc with merge option instead of updateDoc to ensure document exists
    // Include all necessary fields for a new user document
    await setDoc(doc(db, "users", userId), {
      id: userId,
      departments,
      updatedAt: now,
      createdAt: now, // This will only be used for new documents
      status: "active",
    }, { merge: true });
    
    // Departments saved successfully
    toast.success("Departments saved successfully", { id: "dept-save-success" });
    return true;
  } catch (error: any) {
    // Error saving departments
    
    // User-friendly error message
    toast.error("Unable to save your department selections", { id: "dept-save-error" });
    return false;
  }
};

// Generic helper to save any application form data
export const saveApplication = async (userId: string, data: Partial<Application>) => {
  try {
    await setDoc(doc(db, "applications", userId), {
      ...data,
      userId,
      updatedAt: new Date(),
    }, { merge: true });
    
    return true;
  } catch (error: any) {
    // Error saving application data
    
    // User-friendly error message
    toast.error("Unable to save your application data", { id: "app-save-error" });
    return false;
  }
};

// Helper to submit final application
export const submitApplication = async (userId: string) => {
  try {
    // Get the user document
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      toast.error("Your profile could not be found", { id: "user-not-found" });
      return false;
    }
    
    // Get the application document
    const applicationDoc = await getDoc(doc(db, "applications", userId));
    
    if (!applicationDoc.exists()) {
      toast.error("Your application data could not be found", { id: "app-not-found" });
      return false;
    }
    
    const userData = userDoc.data();
    const applicationData = applicationDoc.data();
    
    // Validate that all required departments have forms
    const departments = userData.departments || [];

    for (const dept of departments) {
      const normalizedDept = normalizeDepartmentId(dept);
      if (!applicationData[normalizedDept]) {
        const deptName = normalizedDept.charAt(0).toUpperCase() + normalizedDept.slice(1).replace(/-/g, " ");
        toast.error(`Please complete the ${deptName} form first`, { id: `incomplete-${dept}` });
        return false;
      }
    }
    
    // Update application status
    await updateDoc(doc(db, "applications", userId), {
      status: "submitted",
      submittedAt: new Date(),
    });
    
    // Update user status
    await updateDoc(doc(db, "users", userId), {
      status: "pending",
      updatedAt: new Date(),
    });
    
    toast.success("Your application has been submitted successfully!", { id: "app-submitted" });
    return true;
  } catch (error: any) {
    // Error submitting application
    
    // User-friendly error message
    toast.error("Unable to submit your application. Please try again", { id: "submit-error" });
    return false;
  }
};

// Helper to get application data
export const getApplication = async (userId: string) => {
  try {
    const docSnap = await getDoc(doc(db, "applications", userId));
    if (!docSnap.exists()) {
      // Create a custom error with code for better error handling
      const error = new Error("Application not found") as any;
      error.code = 'not-found';
      throw error;
    }
    return docSnap.data() as Application;
  } catch (error: any) {
    // Error getting application data
    // Don't show toast here, let the component handle it with specific messages
    throw error; // Re-throw to let the component handle it
  }
};

// Helper to get all users
export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(usersQuery);
    
    const usersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
    
    return usersData;
  } catch (error) {
    // Error fetching users
    
    // User-friendly error message for admin
    toast.error("Unable to load user data", { id: "users-load-error" });
    return [];
  }
};

// Helper to update application status
export const updateApplicationStatus = async (userId: string, status: 'approved' | 'rejected' | 'pending') => {
  try {
    // Update in Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: status,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating status:", error);
    
    // User-friendly error message for admin
    toast.error("Unable to update application status", { id: "status-update-error" });
    return false;
  }
}; 