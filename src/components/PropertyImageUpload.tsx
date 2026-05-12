import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Upload, X, Star } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyImageUploadProps {
  images: { url: string; isCover: boolean }[];
  onImagesChange: (images: { url: string; isCover: boolean }[]) => void;
  maxImages?: number;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const PropertyImageUpload = ({
  images,
  onImagesChange,
  maxImages = 6,
}: PropertyImageUploadProps) => {
  const { session } = useAuth();
  const { lang } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!session?.user) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('property-images').getPublicUrl(fileName);

      return publicUrl;
    },
    [session],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(lang === 'ar' ? `الحد الأقصى ${maxImages} صور` : `Maximum ${maxImages} images`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    const newImages: { url: string; isCover: boolean }[] = [];
    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          lang === 'ar' ? 'يُسمح فقط بصور PNG و JPEG' : 'Only PNG and JPEG images are allowed',
        );
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          lang === 'ar' ? 'حجم الصورة كبير جداً (الحد 5MB)' : 'Image too large (max 5MB)',
        );
        continue;
      }
      const url = await uploadFile(file);
      if (url) {
        newImages.push({ url, isCover: images.length === 0 && newImages.length === 0 });
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast.success(
        lang === 'ar' ? `تم رفع ${newImages.length} صورة` : `${newImages.length} image(s) uploaded`,
      );
    }

    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (images[index].isCover && updated.length > 0) {
      updated[0].isCover = true;
    }
    onImagesChange(updated);
  };

  const setCover = (index: number) => {
    const updated = images.map((img, i) => ({ ...img, isCover: i === index }));
    onImagesChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
          >
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setCover(i)}
                className={`rounded-full p-1.5 ${img.isCover ? 'bg-primary text-primary-foreground' : 'bg-card/80 text-foreground'}`}
                title={lang === 'ar' ? 'صورة الغلاف' : 'Set as cover'}
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="rounded-full bg-destructive p-1.5 text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {img.isCover && (
              <span className="absolute start-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {lang === 'ar' ? 'غلاف' : 'Cover'}
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Upload className="h-6 w-6" />
            <span className="text-xs">
              {uploading
                ? lang === 'ar'
                  ? 'جاري الرفع...'
                  : 'Uploading...'
                : lang === 'ar'
                  ? 'رفع صورة'
                  : 'Upload'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {lang === 'ar'
          ? `${images.length}/${maxImages} صور • PNG/JPEG فقط • الحد الأقصى 5MB لكل صورة`
          : `${images.length}/${maxImages} images • PNG/JPEG only • Max 5MB each`}
      </p>
    </div>
  );
};

export default PropertyImageUpload;
