"use client";

import { useState } from "react";

export default function LikeToggle({
  initialLiked = false,
  onToggle,
  className = ""
}: {
  initialLiked?: boolean;
  onToggle?: (liked: boolean) => void;
  className?: string;
}) {
  const [liked, setLiked] = useState(initialLiked);

  const handleClick = () => {
    setLiked((prev) => {
      const newLiked = !prev;
      onToggle?.(newLiked);
      return newLiked;
    });
  };

  return (
    <button
      type="button"
      aria-label={liked ? "Unlike" : "Like"}
      onClick={handleClick}
      className={`transition-colors ${className}`}
    >
      {liked ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="#ef4444"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="#ef4444"
          className="w-6 h-6 drop-shadow"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.014-4.5-4.5-4.5-1.54 0-2.88.792-3.625 2.005C11.38 4.542 10.04 3.75 8.5 3.75 6.014 3.75 4 5.765 4 8.25c0 7.22 8 11 8 11s8-3.78 8-11z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="#ef4444"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.014-4.5-4.5-4.5-1.54 0-2.88.792-3.625 2.005C11.38 4.542 10.04 3.75 8.5 3.75 6.014 3.75 4 5.765 4 8.25c0 7.22 8 11 8 11s8-3.78 8-11z"
          />
        </svg>
      )}
    </button>
  );
} 