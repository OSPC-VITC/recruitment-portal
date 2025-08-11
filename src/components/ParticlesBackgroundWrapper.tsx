"use client";

import dynamic from 'next/dynamic';
import { createRetryableImport } from '@/lib/chunkRetry';

// Lazy load the particles background with retry mechanism
const ParticlesBackground = dynamic(
  createRetryableImport(
    () => import('@/components/ParticlesBackground'),
    { maxRetries: 2, retryDelay: 1000 }
  ),
  {
    ssr: false,
    loading: () => null // Don't render on server, no loading placeholder
  }
);

export default function ParticlesBackgroundWrapper() {
  return (
    <div className="fixed inset-0 z-5 pointer-events-auto">
      <ParticlesBackground />
    </div>
  );
} 