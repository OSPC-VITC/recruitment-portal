"use client";

import React from 'react';
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";

export default function TestParticlesPage() {
  return (
    <div className="relative min-h-screen">
      <ParticlesBackgroundWrapper />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Particles Test Page</h1>
          <p className="text-lg">You should see animated particles in the background.</p>
        </div>
      </div>
    </div>
  );
} 