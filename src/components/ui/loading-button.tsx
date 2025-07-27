"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLoading } from "@/components/LoadingProvider";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  loading?: boolean;
  loadingText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export function LoadingButton({
  id,
  loading = false,
  loadingText,
  variant = "default",
  size = "default",
  children,
  onClick,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const { buttonLoading, startButtonLoading, stopButtonLoading } = useLoading();
  const [isManualLoading, setIsManualLoading] = useState(loading);
  const isLoading = buttonLoading(id) || isManualLoading;

  useEffect(() => {
    setIsManualLoading(loading);
  }, [loading]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      startButtonLoading(id);
      try {
        await Promise.resolve(onClick(e));
      } finally {
        stopButtonLoading(id);
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
} 