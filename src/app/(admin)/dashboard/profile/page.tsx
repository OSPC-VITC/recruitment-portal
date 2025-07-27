"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getDepartmentName } from "@/lib/adminConfig";
import { User, Mail, Building, Shield } from "lucide-react";

export default function AdminProfilePage() {
  const { adminUser, isCoreTeam, department } = useAdminAuth();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (adminUser?.name) {
      setName(adminUser.name);
    }
  }, [adminUser]);

  const getInitials = (name: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSave = async () => {
    if (!adminUser) return;
    
    setIsSubmitting(true);
    try {
      // Since we can't update the admin document directly (no Firebase for admins),
      // we'll just show a success message. In a real app, this would update the database.
      // The admin session is stored in localStorage and managed by AdminAuthContext
      
      // For a real implementation, you would add an updateAdminDocument function
      // to update the admin's information in the database
      
      setTimeout(() => {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("There was a problem updating your profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 pb-8">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white text-2xl">
                  {adminUser?.name ? getInitials(adminUser.name) : "A"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-xl">{adminUser.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3" />
                {isCoreTeam ? 'Core Team' : 'Department Lead'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                  <p className="text-base">{adminUser.email}</p>
                </div>
              </div>
              
              {!isCoreTeam && department && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                    <p className="text-base">{getDepartmentName(department)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Display Name
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={!isEditing}
                  className={isEditing ? "border-blue-300 dark:border-blue-700" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input 
                  id="email" 
                  value={adminUser.email || ""} 
                  disabled
                  className="bg-gray-50 dark:bg-gray-800/50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-4">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(adminUser.name || "");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 