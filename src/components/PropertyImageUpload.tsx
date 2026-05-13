import { useState, useCallback } from 'react';
import { Upload, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface ImageItem {
  url: string;
  isCover: boolean;
}

interface Props {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

// Phase 2: full drag-and-drop with reorder and progress
export default function PropertyImageUpload({ images, onChange, maxImages = 10 }: Props) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Max file size is ${MAX_SIZE_MB}MB`);
        return;
      }
      if (!profile?.id) {
        toast.error('Not authenticated');
        return;
      }

      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;

      setUploading(true);
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(path, file, { upsert: false });

      setUploading(false);

      if (error || !data) {
        toast.error(error?.message ?? 'Upload failed');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-images').getPublicUrl(data.path);
      const isFirst = images.length === 0;
      onChange([...images, { url: publicUrl, isCover: isFirst }]);
    },
    [images, onChange, profile?.id],
  );

  function setCover(url: string) {
    onChange(images.map((img) => ({ ...img, isCover: img.url === url })));
  }

  function remove(url: string) {
    const next = images.filter((img) => img.url !== url);
    if (next.length > 0 && !next.some((img) => img.isCover)) {
      next[0].isCover = true;
    }
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {images.length < maxImages && (
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/60 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? t.common.loading : t.property.images}
          </span>
          <input
            type="file"
            accept={ACCEPTED.join(',')}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
        </label>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/60"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setCover(img.url)}
                  title="Set as cover"
                  className={cn(
                    'rounded-full p-1',
                    img.isCover ? 'text-yellow-400' : 'text-white/70 hover:text-white',
                  )}
                >
                  <Star className="h-4 w-4" fill={img.isCover ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(img.url)}
                  className="rounded-full p-1 text-white/70 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {img.isCover && (
                <span className="absolute start-1 top-1 rounded bg-yellow-400/90 px-1 py-0.5 text-[10px] font-bold text-yellow-900">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
