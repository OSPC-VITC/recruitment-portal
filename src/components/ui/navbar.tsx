"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Home, 
  Menu, 
  X, 
  User, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  UserPlus,
  Moon,
  Sun
} from "lucide-react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const { user, userData, signOut, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Check if the current path is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };
  
  const mobileLinks = [
    { href: "/departments", label: "Departments" },
    { href: "/forms", label: "Forms" },
    { href: "/review", label: "Review" },
    { href: "/status", label: "Status" },
  ];
  
  return (
    <header
      className={`fixed top-0 z-40 w-full border-b bg-background/90 md:bg-background/95 backdrop-blur-none md:backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isLanding ? 'hidden md:block' : ''}`}>
      <div className="container flex h-10 md:h-12 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image 
              src="/images/ospc_logo.png" 
              alt="OSPC Logo" 
              width={24} 
              height={24} 
              className="rounded-md shadow-md"
            />
            <span className="hidden font-bold sm:inline-block text-sm">
              OSPC Recruitment
            </span>
          </Link>
        </div>
        
        {/* Mobile navigation / logo area */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Left side – Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <Image 
              src="/images/ospc_logo.png" 
              alt="OSPC Logo" 
              width={20} 
              height={20} 
              className="rounded-md shadow-md"
            />
            {/* Show text on non-landing mobile pages */}
            {!isLanding && (
              <span className="font-bold text-xs">OSPC</span>
            )}
          </Link>

          {/* Right side – Route-specific controls */}
          {isLanding ? (
            /* Landing page: just theme toggle */
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-7 h-7 p-0 rounded-full" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
          ) : (
            /* Other pages: hamburger + theme inside flex-1 section below */
            <Sheet>
              {/* <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger> */}
              <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                <Link href="/" className="flex items-center gap-2 mb-8">
                  <Image src="/images/ospc_logo.png" alt="OSPC Logo" width={24} height={24} className="rounded-md shadow-md" />
                  <span className="font-bold">OSPC Recruitment</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {/* <Link href="/" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"><Home className="h-4 w-4" />Home</Link>
                  <Link href="/forms" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"><UserPlus className="h-4 w-4" />Apply Now</Link>
                  <Link href="/status" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"><User className="h-4 w-4" />Application Status</Link> */}
                  {!user && (
                    <>
                      {!isLoginPage && (
                        <Link href="/login" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
                          <LogIn className="h-4 w-4" />Sign In
                        </Link>
                      )}
                      {!isRegisterPage && (
                        <Link href="/register" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
                          <UserPlus className="h-4 w-4" />Register
                        </Link>
                      )}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
        
        {!isLanding && (
        <div className="flex flex-1 items-center justify-end">
          {/* Mobile Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-7 h-7 p-0 rounded-full mr-2 md:hidden"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
          
          {/* User dropdown or login button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-7 w-7 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.displayName || user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email || ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/status" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Application</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialogOpen(true)} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              {!isLoginPage && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-3.5 w-3.5" />
                    Log In
                  </Link>
                </Button>
              )}
              {!isRegisterPage && (
                <Button size="sm" asChild className="hidden sm:flex">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-3.5 w-3.5" />
                    Register
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Log out</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to log out? All unsaved changes will be lost.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button onClick={() => { signOut(); setDialogOpen(false); }} className="bg-red-500 text-white hover:bg-red-600">
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}