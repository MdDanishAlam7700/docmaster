'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageInfo {
  index: number;
  src: string;
}

interface PageThumbnailListProps {
  file: File;
  selectable?: boolean;
  selected?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  onOrderChange?: (pages: PageInfo[]) => void;
}

const PDFJS_VERSION = '6.0.227';

function SortableThumbnail({
  page,
}: {
  page: PageInfo;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg z-50 scale-105'
      )}
    >
      <button
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <img
        src={page.src}
        alt={`Page ${page.index + 1}`}
        className="h-16 w-12 rounded object-cover border shrink-0 bg-muted"
      />
      <span className="text-sm font-medium">Page {page.index + 1}</span>
    </div>
  );
}

export function PageThumbnailList({
  file,
  selectable = false,
  selected: externalSelected,
  onSelectionChange,
  onOrderChange,
}: PageThumbnailListProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelected, setInternalSelected] = useState<Set<number>>(new Set());

  const selected = externalSelected ?? internalSelected;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;

      const bytes = await file.arrayBuffer();
      const pdf = await getDocument({ data: bytes }).promise;
      const items: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not available');
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const url = canvas.toDataURL('image/webp', 0.6);
        items.push({ index: i - 1, src: url });
      }

      if (!cancelled) {
        setPages(items);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [file]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const togglePage = useCallback((index: number) => {
    setInternalSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    onSelectionChange?.(internalSelected);
  }, [internalSelected, onSelectionChange]);

  const selectAll = useCallback(() => {
    const all = new Set(pages.map(p => p.index));
    setInternalSelected(all);
    onSelectionChange?.(all);
  }, [pages, onSelectionChange]);

  const deselectAll = useCallback(() => {
    setInternalSelected(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages(prev => {
      const oldIndex = prev.findIndex(p => p.index === active.id);
      const newIndex = prev.findIndex(p => p.index === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      onOrderChange?.(pages);
    }
  }, [pages, onOrderChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 rounded-lg border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading PDF pages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectable && pages.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
          <span className="text-muted-foreground">|</span>
          <button onClick={deselectAll} className="text-xs text-primary hover:underline">Deselect All</button>
          <span className="text-muted-foreground text-xs ml-auto">{selected.size} of {pages.length} selected</span>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {selectable ? (
          pages.map(page => (
            <label
              key={page.index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(page.index)}
                onChange={() => togglePage(page.index)}
                className="h-4 w-4 rounded border-muted-foreground/30 text-primary focus:ring-primary shrink-0 ml-2"
              />
              <img
                src={page.src}
                alt={`Page ${page.index + 1}`}
                className="h-16 w-12 rounded object-cover border shrink-0 bg-muted"
              />
              <span className="text-sm font-medium">Page {page.index + 1}</span>
            </label>
          ))
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map(p => p.index)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {pages.map(page => (
                  <SortableThumbnail key={page.index} page={page} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
