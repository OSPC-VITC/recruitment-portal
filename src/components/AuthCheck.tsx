"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";

interface AuthCheckProps {
  children: React.ReactNode;
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
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

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
} 