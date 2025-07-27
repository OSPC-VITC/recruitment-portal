"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MainParticlesLayout from "@/components/MainParticlesLayout";
import LiquidGlassEffect from "@/components/LiquidGlassEffect";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocument } from "@/lib/auth";
import { useAppSettings } from "@/components/AppSettingsProvider";
import { Sun, Moon } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";
import Navbar from "@/components/ui/navbar";

// Left side content for the landing page
function LandingContent() {
  const { portalName, welcomeMessage, isLoaded } = useAppSettings();
  
  return (
    <div className="relative flex flex-col justify-center items-start h-full font-sans pt-0 pl-0 md:pl-6 lg:pl-10">
      <div className="mb-0 md:mb-2 w-full">
        {/* Logo removed from here as it's now in the main header */}
        <h1 className="font-bold text-2xl md:text-4xl lg:text-5xl mb-2 md:mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-transparent bg-clip-text leading-tight font-sans">
          {isLoaded ? portalName : "OSPC Recruitment Portal"}
        </h1>
        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 max-w-md leading-relaxed font-sans">
          {isLoaded ? welcomeMessage : "Join our community of innovators, creators, and future leaders. Apply to departments that match your interests and skills."}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
        <div className="space-y-2 md:space-y-3 p-3 md:p-4 bg-white/10 dark:bg-gray-900/10 backdrop-blur-[2px] rounded-xl border-2 border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-1 md:mb-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h2 className="font-semibold text-base md:text-xl text-gray-900 dark:text-gray-100 font-sans">Our Mission</h2>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
          To empower students through open-source collaboration, fostering innovation, hands-on learning, and a strong tech community.
          </p>
        </div>
        
        <div className="space-y-2 md:space-y-3 p-3 md:p-4 bg-white/10 dark:bg-gray-900/10 backdrop-blur-[2px] rounded-xl border-2 border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-1 md:mb-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <h2 className="font-semibold text-base md:text-xl text-gray-900 dark:text-gray-100 font-sans">Our Values</h2>
          <ul className="text-xs md:text-base text-gray-600 dark:text-gray-300 space-y-1 md:space-y-2 font-sans">
            <li className="flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm flex-shrink-0"></span>
              <span className="leading-relaxed">Openness: We share, learn, and grow together</span>
            </li>
            <li className="flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm flex-shrink-0"></span>
              <span className="leading-relaxed">Collaboration: Teamwork powers everything we do</span>
            </li>
            <li className="flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm flex-shrink-0"></span>
              <span className="leading-relaxed">Innovation: We build creative, impactful solutions</span>
            </li>
            <li className="flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm flex-shrink-0"></span>
              <span className="leading-relaxed">Hands-on Learning: Real skills through real projects</span>
            </li>
            <li className="flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-sm flex-shrink-0"></span>
              <span className="leading-relaxed">Community: Everyone's welcome, everyone contributes</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full p-5 md:p-6 mt-4 bg-white/10 dark:bg-gray-900/10 backdrop-blur-[2px] rounded-xl border-2 border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 md:mb-5 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <h2 className="font-semibold text-base md:text-xl text-gray-900 dark:text-gray-100 mb-3 font-sans">Join Our Departments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 py-1">
          <div className="p-3 md:p-4 bg-white/15 dark:bg-gray-800/15 backdrop-blur-[2px] rounded-lg border border-white/30 dark:border-gray-700/40 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold text-primary dark:text-gray-100 mb-1 md:mb-2 font-sans text-xs md:text-sm">Technology</h3>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">AI&ML, Dev, Open Source, Game Dev, Cybersec, Robotics, Blockchain</p>
          </div>
          <div className="p-3 md:p-4 bg-white/15 dark:bg-gray-800/15 backdrop-blur-[2px] rounded-lg border border-white/30 dark:border-gray-700/40 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold text-primary dark:text-gray-100 mb-1 md:mb-2 font-sans text-xs md:text-sm">Design & Content</h3>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">Design, UI/UX Design, Content, Social Media, Photography</p>
          </div>
          <div className="p-3 md:p-4 bg-white/15 dark:bg-gray-800/15 backdrop-blur-[2px] rounded-lg border border-white/30 dark:border-gray-700/40 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold text-primary dark:text-gray-100 mb-1 md:mb-2 font-sans text-xs md:text-sm">Events</h3>
            <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">Event Management, Outreach, Marketing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main landing page component
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  // Add effect to mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check for user authentication and redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already logged in
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            // User is already logged in, check application status
            const userDoc = await getUserDocument();
            if (userDoc?.applicationSubmitted) {
              // Set the cookie for application submitted
              document.cookie = "applicationSubmitted=true; path=/; max-age=31536000"; // 1 year
              router.push("/status");
            } else {
              router.push("/user-dashboard");
            }
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // If component not mounted yet, don't render anything to avoid hydration mismatch
  if (!mounted) return null;
  
  return (
    <MainParticlesLayout>
      <div className="flex flex-col md:flex-row min-h-screen w-full">
        {/* Desktop theme toggle */}
        <div className="hidden md:block absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Left side - Content */}
        <div className="flex-1 min-h-screen overflow-y-auto py-4 md:py-6 px-4 md:pl-6 md:pr-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between md:hidden mb-6 pt-2">
            <Link href="https://ospcvitc.club/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={32} 
                height={32} 
                className="rounded-lg shadow-lg"
              />
            </Link>
            <div className="flex items-center gap-3">
              <Button asChild variant="secondary" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/register">Register</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-8 h-8 p-0 rounded-full bg-white/10 dark:bg-gray-800/70 backdrop-blur border border-white/30 dark:border-gray-700"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-white" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-800" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Main content with proper spacing */}
          <div className="flex items-center justify-center min-h-[calc(100vh-120px)] md:min-h-full">
            <LandingContent />
          </div>
        </div>
        
        {/* Right side - Auth */}
        <div className="hidden md:flex md:w-[350px] md:min-h-screen relative overflow-hidden rounded-l-3xl shadow-xl ml-6 border-l-2 border-t-2 border-b-2 border-white/20 dark:border-gray-700/30">
          {/* Consistent theme-based background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md z-0"></div>
          </div>
          
          {/* Content overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-gray-800 dark:text-white px-8 py-8">
            <Link 
              href="https://ospcvitc.club/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:scale-105 transition-transform duration-300"
            >
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={110} 
                height={110} 
                className="rounded-2xl shadow-lg mb-6 border border-white/30 dark:border-gray-700/40"
              />
            </Link>
            
            <h2 className="text-3xl font-bold mb-12 text-center">Join OSPC </h2>
            
            <div className="w-full space-y-4">
              <Button
                asChild
                className="w-full py-6 text-base"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              
              <Button
                asChild
                className="w-full py-6 text-base"
                variant="default"
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainParticlesLayout>
  );
}