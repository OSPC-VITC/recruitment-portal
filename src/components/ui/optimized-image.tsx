"use client";

import Image from "next/image";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
  onLoad,
  ...props
}: OptimizedImageProps & React.HTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn(
      "overflow-hidden",
      fill ? "relative w-full h-full" : "",
      className
    )}>
      <Image
        src={src}
        alt={alt || ""}
        width={fill ? undefined : (width || 100)}
        height={fill ? undefined : (height || 100)}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={cn(
          "transition-all duration-300",
          isLoading ? "scale-110 blur-md" : "scale-100 blur-0"
        )}
        onLoadingComplete={() => {
          setIsLoading(false);
          if (onLoad) onLoad();
        }}
        {...props}
      />
    </div>
  );
};

export { OptimizedImage }; 