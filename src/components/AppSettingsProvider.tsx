"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_GENERAL_SETTINGS, DEFAULT_APPLICATION_SETTINGS, GeneralSettings, ApplicationSettings } from '@/lib/useAppSettings';
import { parseISO, isValid } from 'date-fns';

// Create context
interface AppSettingsContextType {
  portalName: string;
  welcomeMessage: string;
  contactEmail: string;
  applicationClosed: boolean;
  applicationDeadline: string;
  allowLateSubmissions: boolean;
  autoRejectAfterDeadline: boolean;
  isLoaded: boolean;
}

const defaultContextValue: AppSettingsContextType = {
  portalName: DEFAULT_GENERAL_SETTINGS.portalName,
  welcomeMessage: DEFAULT_GENERAL_SETTINGS.welcomeMessage,
  contactEmail: DEFAULT_GENERAL_SETTINGS.contactEmail,
  applicationClosed: DEFAULT_GENERAL_SETTINGS.applicationClosed,
  applicationDeadline: DEFAULT_APPLICATION_SETTINGS.applicationDeadline,
  allowLateSubmissions: DEFAULT_APPLICATION_SETTINGS.allowLateSubmissions,
  autoRejectAfterDeadline: DEFAULT_APPLICATION_SETTINGS.autoRejectAfterDeadline,
  isLoaded: false,
};

const AppSettingsContext = createContext<AppSettingsContextType>(defaultContextValue);

// Hook for consuming context
export const useAppSettings = () => useContext(AppSettingsContext);

// Helper function to validate and format date
const validateAndFormatDate = (dateString: any): string => {
  if (!dateString) return '';
  
  // If it's not a string, convert it
  const dateStr = typeof dateString === 'string' ? dateString : String(dateString);
  
  try {
    // Try to parse as ISO date
    const parsedDate = parseISO(dateStr);
    if (isValid(parsedDate)) {
      // Return in YYYY-MM-DD format
      return dateStr.substring(0, 10);
    }
  } catch (error) {
    // Error parsing date
  }
  
  return '';
};

// Provider component
export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [applicationSettings, setApplicationSettings] = useState<ApplicationSettings>(DEFAULT_APPLICATION_SETTINGS);
  const [isGeneralLoaded, setIsGeneralLoaded] = useState(false);
  const [isApplicationLoaded, setIsApplicationLoaded] = useState(false);

  // Set up real-time listeners for settings
  useEffect(() => {
    // Listen for general settings changes
    const generalUnsubscribe = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as GeneralSettings;
          // General settings updated
          setGeneralSettings(data);

          // Apply settings to document only on client side
          if (typeof window !== 'undefined' && data.portalName) {
            document.title = data.portalName;
          }
        } else {
          // No general settings found, using defaults
          setGeneralSettings(DEFAULT_GENERAL_SETTINGS);
        }
        setIsGeneralLoaded(true);
      },
      (error) => {
        // Error listening to general settings
        setIsGeneralLoaded(true);
      }
    );
    
    // Listen for application settings changes
    const applicationUnsubscribe = onSnapshot(
      doc(db, 'settings', 'application'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as ApplicationSettings;
          // Application settings updated
          
          // Ensure applicationDeadline is properly formatted
          const formattedData = {
            ...data,
            applicationDeadline: validateAndFormatDate(data.applicationDeadline)
          };
          
          // Application settings formatted
          setApplicationSettings(formattedData);
        } else {
          // No application settings found, using defaults
          setApplicationSettings(DEFAULT_APPLICATION_SETTINGS);
        }
        setIsApplicationLoaded(true);
      },
      (error) => {
        // Error listening to application settings
        setIsApplicationLoaded(true);
      }
    );
    
    // Clean up listeners on unmount
    return () => {
      generalUnsubscribe();
      applicationUnsubscribe();
    };
  }, []);
  
  // Context value
  const value = {
    portalName: generalSettings.portalName,
    welcomeMessage: generalSettings.welcomeMessage,
    contactEmail: generalSettings.contactEmail,
    applicationClosed: generalSettings.applicationClosed,
    applicationDeadline: applicationSettings.applicationDeadline || '',
    allowLateSubmissions: applicationSettings.allowLateSubmissions,
    autoRejectAfterDeadline: applicationSettings.autoRejectAfterDeadline,
    isLoaded: isGeneralLoaded && isApplicationLoaded,
  };
  
  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
} 