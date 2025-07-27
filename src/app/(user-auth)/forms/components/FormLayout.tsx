"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FormLayoutProps {
  children: ReactNode;
  title: string;
  onSubmit?: () => void;
  onContinue?: () => void;
  isLastForm?: boolean;
  isLastDepartment?: boolean;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  autoSaved?: boolean;
  submitLabel?: string;
  validationError?: string;
}

export function FormLayout({
  children,
  title,
  onSubmit,
  onContinue,
  isLastForm = false,
  isLastDepartment = false,
  isSubmitting = false,
  isDisabled = false,
  autoSaved = false,
  submitLabel,
  validationError
}: FormLayoutProps) {
  const router = useRouter();

  const handleAction = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">{title}</h1>
        {autoSaved && (
          <p className="text-xs md:text-sm text-green-600 mt-2 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Auto-saved
          </p>
        )}
        
        {validationError && (
          <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-md px-3 py-2 mt-4 flex items-start backdrop-blur-sm">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-red-600 dark:text-red-400">{validationError}</p>
          </div>
        )}
      </div>

      <Card className="shadow-md border-gray-200 dark:border-gray-800 bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7">
          <div className="space-y-6">{children}</div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 left-0 right-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border-t dark:border-zinc-800/50 p-4 md:p-5 flex justify-between items-center z-10 gap-3 md:gap-4 mt-6">
        <Button 
          variant="secondary" 
          type="button" 
          onClick={() => router.push("/departments")}
          className="text-xs md:text-sm h-9 md:h-10 w-full sm:w-auto min-w-[100px] max-w-[45%] overflow-hidden"
        >
          <span className="truncate">Back to Departments</span>
        </Button>
        
        {onSubmit && (
          <Button
            type="button"
            onClick={handleAction}
            disabled={isDisabled || isSubmitting}
            className="text-xs md:text-sm h-9 md:h-10 w-full sm:w-auto min-w-[100px] max-w-[55%] overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <span className="truncate mr-2">Saving</span>
                <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              </>
            ) : (
              <span className="truncate">{submitLabel || (isLastForm || isLastDepartment ? "Review Application" : "Save and Continue")}</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
} 