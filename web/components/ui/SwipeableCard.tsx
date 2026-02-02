"use client";

import { useState, useRef, TouchEvent } from "react";

interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  color: "red" | "green" | "blue" | "yellow";
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
}

const colorClasses = {
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
};

export default function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className = "",
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const threshold = 80;

  function handleTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setSwiping(true);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 120;
    const boundedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    // Only allow swipe in direction where action exists
    if (diff > 0 && !leftAction) return;
    if (diff < 0 && !rightAction) return;
    
    setOffset(boundedOffset);
  }

  function handleTouchEnd() {
    setSwiping(false);
    
    if (offset > threshold && leftAction) {
      leftAction.onAction();
    } else if (offset < -threshold && rightAction) {
      rightAction.onAction();
    }
    
    setOffset(0);
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action Background */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 ${colorClasses[leftAction.color]} transition-opacity`}
          style={{
            width: Math.max(0, offset),
            opacity: offset > 0 ? Math.min(1, offset / threshold) : 0,
          }}
        >
          <span className="text-white text-sm font-medium flex items-center gap-2">
            {leftAction.icon}
            {offset > threshold && leftAction.label}
          </span>
        </div>
      )}

      {/* Right Action Background */}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 ${colorClasses[rightAction.color]} transition-opacity`}
          style={{
            width: Math.max(0, -offset),
            opacity: offset < 0 ? Math.min(1, -offset / threshold) : 0,
          }}
        >
          <span className="text-white text-sm font-medium flex items-center gap-2">
            {offset < -threshold && rightAction.label}
            {rightAction.icon}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-white dark:bg-zinc-800 transition-transform touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
