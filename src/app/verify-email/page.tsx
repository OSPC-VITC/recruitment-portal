"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";
import { resendEmailVerification, setEmailVerificationCookie } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Check verification status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || loading) return;
      
      try {
        // Reload user to get the latest email verification status
        await auth.currentUser?.reload();
        const verified = auth.currentUser?.emailVerified || false;
        
        setIsVerified(verified);
        setVerificationChecked(true);
        
        if (verified) {
          // Update the email verification cookie
          setEmailVerificationCookie(true);
          toast.success("Email verified successfully!");
          
          // Force immediate navigation to dashboard
          setTimeout(() => {
            window.location.href = "/user-dashboard";
          }, 500);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    checkStatus();
  }, [user, loading, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendEmailVerification();
      toast.success("Verification email sent! Please check your inbox and spam folder.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      // Reload user to get the latest email verification status
      await auth.currentUser?.reload();
      const verified = auth.currentUser?.emailVerified || false;
      
      setIsVerified(verified);
      
      if (verified) {
        // Update the email verification cookie
        setEmailVerificationCookie(true);
        toast.success("Email verified successfully!");
        
        // Force immediate navigation to dashboard
        setTimeout(() => {
          window.location.href = "/user-dashboard";
        }, 500);
      } else {
        toast.info("Email not yet verified. Please check your email and click the verification link.");
      }
    } catch (error: any) {
      toast.error("Error checking verification status");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleContinueToLogin = () => {
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Particles Background */}
        <ParticlesBackgroundWrapper />
        
        <Card className="w-full max-w-md shadow-xl z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-white/30 dark:border-gray-800/50">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={64} 
                height={64} 
                className="rounded-xl shadow-lg"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-transparent bg-clip-text">Verify Your Email</h1>
            
            <div className="bg-gray-100/60 dark:bg-gray-800/60 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Mail className="mr-2 text-amber-500" size={20} />
                <p className="text-sm font-semibold">Verification Required</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We've sent a verification email to your inbox. Please check and click the link to activate your account.
              </p>
            </div>
            
            {isVerified ? (
              <div className="bg-green-100/60 dark:bg-green-900/30 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-900">
                <div className="flex items-center mb-2">
                  <CheckCircle className="mr-2 text-green-500" size={20} />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">Email Verified!</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your email has been verified. You can now access all features of the OSPC portal.
                </p>
              </div>
            ) : verificationChecked ? (
              <div className="bg-amber-100/60 dark:bg-amber-900/30 rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center mb-2">
                  <AlertCircle className="mr-2 text-amber-500" size={20} />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Not Verified Yet</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  We haven't detected your email verification yet. Please check your email and click the verification link.
                </p>
              </div>
            ) : null}
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                variant="default"
                onClick={handleCheckVerification}
                disabled={isCheckingVerification}
              >
                {isCheckingVerification ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Check Verification Status
              </Button>
              
              <Button 
                className="w-full"
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending}
              >
                {isResending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Resend Verification Email
              </Button>
              
              <Button 
                className="w-full"
                variant="ghost"
                onClick={handleContinueToLogin}
              >
                Back to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
