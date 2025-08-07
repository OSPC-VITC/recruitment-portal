"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originalX: number;
  originalY: number;
  size: number;
  opacity: number;
  color: string;
  baseOpacity: number;
  speed: number;
  angle: number;
  angleSpeed: number;
}

// Create a safe theme hook that returns a default value if outside ThemeProvider
const useSafeTheme = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [safeTheme, setSafeTheme] = useState('light');
  
  useEffect(() => {
    setIsMounted(true);
    
    // Function to detect theme
    const detectTheme = () => {
      // First check the document class for dark mode
      if (document.documentElement.classList.contains('dark')) {
        setSafeTheme('dark');
      } else {
        setSafeTheme('light');
      }
    };
    
    // Check theme immediately
    if (typeof window !== 'undefined') {
      detectTheme();
      
      // Set up a MutationObserver to watch for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            detectTheme();
          }
        });
      });
      
      // Start observing
      observer.observe(document.documentElement, { attributes: true });
      
      // Cleanup
      return () => observer.disconnect();
    }
  }, []);
  
  // Try to use the actual theme hook, but fall back to our safe theme
  try {
    const { theme } = useTheme();
    return { theme, isMounted };
  } catch (e) {
    return { theme: safeTheme, isMounted };
  }
};

const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const { theme, isMounted } = useSafeTheme();
  const lastFrameTimeRef = useRef(0);
  const targetFpsRef = useRef(30); // Lower FPS target for better performance

  useEffect(() => {
    // Don't run if not mounted yet to prevent hydration issues
    if (!isMounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    // Theme change observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && 
            (document.documentElement.classList.contains('dark') || 
             document.documentElement.classList.contains('light'))) {
          // Reinitialize particles when theme changes
          initParticles();
        }
      });
    });
    
    // Start observing document element for class changes
    observer.observe(document.documentElement, { attributes: true });

    // Detect if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Initialize particles
    const initParticles = () => {
      // Further reduce particle count on mobile and in general
      const baseDivisor = isMobile ? 18000 : 15000; // Even fewer particles
      const particleCount = Math.floor((window.innerWidth * window.innerHeight) / baseDivisor);
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        // Random starting positions across the whole canvas
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        // Lower base velocities for better performance
        const speed = Math.random() * 0.3 + 0.1; // Slower speed between 0.1 and 0.4
        const angle = Math.random() * Math.PI * 2; // Random angle in radians
        
        // Determine particle color based on theme
        let particleColor;
        let particleOpacity;
        let particleSize;
        
        if (theme === 'dark') {
          // White particles in dark mode
          particleColor = '#ffffff';
          particleOpacity = Math.random() * 0.3 + 0.1; // Lower opacity
          particleSize = Math.random() * 2 + 1; // Smaller size
        } else {
          // Blue particles in light mode with higher opacity and size
          particleColor = '#00008B';
          particleOpacity = Math.random() * 0.4 + 0.1; // Lower opacity
          particleSize = Math.random() * 2.5 + 1; // Smaller size
        }
        
        particlesRef.current.push({
          x: x,
          y: y,
          originalX: x,
          originalY: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: particleSize,
          opacity: particleOpacity,
          baseOpacity: particleOpacity,
          color: particleColor,
          speed: speed,
          angle: angle,
          angleSpeed: (Math.random() - 0.5) * 0.01 // Reduce rotation speed
        });
      }
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize particles when canvas resizes
      initParticles();
    };

    resizeCanvas();
    
    // Throttle resize event
    let resizeTimeout: number;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        resizeCanvas();
      }, 300); // Wait 300ms after resize ends
    };
    
    window.addEventListener('resize', handleResize);

    // Animation loop with FPS limiter
    const animate = (timestamp: number) => {
      // Calculate delta time for frame rate control
      const targetFrameTime = 1000 / targetFpsRef.current; // ms per frame
      const elapsed = timestamp - lastFrameTimeRef.current;
      
      // Only render if enough time has passed for target FPS
      if (elapsed > targetFrameTime) {
        lastFrameTimeRef.current = timestamp - (elapsed % targetFrameTime);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Increment time for animation effects
        timeRef.current += 0.005;
  
        particlesRef.current.forEach((particle, index) => {
          // Apply natural movement patterns with reduced calculations
          particle.angle += particle.angleSpeed;
          
          // Simplified wave motion - calculate wave only for visible particles
          if (particle.x >= 0 && particle.x <= canvas.width && 
              particle.y >= 0 && particle.y <= canvas.height) {
            const waveX = Math.sin(timeRef.current + index * 0.2) * 0.2;
            const waveY = Math.cos(timeRef.current + index * 0.2) * 0.2;
            
            particle.vx += waveX * 0.01;
            particle.vy += waveY * 0.01;
          }
          
          // Return to normal state gradually
          particle.opacity = Math.max(particle.baseOpacity, particle.opacity - 0.01);
          
          // Gentle pull back to original position for more movement
          const returnForce = 0.0003;
          particle.vx += (particle.originalX - particle.x) * returnForce;
          particle.vy += (particle.originalY - particle.y) * returnForce;
  
          // Apply friction - slightly reduced to allow more movement
          particle.vx *= 0.99;
          particle.vy *= 0.99;
  
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
  
          // Boundary handling with wrapping rather than bouncing
          if (particle.x < -50) {
            particle.x = canvas.width + 50;
            particle.originalX = particle.x;
          } 
          if (particle.x > canvas.width + 50) {
            particle.x = -50;
            particle.originalX = particle.x;
          }
          if (particle.y < -50) {
            particle.y = canvas.height + 50;
            particle.originalY = particle.y;
          }
          if (particle.y > canvas.height + 50) {
            particle.y = -50; 
            particle.originalY = particle.y;
          }
  
          // Calculate alpha value as hex
          const alphaHex = Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
          
          // Draw particle with glow effect
          const glowIntensity = theme === 'dark' ? 1.5 : 2.0; // Higher glow intensity for light mode
          
          // Outer glow - adjusted for theme
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + (theme === 'dark' ? '10' : '20'); // Reduced glow
          ctx.fill();
          
          // Main particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + alphaHex;
          ctx.fill();
  
          // Reduced connections - only process every 4th particle and connect to fewer particles
          if (index % 4 === 0) {
            // Only connect to nearest few particles to reduce calculations
            const connectLimit = isMobile ? 3 : 5;
            const skipFactor = isMobile ? 6 : 4;
            
            particlesRef.current.slice(index + 1, index + 30).forEach((otherParticle, otherIndex) => {
              // Skip more connections on mobile
              if (otherIndex % skipFactor !== 0) return;
              
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Reduce connection distance
              const maxConnectionDistance = isMobile ? 80 : 100; // Reduced
              
              if (distance < maxConnectionDistance) {
                // Keep opacity but reduce line width
                const opacity = (maxConnectionDistance - distance) / maxConnectionDistance * (theme === 'dark' ? 0.3 : 0.4); // Lower opacity
                
                // Use theme-based color for connections
                const connectionColor = theme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';
                
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = `${connectionColor}${opacity})`;
                ctx.lineWidth = 0.8; // Thinner lines
                ctx.stroke();
              }
            });
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Lower FPS when window is not focused
    const handleVisibilityChange = () => {
      if (document.hidden) {
        targetFpsRef.current = 15; // Lower FPS when tab is not visible
      } else {
        targetFpsRef.current = isMobile ? 25 : 30; // Restore FPS based on device
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Disconnect observer
      observer.disconnect();
    };
  }, [isMounted, theme]); // Add theme as a dependency to re-initialize particles when theme changes

  // Use CSS to reduce canvas quality on mobile for better performance
  const canvasStyle = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      // Use valid CSS values for image rendering
      WebkitImageRendering: isMobile ? 'pixelated' : 'auto',
      imageRendering: isMobile ? 'pixelated' : 'auto',
    } as React.CSSProperties;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={canvasStyle}
    />
  );
};

export default React.memo(ParticlesBackground);