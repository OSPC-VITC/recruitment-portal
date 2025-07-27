"use client";

import { useState, useEffect } from "react";
import { Shield, Globe, Users, Save, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { 
  useGeneralSettings, 
  useApplicationSettings, 
  DEFAULT_GENERAL_SETTINGS, 
  DEFAULT_APPLICATION_SETTINGS 
} from "@/lib/useAppSettings";

// Function to save settings to localStorage
const saveSettingsToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(`settings_${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
};

// Function to load settings from localStorage
const loadSettingsFromStorage = (key: string, defaultValue: any) => {
  try {
    const storedValue = localStorage.getItem(`settings_${key}`);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaultValue;
  }
};

export default function SettingsPage() {
  const { isCoreTeam } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Load settings using the hooks
  const { settings: generalSettings, updateSettings: updateGeneralSettings, isLoaded: isGeneralLoaded } = useGeneralSettings();
  const { settings: applicationSettings, updateSettings: updateApplicationSettings, isLoaded: isApplicationLoaded } = useApplicationSettings();
  
  // Handle General Settings Change
  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateGeneralSettings({ [name]: value });
  };
  
  // Handle toggle change
  const handleToggleChange = (name: string, checked: boolean, settingsType: 'general' | 'application') => {
    if (settingsType === 'general') {
      updateGeneralSettings({ [name]: checked });
    } else if (settingsType === 'application') {
      updateApplicationSettings({ [name]: checked });
    }
  };
  
  // Handle application settings change
  const handleApplicationSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For date fields, ensure we have a valid date format
    if (name === 'applicationDeadline') {
      // console.log(`Setting application deadline to: ${value}`);
      
      // Validate the date format (should be YYYY-MM-DD)
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // console.warn("Invalid date format. Expected YYYY-MM-DD but got:", value);
      }
    }
    
    updateApplicationSettings({ [name]: value });
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    updateApplicationSettings({ [name]: value });
  };
  
  // Save settings
  const saveSettings = (type: 'general' | 'application') => {
    // Settings are automatically saved by the hooks when updated
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved successfully`);
    
    // Apply settings to website
    if (type === 'general') {
      document.title = generalSettings.portalName;
    }
    
    // Log the current settings for debugging
    if (type === 'application') {
      const currentDate = new Date();
      const deadlineDate = applicationSettings.applicationDeadline ? new Date(applicationSettings.applicationDeadline) : null;
      
      // console.log("Saved application settings:", {
      //   deadline: applicationSettings.applicationDeadline,
      //   deadlineDate: deadlineDate ? deadlineDate.toISOString() : null,
      //   currentDate: currentDate.toISOString(),
      //   isPast: deadlineDate ? deadlineDate < currentDate : false,
      //   allowLate: applicationSettings.allowLateSubmissions,
      //   autoReject: applicationSettings.autoRejectAfterDeadline
      // });
    }
  };
  
  // Reset settings to defaults
  const resetSettings = (type: 'general' | 'application') => {
    if (confirm(`Are you sure you want to reset ${type} settings to defaults?`)) {
      if (type === 'general') {
        updateGeneralSettings(DEFAULT_GENERAL_SETTINGS);
      } else if (type === 'application') {
        updateApplicationSettings(DEFAULT_APPLICATION_SETTINGS);
      }
      
      toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} settings reset to defaults`);
    }
  };
  
  // If not core team, show access denied
  if (!isCoreTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mb-4">
          <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          You don't have permission to view this page. Only core team members can access settings.
        </p>
      </div>
    );
  }
  
  // Show loading indicator while settings are being loaded
  if (!isGeneralLoaded || !isApplicationLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading settings...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold dark:text-white">Settings</h1>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="dark:bg-gray-800 w-full md:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm flex-1 md:flex-initial">
            <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm flex-1 md:flex-initial">
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Applications
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card className="dark:bg-gray-950 dark:border-gray-800">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl dark:text-white">General Settings</CardTitle>
              <CardDescription className="text-xs md:text-sm dark:text-gray-400">
                Configure the basic settings for the recruitment portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-6">
              <div className="space-y-2">
                <Label htmlFor="portalName" className="text-xs md:text-sm dark:text-gray-300">Portal Name</Label>
                <Input
                  id="portalName"
                  name="portalName"
                  value={generalSettings.portalName}
                  onChange={handleGeneralSettingsChange}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white h-9 md:h-10 text-sm md:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage" className="text-xs md:text-sm dark:text-gray-300">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={generalSettings.welcomeMessage}
                  onChange={handleGeneralSettingsChange}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm md:text-base min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-xs md:text-sm dark:text-gray-300">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={handleGeneralSettingsChange}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white h-9 md:h-10 text-sm md:text-base"
                />
              </div>
              
              <Separator className="my-4 dark:bg-gray-800" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-xs md:text-sm dark:text-white">Theme</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      Toggle between light and dark mode
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm dark:text-gray-400">{theme === "dark" ? "Dark" : "Light"}</span>
                    <Switch 
                      checked={theme === "dark"} 
                      onCheckedChange={toggleTheme}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-xs md:text-sm dark:text-white">Close Applications</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                      Prevent new applications from being submitted
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.applicationClosed} 
                    onCheckedChange={(checked) => handleToggleChange("applicationClosed", checked, "general")}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t dark:border-gray-800 pt-4 px-4 md:px-6">
              <Button 
                variant="outline" 
                onClick={() => resetSettings("general")}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm w-full sm:w-auto h-9 md:h-10"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={() => saveSettings("general")}
                className="text-xs md:text-sm w-full sm:w-auto h-9 md:h-10"
              >
                <Save className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Application Settings */}
        <TabsContent value="applications">
          <Card className="dark:bg-gray-950 dark:border-gray-800">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl dark:text-white">Application Settings</CardTitle>
              <CardDescription className="text-xs md:text-sm dark:text-gray-400">
                Configure how applications are handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-4 md:px-6">
              <div>
                <h3 className="text-sm md:text-base font-medium mb-3 dark:text-white">Applications Lifecycle</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicationDeadline" className="text-xs md:text-sm dark:text-gray-300">
                        Application Deadline
                      </Label>
                      <Input
                        id="applicationDeadline"
                        name="applicationDeadline"
                        type="date"
                        value={applicationSettings.applicationDeadline}
                        onChange={handleApplicationSettingsChange}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white h-9 md:h-10 text-sm md:text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultApplicationStatus" className="text-xs md:text-sm dark:text-gray-300">
                        Default Application Status
                      </Label>
                      <Select
                        value={applicationSettings.defaultApplicationStatus}
                        onValueChange={(value) => handleSelectChange("defaultApplicationStatus", value)}
                      >
                        <SelectTrigger id="defaultApplicationStatus" className="dark:bg-gray-800 dark:border-gray-700 dark:text-white h-9 md:h-10 text-sm md:text-base">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <Label className="text-xs md:text-sm dark:text-white">Allow Late Submissions</Label>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        Allow applications after the deadline
                      </p>
                    </div>
                    <Switch 
                      checked={applicationSettings.allowLateSubmissions} 
                      onCheckedChange={(checked) => handleToggleChange("allowLateSubmissions", checked, "application")}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <Label className="text-xs md:text-sm dark:text-white">Auto-Reject After Deadline</Label>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        Automatically reject applications submitted after the deadline
                      </p>
                    </div>
                    <Switch 
                      checked={applicationSettings.autoRejectAfterDeadline} 
                      onCheckedChange={(checked) => handleToggleChange("autoRejectAfterDeadline", checked, "application")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t dark:border-gray-800 pt-4 px-4 md:px-6">
              <Button 
                variant="outline" 
                onClick={() => resetSettings("application")}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-xs md:text-sm w-full sm:w-auto h-9 md:h-10"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={() => saveSettings("application")}
                className="text-xs md:text-sm w-full sm:w-auto h-9 md:h-10"
              >
                <Save className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 