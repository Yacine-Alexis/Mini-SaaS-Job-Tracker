"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: MobileBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }

  function handleTouchMove(e: React.TouchEvent) {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  }

  function handleTouchEnd() {
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{ opacity: Math.max(0, 1 - dragOffset / 200) }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col transition-transform"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset > 0 ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Handle */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-safe">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
