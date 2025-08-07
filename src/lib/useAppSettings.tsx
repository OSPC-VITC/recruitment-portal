"use client";

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';

// Define settings types
export interface GeneralSettings {
  portalName: string;
  welcomeMessage: string;
  contactEmail: string;
  applicationClosed: boolean;
}

export interface ApplicationSettings {
  defaultApplicationStatus: string;
  applicationDeadline: string;
  allowLateSubmissions: boolean;
  autoRejectAfterDeadline: boolean;
}

// Default settings
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  portalName: "Open Source Programming Club\n  Recruitment Portal",
  welcomeMessage: "Welcome to the OSPC Recruitment Portal.\nApply to join us!",
  contactEmail: "opensourceprogrammingclub.vitc@gmail.com",
  applicationClosed: false,
};

// Get a future date for the default deadline (July 17, 2024)
const getDefaultDeadline = (): string => {
  return "2025-08-31"; // YYYY-MM-DD format
};

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
  defaultApplicationStatus: "pending",
  applicationDeadline: getDefaultDeadline(),
  allowLateSubmissions: false,
  autoRejectAfterDeadline: false,
};

// Function to load settings from localStorage (fallback)
export const loadSettingsFromStorage = <T,>(key: string, defaultValue: T): T => {
  // Skip localStorage operations during SSR
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const storedValue = localStorage.getItem(`settings_${key}`);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} settings from localStorage:`, error);
    return defaultValue;
  }
};

// Function to save settings to localStorage (fallback)
export const saveSettingsToStorage = <T,>(key: string, value: T): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(`settings_${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} settings to localStorage:`, error);
    return false;
  }
};

// Function to load settings from Firestore
const loadSettingsFromFirestore = async <T,>(key: string, defaultValue: T): Promise<T> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', key));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} settings from Firestore:`, error);
    return defaultValue;
  }
};

// Function to save settings to Firestore
const saveSettingsToFirestore = async <T extends DocumentData>(key: string, value: T): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'settings', key), value);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} settings to Firestore:`, error);
    return false;
  }
};

// Hook for accessing and updating general settings
export function useGeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on first render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try to load from Firestore
        const firestoreSettings = await loadSettingsFromFirestore<GeneralSettings>('general', DEFAULT_GENERAL_SETTINGS);
        setSettings(firestoreSettings);
        
        // Also update localStorage for fallback
        saveSettingsToStorage('general', firestoreSettings);
      } catch (error) {
        // If Firestore fails, fall back to localStorage
        const localSettings = loadSettingsFromStorage<GeneralSettings>('general', DEFAULT_GENERAL_SETTINGS);
        setSettings(localSettings);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadSettings();
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<GeneralSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to both Firestore and localStorage
    saveSettingsToFirestore('general', updatedSettings);
    saveSettingsToStorage('general', updatedSettings);
    
    // Apply certain settings immediately to the website
    if (newSettings.portalName) {
      document.title = newSettings.portalName;
    }
  };

  return { settings, updateSettings, isLoaded };
}

// Hook for accessing and updating application settings
export function useApplicationSettings() {
  const [settings, setSettings] = useState<ApplicationSettings>(DEFAULT_APPLICATION_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on first render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try to load from Firestore
        const firestoreSettings = await loadSettingsFromFirestore<ApplicationSettings>('application', DEFAULT_APPLICATION_SETTINGS);
        setSettings(firestoreSettings);
        
        // Also update localStorage for fallback
        saveSettingsToStorage('application', firestoreSettings);
      } catch (error) {
        // If Firestore fails, fall back to localStorage
        const localSettings = loadSettingsFromStorage<ApplicationSettings>('application', DEFAULT_APPLICATION_SETTINGS);
        setSettings(localSettings);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadSettings();
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<ApplicationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save to both Firestore and localStorage
    saveSettingsToFirestore('application', updatedSettings);
    saveSettingsToStorage('application', updatedSettings);
  };

  return { settings, updateSettings, isLoaded };
} 