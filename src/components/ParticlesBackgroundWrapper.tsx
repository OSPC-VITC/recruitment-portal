"use client";

import dynamic from 'next/dynamic';

// Lazy load the particles background in a client component
const ParticlesBackground = dynamic(
  () => import('@/components/ParticlesBackground'),
  { ssr: false, loading: () => null } // Don't render on server, no loading placeholder
);

export default function ParticlesBackgroundWrapper() {
  return (
    <div className="fixed inset-0 z-5 pointer-events-auto">
      <ParticlesBackground />
    </div>
  );
} 