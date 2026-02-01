"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// Breakpoints matching Tailwind defaults
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

// Hook to detect current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | "xs">("xs");
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setBreakpoint("md");
      } else if (width >= breakpoints.sm) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("xs");
      }

      setIsMobile(width < breakpoints.md);
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
      setIsDesktop(width >= breakpoints.lg);
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return { breakpoint, isMobile, isTablet, isDesktop };
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Context for breakpoint info
const BreakpointContext = createContext<{
  breakpoint: Breakpoint | "xs";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}>({
  breakpoint: "xs",
  isMobile: true,
  isTablet: false,
  isDesktop: false,
});

export function BreakpointProvider({ children }: { children: ReactNode }) {
  const breakpointInfo = useBreakpoint();
  return (
    <BreakpointContext.Provider value={breakpointInfo}>
      {children}
    </BreakpointContext.Provider>
  );
}

export function useBreakpointContext() {
  return useContext(BreakpointContext);
}

// Component that only renders on mobile
export function MobileOnly({ children }: { children: ReactNode }) {
  const { isMobile } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return isMobile ? <>{children}</> : null;
}

// Component that only renders on tablet and up
export function TabletAndUp({ children }: { children: ReactNode }) {
  const { isMobile } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return !isMobile ? <>{children}</> : null;
}

// Component that only renders on desktop
export function DesktopOnly({ children }: { children: ReactNode }) {
  const { isDesktop } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return isDesktop ? <>{children}</> : null;
}

// Responsive container with safe areas for notch devices
export function SafeAreaContainer({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`safe-area-inset ${className}`}>
      {children}
    </div>
  );
}

// Add safe area padding classes
export function SafeAreaPadding({ 
  children,
  top = false,
  bottom = false,
  left = false,
  right = false,
  className = ""
}: { 
  children: ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}) {
  const safeClasses = [
    top && "pt-safe",
    bottom && "pb-safe",
    left && "pl-safe",
    right && "pr-safe",
  ].filter(Boolean).join(" ");

  return (
    <div className={`${safeClasses} ${className}`}>
      {children}
    </div>
  );
}

// Responsive value hook - returns different values based on breakpoint
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T | undefined {
  const { breakpoint } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return values.xs ?? values.sm ?? values.md ?? values.lg ?? values.xl ?? values["2xl"];

  // Find the value for current breakpoint or fall back to smaller breakpoints
  const breakpointOrder: (Breakpoint | "xs")[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (bp in values) {
      return values[bp as keyof typeof values];
    }
  }

  return undefined;
}

// Swipe detection hook for mobile gestures
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > threshold && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -threshold && onSwipeDown) {
        onSwipeDown();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Pull to refresh hook
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold = 80
) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    setPullDistance(Math.min(distance, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

// Responsive grid component
export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = "",
}: {
  children: ReactNode;
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}) {
  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(" ");

  return (
    <div className={`grid gap-${gap} ${colClasses} ${className}`}>
      {children}
    </div>
  );
}

// Responsive stack - switches from column to row based on breakpoint
export function ResponsiveStack({
  children,
  direction = "md",
  gap = 4,
  align = "stretch",
  justify = "start",
  className = "",
}: {
  children: ReactNode;
  direction?: Breakpoint;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  className?: string;
}) {
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  }[align];

  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  }[justify];

  return (
    <div 
      className={`
        flex flex-col gap-${gap}
        ${direction === "sm" ? "sm:flex-row" : ""}
        ${direction === "md" ? "md:flex-row" : ""}
        ${direction === "lg" ? "lg:flex-row" : ""}
        ${alignClass} ${justifyClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
