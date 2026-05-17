import { supabase } from '@/integrations/supabase/client';

// ─── Image compression ────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const COMPRESS_THRESHOLD = 1 * 1024 * 1024;
const MAX_WIDTH = 1920;

async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

// ─── Upload a single image to Supabase Storage ───────────────────────────────

export async function uploadPropertyImage(
  officeId: string,
  propertyId: string,
  file: File,
): Promise<string | null> {
  if (file.size > MAX_UPLOAD_BYTES) return null;

  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop() ?? 'jpg';
  const path = `${officeId}/${propertyId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(path, compressed, { upsert: false });

  if (error || !data) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from('property-images').getPublicUrl(data.path);

  return publicUrl;
}

// ─── Insert a property_images row ────────────────────────────────────────────

export async function insertPropertyImage(row: {
  property_id: string;
  image_url: string;
  is_cover: boolean;
}): Promise<void> {
  const { error } = await supabase.from('property_images').insert(row);
  if (error) throw new Error(error.message);
}
