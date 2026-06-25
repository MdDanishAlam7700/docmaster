'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms
  threshold?: number;
}

export function ScrollReveal({ children, className, delay = 0, threshold = 0.05 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setRevealed(true), delay);
          } else {
            setRevealed(true);
          }
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={cn('reveal-on-scroll', revealed && 'revealed', className)}
    >
      {children}
    </div>
  );
}
