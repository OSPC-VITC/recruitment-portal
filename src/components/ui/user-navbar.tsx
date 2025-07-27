"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { UserProfile } from "@/components/ui/user-profile";

export default function UserNavbar({ title = "OSPC Recruitment" }: { title?: string }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="fixed top-0 z-20 w-full p-3 bg-white/30 dark:bg-black/30 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 mb-4">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/images/ospc_logo.png" 
            alt="OSPC Logo" 
            width={28} 
            height={28}
            className="rounded-md shadow-md"
          />
          <span className="font-bold text-sm md:text-base">{title}</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-8 h-8 p-0 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {/* User Profile */}
          <UserProfile />
        </div>
      </div>
    </div>
  );
} 