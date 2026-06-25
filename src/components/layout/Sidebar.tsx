'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { categories, getToolsByCategory } from '@/lib/tools-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, FileText, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Image, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const categoryIcons: Record<string, typeof FileText> = {
  'pdf-tools': FileText,
  'from-pdf': ArrowUpFromLine,
  'to-pdf': ArrowDownToLine,
  'document-conversion': ArrowRightLeft,
  'image-tools': Image,
  'utilities': Wrench,
};

const categoryGradients: Record<string, string> = {
  'pdf-tools': 'from-blue-500 to-blue-400',
  'from-pdf': 'from-purple-500 to-purple-400',
  'to-pdf': 'from-emerald-500 to-emerald-400',
  'document-conversion': 'from-amber-500 to-orange-400',
  'image-tools': 'from-pink-500 to-rose-400',
  'utilities': 'from-slate-500 to-slate-400',
};

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['pdf-tools']);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-card/85 dark:bg-[#040b15]/85 backdrop-blur-xl border-r border-border/40 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold tracking-tight font-heading">Doc Master</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1.5">
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:translate-x-0.5 relative',
                pathname === '/'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              All Tools
            </Link>
            {categories.map((cat) => {
              const CatIcon = categoryIcons[cat.id] || FileText;
              const catGradient = categoryGradients[cat.id] || 'from-primary/80 to-primary';
              const catTools = getToolsByCategory(cat.id);
              const isExpanded = expandedCategories.includes(cat.id);
              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    aria-expanded={isExpanded}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:translate-x-0.5',
                      isExpanded
                        ? 'text-foreground bg-accent/40'
                        : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn('h-5 w-5 rounded bg-gradient-to-br flex items-center justify-center shadow-sm', catGradient)}>
                        <CatIcon className="h-3 w-3 text-white" />
                      </div>
                      {cat.name}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 pl-2 border-l border-border/40 space-y-0.5">
                      {catTools.map((tool) => {
                        const isActive = pathname === tool.href;
                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 hover:translate-x-0.5 relative',
                              isActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                            )}
                          >
                            <tool.icon className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', isActive ? 'text-primary scale-110' : 'text-muted-foreground')} />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t border-border/40 shrink-0">
          <span className="text-[11px] text-muted-foreground/60 block text-center">
            Powered by Next.js
          </span>
        </div>
      </aside>
    </>
  );
}
