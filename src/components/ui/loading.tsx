"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  /** Size of the loading spinner: 'sm', 'md', 'lg' */
  size?: "sm" | "md" | "lg";
  /** Text to display below the spinner */
  text?: string;
  /** Whether to show the loading spinner in fullscreen mode */
  fullscreen?: boolean;
  /** The variant of the spinner: 'default', 'primary', 'secondary' */
  variant?: "default" | "primary" | "secondary";
  /** Additional CSS classes */
  className?: string;
}

export function Loading({
  size = "md",
  text,
  fullscreen = false,
  variant = "primary",
  className,
}: LoadingProps) {
  // Size mappings
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-2",
    lg: "w-16 h-16 border-4",
  };

  // Variant mappings
  const variantClasses = {
    default: "border-t-gray-700 dark:border-t-gray-300",
    primary: "border-t-blue-600 dark:border-t-blue-400",
    secondary: "border-t-amber-600 dark:border-t-amber-400",
  };

  // Text size mappings
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const containerClasses = fullscreen
    ? "fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "rounded-full border-t-transparent border-solid animate-spin",
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
        {text && (
          <p className={cn("text-gray-600 dark:text-gray-400", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4 animate-pulse", className)}>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("w-full animate-pulse", className)}>
      {/* Header */}
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-t-md mb-2"></div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-12 bg-gray-100 dark:bg-gray-900 mb-1 rounded-sm"
        ></div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 3, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("w-full space-y-6 animate-pulse", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded"></div>
        </div>
      ))}
    </div>
  );
} 