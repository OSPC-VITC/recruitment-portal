"use client";

import React, { useEffect, useRef } from 'react';

interface LiquidGlassEffectProps {
  className?: string;
}

const LiquidGlassEffect: React.FC<LiquidGlassEffectProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation parameters
    const bubbles: {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      color: string;
    }[] = [];

    // Create bubbles
    const createBubbles = () => {
      const bubbleCount = Math.floor((canvas.width * canvas.height) / 15000);
      
      for (let i = 0; i < bubbleCount; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 40 + 10,
          speed: Math.random() * 0.4 + 0.1,
          opacity: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? '#8b5cf6' : '#3b82f6'
        });
      }
    };

    createBubbles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Increment time
      timeRef.current += 0.01;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(30, 30, 50, 0.6)');
      gradient.addColorStop(1, 'rgba(10, 10, 30, 0.6)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bubbles
      bubbles.forEach((bubble, index) => {
        // Update position with wave-like motion
        const angle = timeRef.current + index;
        const waveX = Math.sin(angle * 0.3) * 1.5;
        
        bubble.y -= bubble.speed;
        bubble.x += waveX * 0.2;

        // Reset if out of bounds
        if (bubble.y + bubble.radius < 0) {
          bubble.y = canvas.height + bubble.radius;
          bubble.x = Math.random() * canvas.width;
        }
        
        if (bubble.x + bubble.radius < 0) {
          bubble.x = canvas.width + bubble.radius;
        } else if (bubble.x - bubble.radius > canvas.width) {
          bubble.x = -bubble.radius;
        }

        // Draw bubble with glow
        const glow = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.radius
        );
        
        glow.addColorStop(0, `${bubble.color}${Math.floor(bubble.opacity * 255).toString(16).padStart(2, '0')}`);
        glow.addColorStop(0.6, `${bubble.color}33`);
        glow.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      });

      // Add glass overlay effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width * 0.7, 0);
      ctx.lineTo(canvas.width * 0.5, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
};

export default LiquidGlassEffect; 