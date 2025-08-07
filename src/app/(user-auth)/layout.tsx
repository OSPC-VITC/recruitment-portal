"use client";

import { useAuth } from "@/lib/AuthContext";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";
import { Loading } from "@/components/ui/loading";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only protect routes if we're on the client and loaded the auth state
  if (isClient && !loading && !user) {
    redirect("/");
  }

  // Show loading state
  if (loading || !isClient) {
    return (
      <div className="min-h-screen">
        <Loading 
          size="lg" 
          text="Loading..." 
          fullscreen={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Global particle background for all user pages */}
      <ParticlesBackgroundWrapper />
      
      {/* Content container with transparent background and subtle blur */}
      <div className="relative z-10 bg-transparent pt-16">
        {children}
      </div>
    </div>
  );
} 