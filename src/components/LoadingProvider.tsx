"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

// Memoized loading overlay component
const LoadingOverlay = React.memo(({ isVisible, message }: { isVisible: boolean; message?: string }) => {
  if (!isVisible) return null;
  
  return (
    <Loading
      size="lg"
      text={message || "Loading..."}
      fullscreen={true}
      variant="primary"
    />
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>({});
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  // Calculate scrollbar width on mount to prevent layout shift
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  }, []);

  // Memoize callbacks to prevent unnecessary re-renders
  const showLoading = useCallback((msg?: string) => {
    setMessage(msg);
    setIsLoading(true);
    lockScrolling();
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setMessage(undefined);
    unlockScrolling();
  }, []);

  const buttonLoading = useCallback((buttonId: string) => {
    return !!loadingButtons[buttonId];
  }, [loadingButtons]);

  const startButtonLoading = useCallback((buttonId: string) => {
    setLoadingButtons((prev) => ({ ...prev, [buttonId]: true }));
  }, []);

  const stopButtonLoading = useCallback((buttonId: string) => {
    setLoadingButtons((prev) => ({ ...prev, [buttonId]: false }));
  }, []);

  const lockScrolling = useCallback(() => {
    if (typeof document !== 'undefined' && !isScrollLocked) {
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('lock-scroll');
      setIsScrollLocked(true);
    }
  }, [isScrollLocked]);

  const unlockScrolling = useCallback(() => {
    if (typeof document !== 'undefined' && isScrollLocked) {
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('lock-scroll');
      setIsScrollLocked(false);
    }
  }, [isScrollLocked]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    showLoading,
    hideLoading,
    isLoading,
    buttonLoading,
    startButtonLoading,
    stopButtonLoading,
    lockScrolling,
    unlockScrolling,
    isScrollLocked
  }), [
    showLoading, 
    hideLoading, 
    isLoading, 
    buttonLoading, 
    startButtonLoading, 
    stopButtonLoading,
    lockScrolling,
    unlockScrolling,
    isScrollLocked
  ]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={message} />
    </LoadingContext.Provider>
  );
} 