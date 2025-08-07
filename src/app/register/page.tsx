"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registrationSchema, type RegistrationFormData } from "@/lib/schemas";
import { registerUser, getUserDocument } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";

export default function RegisterPage() {
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
            <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-transparent bg-clip-text">Create an Account</h1>
            <RegistrationForm />
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
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

// Registration form component
function RegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });
  
  const password = watch("password", "");

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const { name, email, password, regNo, phone } = data;
      
      // Clean the email (remove spaces, convert to lowercase)
      const cleanEmail = email.trim().toLowerCase();
      
      // Check if the email is from VIT (@vitstudent.ac.in)
      if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
        setError("Please use your VIT student email (@vitstudent.ac.in)");
        setIsSubmitting(false);
        return;
      }
      
      // Register the user
      await registerUser(cleanEmail, password, {
        name: name,
        email: cleanEmail,
        regNo: regNo,
        phone: phone
      });
      
      // Show success message
      setSuccessMessage("Account created successfully! Please check your email for verification.");
      
      // Redirect to email verification page immediately without delay
      router.push("/verify-email");
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Unable to create account. Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="font-sans">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </Label>
          <Input 
            id="name" 
            {...register("name")} 
            placeholder="Your full name" 
            className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="regNo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Registration No.
            </Label>
            <Input 
              id="regNo" 
              {...register("regNo")} 
              placeholder="e.g., 21BCE1234" 
              className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
            />
            {errors.regNo && <p className="text-xs text-red-500 mt-1">{errors.regNo.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </Label>
            <Input 
              id="phone" 
              type="tel"
              {...register("phone")} 
              placeholder="Your 10-digit number" 
              className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </Label>
          <Input 
            id="email" 
            type="email" 
            {...register("email")} 
            placeholder="you@vitstudent.ac.in" 
            className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              {...register("password")} 
              placeholder="Create a strong password" 
              className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 pr-10 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
            />
            <button 
              type="button" 
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </Label>
          <div className="relative">
            <Input 
              id="confirm-password" 
              type={showConfirmPassword ? "text" : "password"} 
              {...register("confirmPassword")} 
              placeholder="Confirm your password" 
              className="h-10 bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-700/50 pr-10 focus:border-primary focus:ring-primary/20 dark:text-gray-100" 
            />
            <button 
              type="button" 
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>
        
        {error && <p className="text-xs text-center text-red-500">{error}</p>}
        {successMessage && <p className="text-xs text-center text-green-500">{successMessage}</p>}
        
        <Button 
          type="submit" 
          className="w-full h-10" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </div>
  );
} 