"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { resendEmailVerification, checkEmailVerification, setEmailVerificationCookie } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

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
        const verified = await checkEmailVerification();
        setIsVerified(verified);
        setVerificationChecked(true);
        
        if (verified) {
          // Update the email verification cookie
          setEmailVerificationCookie(true);
          toast.success("Email verified successfully!");
          setTimeout(() => {
            router.push("/user-dashboard");
          }, 2000);
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
      const verified = await checkEmailVerification();
      setIsVerified(verified);
      
      if (verified) {
        // Update the email verification cookie
        setEmailVerificationCookie(true);
        toast.success("Email verified successfully!");
        setTimeout(() => {
          router.push("/user-dashboard");
        }, 1000);
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
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <ParticlesBackground />
        </div>
        
        <Card className="w-full max-w-md shadow-xl z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-white/30 dark:border-gray-800/50">
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={64} 
                height={64} 
                className="rounded-xl shadow-lg"
              />
            </div>

            {isVerified ? (
              // Email is verified
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-transparent bg-clip-text">
                  Email Verified!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your email has been successfully verified. You can now access your dashboard.
                </p>
                <Button 
                  onClick={() => router.push("/user-dashboard")}
                  className="w-full h-10"
                >
                  Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Email needs verification
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Mail className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-transparent bg-clip-text">
                  Verify Your Email
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-6 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
                  {user.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Please check your email inbox (and spam folder) and click the verification link to activate your account.
                </p>

                <div className="space-y-3">
                  <Button 
                    onClick={handleCheckVerification}
                    className="w-full h-10"
                    disabled={isCheckingVerification}
                  >
                    {isCheckingVerification ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        I've Verified My Email
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleResendEmail}
                    className="w-full h-10"
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Need to use a different email?
                  </p>
                  <Button 
                    variant="ghost"
                    onClick={handleContinueToLogin}
                    className="text-sm text-primary hover:underline"
                  >
                    Sign in with different account
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/" className="text-gray-500 hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
