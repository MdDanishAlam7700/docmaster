'use client';

import { Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border/40 bg-background/60 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onMenuClick} aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary shadow flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold tracking-tight font-heading">Doc Master</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
