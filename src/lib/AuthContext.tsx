"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { getCurrentUserData, isAdmin, setEmailVerificationCookie, setAuthTokenCookie, clearAuthCookies } from "./auth";
import { User } from "@/types";
import { getStoredUser, storeUser, fetchUserData, checkAdminRole, getStoredApplicationProgress } from "./authStateHelpers";
import { toast } from "sonner";
import { useApplicationStore } from "./store";

interface AuthContextValue {
  user: FirebaseUser | null;
  userData: User | null;
  isAdmin: boolean;
  userRole: "admin" | "user" | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  isAdmin: false,
  userRole: null,
  loading: true,
  authError: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Get application store functions for session persistence
  const restoreProgress = useApplicationStore(state => state.restoreProgress);
  const saveProgress = useApplicationStore(state => state.saveProgress);

  // Initialize from localStorage for faster loading on client side
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const initializeFromStorage = () => {
      try {
        const { user: storedUser } = getStoredUser();
        if (storedUser) {
          // Set initial user from storage for faster client rendering
          setUser(storedUser as FirebaseUser);
        }
      } catch (error) {
        console.error("Error initializing from localStorage:", error);
      }
    };
    
    initializeFromStorage();
  }, []);

  // Sign out function
  const handleSignOut = async () => {
    try {
      // Save progress before signing out
      if (user?.uid) {
        saveProgress(user.uid);
      }
      
      // Clear all authentication-related cookies using the new function
      clearAuthCookies();
      
      // Clear localStorage data
      localStorage.removeItem('auth_user');
      
      // Clear application store data for this user
      const { resetApplicationData, clearProgress } = useApplicationStore.getState();
      resetApplicationData();
      if (user?.uid) {
        clearProgress(user.uid);
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local state
      setUser(null);
      setUserData(null);
      setIsUserAdmin(false);
      setUserRole(null);
      setAuthError(null);
      
      // Show success message
      toast.success("Signed out successfully", { id: "auth-signout" });
      
      // Force redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Unable to sign out. Please try again", { id: "auth-error" });
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Store user data in localStorage for persistence
        storeUser(firebaseUser);
        setUser(firebaseUser);
        
        // Reset user data when signed out
        if (!firebaseUser) {
          setUserData(null);
          setIsUserAdmin(false);
          setUserRole(null);
          setLoading(false);
          // Clear auth cookies when user is signed out
          clearAuthCookies();
          return;
        }

        try {
          // Set auth token cookie when user is signed in
          setAuthTokenCookie(true);
          
          // Set email verification cookie
          setEmailVerificationCookie(firebaseUser.emailVerified);
          
          // Get user data and admin status in parallel
          const [userDataFromFirestore, adminStatus] = await Promise.all([
            fetchUserData(firebaseUser.uid),
            checkAdminRole(firebaseUser.uid)
          ]);
          
          if (userDataFromFirestore) {
            setUserData(userDataFromFirestore);
            
            // Set applicationSubmitted cookie if user has submitted application
            if (userDataFromFirestore.applicationSubmitted) {
              document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
            }
          }
          
          setIsUserAdmin(adminStatus);
          setUserRole(adminStatus ? "admin" : "user");
          
          // Try to restore application progress from localStorage
          const restored = restoreProgress(firebaseUser.uid);
          if (restored) {
            toast.success("Your previous application progress has been restored", {
              duration: 3000,
              position: "bottom-center",
              id: "restore-progress"
            });
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          
          // User-friendly error messages without exposing Firebase details
          if (error.code === 'permission-denied') {
            toast.error("You don't have permission to access this area", { id: "auth-data-error" });
          } else if (error.code === 'not-found') {
            toast.error("Your profile information is incomplete", { id: "auth-data-error" });
          } else if (error.code === 'auth/invalid-credential') {
            toast.error("Your login session has expired. Please sign in again", { id: "auth-data-error" });
          } else {
            toast.error("Unable to load your profile. Please try again", { id: "auth-data-error" });
          }
          
          setAuthError("Profile data unavailable");
        } finally {
          setLoading(false);
        }
      },
      (error: any) => {
        console.error("Auth state change error:", error);
        
        // User-friendly auth error messages
        if (error.code === 'auth/invalid-credential') {
          toast.error("Your login session has expired. Please sign in again", { id: "auth-state-error" });
        } else if (error.code === 'auth/network-request-failed') {
          toast.error("Network connection issue. Please check your internet connection", { id: "auth-state-error" });
        } else if (error.code === 'auth/user-disabled') {
          toast.error("Your account has been disabled. Please contact support", { id: "auth-state-error" });
        } else if (error.code === 'auth/user-token-expired') {
          toast.error("Your session has expired. Please sign in again", { id: "auth-state-error" });
        } else {
          toast.error("Authentication error. Please sign in again", { id: "auth-state-error" });
        }
        
        setAuthError("Authentication issue");
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [restoreProgress, saveProgress]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      user,
      userData,
      isAdmin: isUserAdmin,
      userRole,
      loading,
      authError,
      signOut: handleSignOut,
    }),
    [user, userData, isUserAdmin, userRole, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}