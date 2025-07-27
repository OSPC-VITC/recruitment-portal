"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Loading } from "@/components/ui/loading";

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  buttonLoading: (buttonId: string) => boolean;
  startButtonLoading: (buttonId: string) => void;
  stopButtonLoading: (buttonId: string) => void;
  lockScrolling: () => void;
  unlockScrolling: () => void;
  isScrollLocked: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoading: () => {},
  hideLoading: () => {},
  isLoading: false,
  buttonLoading: () => false,
  startButtonLoading: () => {},
  stopButtonLoading: () => {},
  lockScrolling: () => {},
  unlockScrolling: () => {},
  isScrollLocked: false,
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>({});
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  // Calculate scrollbar width on mount to prevent layout shift
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  }, []);

  const showLoading = (msg?: string) => {
    setMessage(msg);
    setIsLoading(true);
    lockScrolling();
  };

  const hideLoading = () => {
    setIsLoading(false);
    setMessage(undefined);
    unlockScrolling();
  };

  const buttonLoading = (buttonId: string) => {
    return !!loadingButtons[buttonId];
  };

  const startButtonLoading = (buttonId: string) => {
    setLoadingButtons((prev) => ({ ...prev, [buttonId]: true }));
  };

  const stopButtonLoading = (buttonId: string) => {
    setLoadingButtons((prev) => ({ ...prev, [buttonId]: false }));
  };

  const lockScrolling = () => {
    if (!isScrollLocked) {
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('lock-scroll');
      setIsScrollLocked(true);
    }
  };

  const unlockScrolling = () => {
    if (isScrollLocked) {
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('lock-scroll');
      setIsScrollLocked(false);
    }
  };

  return (
    <LoadingContext.Provider 
      value={{ 
        showLoading, 
        hideLoading, 
        isLoading, 
        buttonLoading, 
        startButtonLoading, 
        stopButtonLoading,
        lockScrolling,
        unlockScrolling,
        isScrollLocked
      }}
    >
      {children}
      {isLoading && (
        <Loading
          size="lg"
          text={message || "Loading..."}
          fullscreen={true}
          variant="primary"
        />
      )}
    </LoadingContext.Provider>
  );
} 