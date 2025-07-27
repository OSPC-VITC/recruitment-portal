"use client";

import { User as FirebaseUser } from "firebase/auth";
import { User } from "@/types";
import { getCurrentUserData, isAdmin } from "./auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Persistent auth state helper for client-side auth with Vercel deployment
 */

// Local storage keys
const USER_KEY = "auth_user";
const APPLICATION_PROGRESS_KEY = "application_progress";

// Helper to store user data in localStorage
export const storeUser = (user: FirebaseUser | null) => {
  if (typeof window === "undefined") return;
  
  try {
    if (user) {
      // Store minimal user data to avoid token size issues
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
      localStorage.setItem(USER_KEY, JSON.stringify({ user: userData }));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error("Error storing user data:", error);
    // Clear potentially corrupted data
    localStorage.removeItem(USER_KEY);
  }
};

// Helper to get stored user data from localStorage
export const getStoredUser = () => {
  if (typeof window === "undefined") {
    return { user: null };
  }
  
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error retrieving stored user:", error);
    localStorage.removeItem(USER_KEY);
  }
  
  return { user: null };
};

// Helper to fetch user data from Firestore
export const fetchUserData = async (uid: string): Promise<User | null> => {
  try {
    const userData = await getCurrentUserData(uid);
    if (userData) {
      return {
        ...userData,
        id: uid,
      } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Helper to check admin role
export const checkAdminRole = async (uid: string): Promise<boolean> => {
  try {
    return await isAdmin(uid);
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
};

// Helper to store application progress in localStorage
export const storeApplicationProgress = (uid: string, data: any) => {
  if (typeof window === "undefined") return;
  
  try {
    const key = `${APPLICATION_PROGRESS_KEY}_${uid}`;
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (error) {
    console.error("Error storing application progress:", error);
  }
};

// Helper to get stored application progress from localStorage
export const getStoredApplicationProgress = (uid: string) => {
  if (typeof window === "undefined") return null;
  
  try {
    const key = `${APPLICATION_PROGRESS_KEY}_${uid}`;
    const storedProgress = localStorage.getItem(key);
    
    if (storedProgress) {
      return JSON.parse(storedProgress);
    }
  } catch (error) {
    console.error("Error retrieving application progress:", error);
  }
  
  return null;
};

// Get the last active user ID
export const getLastActiveUser = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('last_active_user');
  } catch (error) {
    console.error('Error getting last active user:', error);
    return null;
  }
};

// Clear stored application progress for a user
export const clearStoredApplicationProgress = (userId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`app_progress_${userId}`);
    
    // If this was the last active user, clear that too
    const lastActiveUser = getLastActiveUser();
    if (lastActiveUser === userId) {
      localStorage.removeItem('last_active_user');
    }
  } catch (error) {
    console.error('Error clearing stored application progress:', error);
  }
}; 