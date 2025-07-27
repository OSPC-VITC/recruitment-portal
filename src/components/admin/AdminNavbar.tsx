"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { getDepartmentName } from "@/lib/adminConfig";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutDashboard, Users, FileText, Settings, Database, Menu, X, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

// Core team has access to all sections
const CoreTeamNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
  },
  {
    name: "Applications",
    href: "/dashboard/applications",
    icon: <FileText className="w-4 h-4 mr-2" />,
  },
  {
    name: "Questions",
    href: "/dashboard/questions",
    icon: <Database className="w-4 h-4 mr-2" />,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: <Users className="w-4 h-4 mr-2" />,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-4 h-4 mr-2" />,
  },
  {
    name: "My Profile",
    href: "/dashboard/profile",
    icon: <User className="w-4 h-4 mr-2" />,
  }
];

// Department leads have limited access
const DeptLeadNavLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
  },
  {
    name: "Department Applications",
    href: "/dashboard/applications",
    icon: <FileText className="w-4 h-4 mr-2" />,
  },
  {
    name: "Department Questions",
    href: "/dashboard/questions",
    icon: <Database className="w-4 h-4 mr-2" />,
  },
  {
    name: "My Profile",
    href: "/dashboard/profile",
    icon: <User className="w-4 h-4 mr-2" />,
  }
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const { adminUser, logout, isCoreTeam, department } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Check if the current path is active
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  // Select navigation links based on role
  const navLinks = isCoreTeam ? CoreTeamNavLinks : DeptLeadNavLinks;
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 fixed top-0 w-full bg-white/30 dark:bg-gray-950/30 backdrop-blur-[2px] z-50 transition-colors duration-200">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image 
                src="/images/ospc_logo.png" 
                alt="OSPC Logo" 
                width={28} 
                height={28} 
                className="rounded-md shadow-md"
              />
              <span className="font-bold text-sm md:text-base dark:text-white">OSPC Admin</span>
            </Link>
            
            {/* External link to OSPC website */}
            <Link 
              href="https://ospcvitc.club/"
              target="_blank"
              rel="noopener noreferrer" 
              className="ml-4 text-xs text-blue-600 dark:text-blue-400 hover:underline hidden sm:block"
            >
              Visit Website
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors flex items-center ${
                  isActive(link.href)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full md:hidden"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            )}
          </Button>
          
          {/* Desktop Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full hidden md:flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            )}
          </Button>
          
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <div className="flex flex-col">
                <div className="flex items-center mb-6 mt-2 px-2">
                  <Image 
                    src="/images/ospc_logo.png" 
                    alt="OSPC Logo" 
                    width={24} 
                    height={24}
                    className="rounded-md shadow-md"
                  />
                  <span className="font-bold ml-2 text-sm">OSPC Admin</span>
                </div>
                
                {/* User info in mobile menu */}
                <div className="px-2 py-3 mb-6 border-y dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white text-xs">
                        {adminUser?.name ? getInitials(adminUser.name) : "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium dark:text-white">{adminUser?.name || "Admin"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{isCoreTeam ? 'Core Team' : department ? getDepartmentName(department) : 'Department Lead'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile navigation links */}
                <nav className="flex flex-col gap-1 px-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive(link.href)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  ))}
                  
                  {/* Additional mobile-only links */}
                  <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </button>
                  
                  <Link 
                    href="https://ospcvitc.club/"
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center px-3 py-2 text-sm rounded-md transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 mt-6"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    Visit Website
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Department badge for department leads */}
          {!isCoreTeam && department && (
            <span className="hidden md:inline-flex bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded">
              {getDepartmentName(department)}
            </span>
          )}
          
          {/* Role badge */}
          <span className="hidden md:inline-flex bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded">
            {isCoreTeam ? 'Core Team' : 'Department Lead'}
          </span>
          
          {/* User profile dropdown - visible on both mobile and desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full" size="icon">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white text-xs md:text-sm">
                    {adminUser?.name ? getInitials(adminUser.name) : "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-900 dark:border-gray-800" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none dark:text-white">{adminUser?.name || "Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground dark:text-gray-400">{adminUser?.email || "admin@example.com"}</p>
                  {!isCoreTeam && department && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getDepartmentName(department)}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer flex w-full items-center dark:text-white dark:hover:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer dark:text-white dark:hover:bg-gray-800">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 