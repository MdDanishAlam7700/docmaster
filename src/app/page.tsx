'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tools, categories, getToolsByCategory } from '@/lib/tools-data';
import type { ToolDef } from '@/lib/tools-data';
import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight, Zap, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categoryGradients: Record<string, string> = {
  'pdf-tools': 'from-blue-600 to-blue-400',
  'from-pdf': 'from-purple-600 to-purple-400',
  'to-pdf': 'from-emerald-600 to-emerald-400',
  'document-conversion': 'from-amber-600 to-orange-400',
  'image-tools': 'from-pink-600 to-rose-400',
  'utilities': 'from-slate-700 to-slate-500',
};

const categoryShadows: Record<string, string> = {
  'pdf-tools': 'shadow-blue-500/30',
  'from-pdf': 'shadow-purple-500/30',
  'to-pdf': 'shadow-emerald-500/30',
  'document-conversion': 'shadow-amber-500/30',
  'image-tools': 'shadow-pink-500/30',
  'utilities': 'shadow-slate-500/30',
};

const categoryLabels: Record<string, string> = {
  'pdf-tools': 'PDF Tools',
  'from-pdf': 'From PDF',
  'to-pdf': 'To PDF',
  'document-conversion': 'Convert',
  'image-tools': 'Image',
  'utilities': 'Utility',
};

const featuredToolIds = [
  'merge-pdf', 'compress-pdf', 'pdf-to-word',
  'word-to-pdf', 'image-to-text', 'qr-generator',
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  if (process.env.NODE_ENV === 'development' && tools.filter(t => featuredToolIds.includes(t.id)).length !== featuredToolIds.length) {
    console.warn('[DocMaster] Some featured tool IDs are missing from tools-data.ts');
  }
  const featuredTools = tools.filter(t => featuredToolIds.includes(t.id));

  const searchResults = search
    ? tools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    setSelectedIndex(-1);
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      router.push(searchResults[selectedIndex].href);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl glass-card border-primary/10 dark:border-white/5 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 p-8 md:p-12 text-center space-y-4"
        style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 12s ease infinite' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background/60 backdrop-blur-md text-xs font-semibold text-foreground/80 mb-4 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-secondary pulse-indicator shrink-0" />
            55+ Tools &middot; 100% Free &middot; No Uploads
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            All-in-One <span className="text-neon-gradient">Document Converter</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
            55+ tools to convert, merge, compress, and transform your documents.
            All processing happens in your browser &mdash; files never leave your device.
          </p>
        </div>
      </section>

      {/* Search with suggestions */}
      <div className="max-w-md mx-auto relative neon-border-glow" ref={searchRef}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => search && setShowSuggestions(true)}
          className="pl-11 h-11 glass-card bg-background/50 border-primary/15"
        />
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl glass-card border-primary/10 dark:border-white/5 bg-popover/90 backdrop-blur-xl p-1.5 shadow-2xl">
            {searchResults.map((tool, i) => (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() => setShowSuggestions(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm transition-all duration-200',
                  i === selectedIndex ? 'bg-primary/20 text-foreground font-medium' : 'text-foreground/80 hover:bg-accent/70 hover:text-foreground'
                )}
              >
                <div className="shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-primary/75 to-primary flex items-center justify-center">
                  <tool.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tool.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-secondary/10 text-secondary hover:bg-secondary/15 border-none">
                      {categoryLabels[tool.category] || tool.category}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40 mt-1">
              <span className="text-[11px] text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-muted-foreground">
                &uarr;&darr; navigate &middot; &crarr; select
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Grid */}
      {search && searchResults.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No tools found. Try a different search term.</p>
      ) : search && showSuggestions === false ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} tool{searchResults.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      ) : !search ? (
        <>
          {/* Featured Tools */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Featured Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTools.map((tool) => (
                <FeaturedToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>

          {/* Category Sections */}
          {categories.map((cat) => {
            const catTools = getToolsByCategory(cat.id);
            return (
              <section key={cat.id} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{cat.name}</h2>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : null}

      {/* Footer */}
      <footer className="text-center py-8 border-t space-y-2">
        <p className="text-sm text-muted-foreground">
          Doc Master &mdash; All files are processed locally in your browser. No uploads. Complete privacy.
        </p>
        <p className="text-xs text-muted-foreground/60">
          v1.0.0 &middot; Built with Next.js &middot; Made by Danish &middot; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolDef }) {
  const gradient = categoryGradients[tool.category] || 'from-primary to-primary/70';
  const shadow = categoryShadows[tool.category] || 'shadow-primary/30';

  return (
    <Link
      href={tool.href}
      className="group flex items-start gap-4 p-4 rounded-2xl glass-card glass-card-hover"
    >
      <div
        className={cn(
          'h-10 w-10 rounded-xl bg-gradient-to-br shadow-md shrink-0 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110',
          gradient,
          shadow
        )}
      >
        <tool.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors truncate">{tool.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}

function FeaturedToolCard({ tool }: { tool: ToolDef }) {
  const gradient = categoryGradients[tool.category] || 'from-primary to-primary/70';
  const shadow = categoryShadows[tool.category] || 'shadow-primary/30';

  return (
    <Link
      href={tool.href}
      className="group flex items-start gap-4 p-5 rounded-2xl glass-card glass-card-hover relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
      <div
        className={cn(
          'h-12 w-12 rounded-xl bg-gradient-to-br shadow-lg shrink-0 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
          gradient,
          shadow
        )}
      >
        <tool.icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 relative z-10">
        <h3 className="font-bold text-base group-hover:text-primary transition-colors">{tool.name}</h3>
        <p className="text-xs md:text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}
