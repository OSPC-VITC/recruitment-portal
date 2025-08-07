"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";

export default function EmailVerifiedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Particles Background */}
        <ParticlesBackgroundWrapper />
        
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

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="h-20 w-20 text-green-500" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-transparent bg-clip-text">
                Email Verified!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Congratulations! Your email address has been successfully verified. 
                You can now sign in to your account and access all features.
              </p>

              <div className="space-y-3">
                <Button 
                  asChild
                  className="w-full h-12 text-base"
                >
                  <Link href="/login">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Continue to Sign In
                  </Link>
                </Button>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  <Link href="/">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Home
                  </Link>
                </Button>
              </div>

              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Next Steps:</strong>
                  <br />
                  1. Sign in to your account
                  <br />
                  2. Complete your department selection
                  <br />
                  3. Fill out your application forms
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
