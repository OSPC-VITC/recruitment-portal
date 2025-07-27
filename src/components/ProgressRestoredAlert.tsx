"use client";

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useApplicationStore } from '@/lib/store';
import { useAuth } from '@/lib/AuthContext';
import { getStoredApplicationProgress } from '@/lib/authStateHelpers';

export function ProgressRestoredAlert() {
  const [visible, setVisible] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const { user } = useAuth();
  const restoreProgress = useApplicationStore(state => state.restoreProgress);

  useEffect(() => {
    // Check if there's saved progress when user signs in
    if (user?.uid) {
      const progress = getStoredApplicationProgress(user.uid);
      if (progress) {
        setHasProgress(true);
        setVisible(true);
      }
    } else {
      setVisible(false);
      setHasProgress(false);
    }
  }, [user]);

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible || !hasProgress) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-md max-w-sm z-50 flex items-start gap-3 animate-in slide-in-from-bottom">
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
      <div>
        <h3 className="font-medium text-green-800">Application Progress Restored</h3>
        <p className="text-green-700 text-sm mt-1">
          Your previous application progress has been restored. You can continue from where you left off.
        </p>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="text-green-700 hover:text-green-900 ml-auto"
      >
        ×
      </button>
    </div>
  );
} 