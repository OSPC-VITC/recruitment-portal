"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { checkEmailVerification } from "@/lib/auth";

interface AuthCheckProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function AuthCheck({ children, requireEmailVerification = true }: AuthCheckProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check email verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!user || !requireEmailVerification) {
        setEmailVerified(true);
        return;
      }

      // Skip verification check for certain pages
      const skipVerificationPages = ['/verify-email', '/login', '/register'];
      if (skipVerificationPages.includes(pathname)) {
        setEmailVerified(true);
        return;
      }

      setCheckingVerification(true);
      try {
        const verified = await checkEmailVerification();
        setEmailVerified(verified);
        
        if (!verified) {
          router.push("/verify-email");
        }
      } catch (error) {
        console.error("Error checking email verification:", error);
        setEmailVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    if (!loading && user) {
      checkVerification();
    }
  }, [user, loading, requireEmailVerification, pathname, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || checkingVerification) {
    return (
      <div className="min-h-screen">
        <Loading 
          size="lg" 
          text={checkingVerification ? "Checking email verification..." : "Loading..."} 
          fullscreen={true}
        />
      </div>
    );
  }

  // Only render children if user is authenticated and email is verified (if required)
  return user && (emailVerified || !requireEmailVerification) ? <>{children}</> : null;
} 