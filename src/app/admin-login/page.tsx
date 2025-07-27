"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Loading } from "@/components/ui/loading";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { isAuthenticated, loading, login } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLoginError("");
    
    // Form validation
    if (!email) {
      setLoginError("Email is required");
      return;
    } else if (!password) {
      setLoginError("Password is required");
      return;
    } else if (!email.includes('@')) {
      setLoginError("Please enter a valid email");
      return;
    }
    
    // Verify this is an admin email
    if (!email.endsWith('@admin.ospc.com')) {
      setLoginError("Only admin emails are allowed");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the login function from AdminAuthContext
      const success = await login(email, password);
      
      if (success) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setLoginError("Invalid email or password");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // User-friendly error message
      if (error.code === 'auth/invalid-credential') {
        setLoginError("Invalid email or password");
      } else if (error.code === 'auth/user-disabled') {
        setLoginError("This account has been disabled");
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError("Too many failed login attempts. Please try again later");
      } else if (error.code === 'auth/network-request-failed') {
        setLoginError("Network connection issue. Please check your internet connection");
      } else {
        setLoginError("Unable to sign in. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4 sm:p-6 md:p-8 relative">
      {/* Particles Background */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <ParticlesBackground />
      </div>
      
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-full bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          ) : (
            <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          )}
        </Button>
      </div>
      
      {/* Content with glass effect */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center mb-2 border-2 border-white/20 dark:border-blue-700/50 shadow-md">
            <span className="text-white font-bold text-lg">OS</span>
          </div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter your credentials to access the admin dashboard</p>
        </div>
        
        <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-[2px] px-6 py-8 shadow-md rounded-lg border-2 border-white/20 dark:border-gray-700/30">
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-md bg-red-50/70 border border-red-200 text-red-600 text-sm">
                {loginError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@admin.ospc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-600/50"
                  required
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Use your admin email (@admin.ospc.com)</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-600/50"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              <p>Only authorized administrators can access this area.</p>
              <Link 
                href="/" 
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Return to Main Site
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 