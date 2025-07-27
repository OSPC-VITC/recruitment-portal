"use client";

import React from 'react';

interface MainParticlesLayoutProps {
  children: React.ReactNode;
}

const MainParticlesLayout: React.FC<MainParticlesLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full">
      {/* The particles background is now provided by the main layout.tsx */}
      
      {/* Fully transparent content container */}
      <div className="relative z-10 bg-transparent w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default MainParticlesLayout; 