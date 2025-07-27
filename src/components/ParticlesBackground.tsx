"use client";
import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    // Don't run if not mounted yet to prevent hydration issues
    if (!isMounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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

    // Initialize particles - define this function first
    const initParticles = () => {
      // Reduce particle count for less density
      const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 12000); // Even fewer particles
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        // Random starting positions across the whole canvas
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        // Higher base velocities for more movement
        const speed = Math.random() * 0.5 + 0.1; // Slower speed between 0.1 and 0.6
        const angle = Math.random() * Math.PI * 2; // Random angle in radians
        
        // Determine particle color based on theme
        let particleColor;
        let particleOpacity;
        let particleSize;
        
        if (theme === 'dark') {
          // White particles in dark mode
          particleColor = '#ffffff';
          particleOpacity = Math.random() * 0.4 + 0.1; // 0.1-0.5 opacity (more subtle)
          particleSize = Math.random() * 3 + 1; // 1-4 size (smaller)
        } else {
          // Black particles in light mode with higher opacity and size
          particleColor = '#00008B';
          particleOpacity = Math.random() * 0.5 + 0.2; // 0.2-0.7 opacity (more subtle)
          particleSize = Math.random() * 4 + 1.5; // 1.5-5.5 size (smaller)
        }
        
        particlesRef.current.push({
          x: x,
          y: y,
          originalX: x,
          originalY: y,
          // Use speed and angle for more natural movement
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          // Use theme-based size
          size: particleSize,
          // Use theme-based opacity
          opacity: particleOpacity,
          baseOpacity: particleOpacity,
          // Use theme-based color
          color: particleColor,
          // Add speed and angle properties for more dynamic movement
          speed: speed,
          angle: angle,
          angleSpeed: (Math.random() - 0.5) * 0.02 // Small random rotation
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
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Increment time for animation effects
      timeRef.current += 0.005;

      particlesRef.current.forEach((particle, index) => {
        // Apply natural movement patterns
        // Update angle with angleSpeed for rotation
        particle.angle += particle.angleSpeed;
        
        // Add some wave-like motion using sin and cos
        const waveX = Math.sin(timeRef.current + index * 0.1) * 0.3;
        const waveY = Math.cos(timeRef.current + index * 0.1) * 0.3;
        
        particle.vx += waveX * 0.02;
        particle.vy += waveY * 0.02;
        
        // Return to normal state gradually
        particle.opacity = Math.max(particle.baseOpacity, particle.opacity - 0.01);
        particle.size = Math.max(2, particle.size - 0.02);
        
        // Gentle pull back to original position for more movement
        const returnForce = 0.0005;
        particle.vx += (particle.originalX - particle.x) * returnForce;
        particle.vy += (particle.originalY - particle.y) * returnForce;

        // Apply friction - slightly reduced to allow more movement
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary handling with wrapping rather than bouncing
        // This creates a more continuous flow of particles
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
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + (theme === 'dark' ? '20' : '30'); // Stronger glow in light mode
        ctx.fill();
        
        // Main particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + alphaHex;
        ctx.fill();

        // Enhanced connections with dynamic opacity
        // Only connect to every 3rd particle to reduce connections
        particlesRef.current.slice(index + 1).forEach((otherParticle, otherIndex) => {
          // Skip 2 out of 3 potential connections
          if (otherIndex % 3 !== 0) return;
          
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Reduce connection distance
          const maxConnectionDistance = 120; // Reduced from 180
          
          if (distance < maxConnectionDistance) {
            // Keep opacity but reduce line width
            const opacity = (maxConnectionDistance - distance) / maxConnectionDistance * (theme === 'dark' ? 0.4 : 0.6); // Higher opacity for light mode
            const lineWidth = opacity * (theme === 'dark' ? 1.5 : 2.0); // Thicker lines for light mode
            
            // Use theme-based color for connections
            const connectionColor = theme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `${connectionColor}${opacity})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Disconnect observer
      observer.disconnect();
    };
  }, [isMounted, theme]); // Add theme as a dependency to re-initialize particles when theme changes

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
};

export default ParticlesBackground;