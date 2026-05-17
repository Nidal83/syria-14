import { useRef, useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Upload, X, Star, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { FormMessage, FormField, FormItem } from '@/components/ui/form';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import type { CreatePropertyValues } from '../../schemas/property.schema';
import { cn } from '@/lib/utils';

const ACCEPTED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 15;

interface PhotoItem {
  file: File;
  preview: string;
}

export function PhotosSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSrcIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmitting = form.formState.isSubmitting;

  const syncToForm = useCallback(
    (items: PhotoItem[]) => {
      form.setValue(
        'images',
        items.map((p) => p.file),
        { shouldValidate: true, shouldDirty: true },
      );
    },
    [form],
  );

  function addFiles(files: FileList | null) {
    if (!files) return;
    const toAdd: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      if (photos.length + toAdd.length >= MAX_IMAGES) break;
      if (!ACCEPTED_MIME.includes(file.type)) {
        toast.error(t.property.photos.invalidType);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(t.property.photos.fileTooLarge);
        continue;
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) });
    }
    if (toAdd.length === 0) return;
    const next = [...photos, ...toAdd];
    setPhotos(next);
    syncToForm(next);
  }

  function remove(idx: number) {
    URL.revokeObjectURL(photos[idx].preview);
    const next = photos.filter((_, i) => i !== idx);
    setPhotos(next);
    syncToForm(next);
  }

  function setCover(idx: number) {
    if (idx === 0) return;
    const next = [...photos];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    setPhotos(next);
    syncToForm(next);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...photos];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setPhotos(next);
    syncToForm(next);
  }

  function moveDown(idx: number) {
    if (idx === photos.length - 1) return;
    const next = [...photos];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setPhotos(next);
    syncToForm(next);
  }

  // ── HTML5 drag-and-drop reorder ───────────────────────────────────────────

  function onDragStart(idx: number) {
    dragSrcIndex.current = idx;
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIndex(idx);
  }

  function onDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    setDragOverIndex(null);
    const src = dragSrcIndex.current;
    if (src === null || src === targetIdx) return;
    const next = [...photos];
    const [item] = next.splice(src, 1);
    next.splice(targetIdx, 0, item);
    setPhotos(next);
    syncToForm(next);
    dragSrcIndex.current = null;
  }

  function onDragEnd() {
    setDragOverIndex(null);
    dragSrcIndex.current = null;
  }

  const counter = t.property.photos.counter.replace('{n}', String(photos.length));

  return (
    <FormShell title={t.property.section.photos}>
      <div className="space-y-4">
        {/* Drop zone */}
        {photos.length < MAX_IMAGES && (
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/60 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30',
              isSubmitting && 'pointer-events-none opacity-60',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t.property.photos.dropHint}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME.join(',')}
              multiple
              className="sr-only"
              disabled={isSubmitting}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}

        {/* Counter badge + error */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{counter}</span>
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.preview}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={(e) => onDrop(e, idx)}
                onDragEnd={onDragEnd}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-lg border border-border/60 transition-opacity',
                  dragOverIndex === idx && 'ring-2 ring-primary',
                )}
              >
                <img
                  src={photo.preview}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />

                {/* Cover badge */}
                {idx === 0 && (
                  <Badge className="absolute start-1 top-1 bg-yellow-400/90 px-1 py-0.5 text-[10px] font-bold text-yellow-900 hover:bg-yellow-400/90">
                    {t.property.photos.coverBadge}
                  </Badge>
                )}

                {/* Drag handle */}
                <div className="absolute end-1 top-1 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>

                {/* Hover controls */}
                <div className="absolute inset-0 flex flex-col items-end justify-end gap-1 bg-black/40 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Set cover */}
                  {idx !== 0 && (
                    <button
                      type="button"
                      title={t.property.photos.setCover}
                      onClick={() => setCover(idx)}
                      className="rounded-full bg-black/40 p-1 text-white/80 hover:text-yellow-400"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="rounded-full bg-black/40 p-1 text-white/80 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Mobile: up/down reorder buttons */}
                <div className="absolute bottom-1 start-1 flex gap-1 sm:hidden">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="rounded bg-black/50 p-0.5 text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === photos.length - 1}
                    className="rounded bg-black/50 p-0.5 text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validation error from RHF (e.g. "at least one image required") */}
        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormShell>
  );
}
