import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';
import type { OfficeApplication } from '@/types/office.types';

const SYRIAN_CITIES = [
  'دمشق',
  'حلب',
  'حمص',
  'اللاذقية',
  'حماة',
  'دير الزور',
  'الرقة',
  'إدلب',
  'طرطوس',
  'الحسكة',
  'درعا',
  'السويداء',
  'القنيطرة',
];

const ACCEPTED_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_DOC = [...ACCEPTED_IMAGE, 'application/pdf'];
const MAX_MB = 5;

interface FileUploadFieldProps {
  label: string;
  hint?: string;
  accept: string[];
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  required?: boolean;
}

function FileUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  bucket,
  required,
}: FileUploadFieldProps) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!accept.includes(file.type)) {
        toast.error('File type not allowed');
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`Max file size is ${MAX_MB}MB`);
        return;
      }
      if (!profile?.id) return;

      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;

      setUploading(true);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });
      setUploading(false);

      if (error || !data) {
        toast.error(error?.message ?? 'Upload failed');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onChange(publicUrl);
    },
    [accept, bucket, onChange, profile?.id],
  );

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
        {!required && (
          <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>
        )}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          {ACCEPTED_IMAGE.includes(
            value.split('?')[0].split('.').pop() === 'pdf' ? 'application/pdf' : 'image/jpeg',
          ) ? (
            <img src={value} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
              PDF
            </div>
          )}
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {value.split('/').pop()}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? t.common.loading : label}
          </span>
          <input
            type="file"
            accept={accept.join(',')}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w؀-ۿ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  /** Pre-fill from a rejected application for re-apply */
  prefill?: Partial<OfficeApplication>;
}

export function OfficeApplicationForm({ prefill }: Props) {
  const { t } = useI18n();
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [officeName, setOfficeName] = useState(prefill?.office_name ?? '');
  const [slug, setSlug] = useState(prefill?.office_slug ?? '');
  const [phone, setPhone] = useState(prefill?.phone ?? profile?.phone ?? '');
  const [city, setCity] = useState(prefill?.city ?? '');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(prefill?.logo_url ?? null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(prefill?.document_url ?? null);
  const [idUrl, setIdUrl] = useState<string | null>(prefill?.id_document_url ?? null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(name: string) {
    setOfficeName(name);
    if (!slug || slug === toSlug(officeName)) {
      setSlug(toSlug(name));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!officeName.trim() || !slug.trim() || !phone.trim() || !city) {
      toast.error(t.common.required);
      return;
    }
    if (!profile?.id) return;

    setSubmitting(true);

    const { error } = await supabase.from('office_applications').insert({
      user_id: profile.id,
      office_name: officeName.trim(),
      office_slug: slug.trim(),
      phone: phone.trim(),
      city,
      description: description.trim(),
      logo_url: logoUrl,
      document_url: documentUrl,
      id_document_url: idUrl,
      status: 'pending_review',
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await refreshProfile();
    toast.success(t.office.applicationSubmitted);
    navigate(PATHS.officeApplicationStatus);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Office name + slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="office-name">
            {t.office.officeName} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="office-name"
            value={officeName}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="office-slug">
            {t.office.officeSlug} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="office-slug"
            value={slug}
            onChange={(e) => setSlug(toSlug(e.target.value))}
            dir="ltr"
            required
          />
          <p className="text-xs text-muted-foreground">{t.office.slugHint}</p>
        </div>
      </div>

      {/* Phone + city */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="office-phone">
            {t.office.phone} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="office-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            {t.office.city} <span className="text-destructive">*</span>
          </Label>
          <Select value={city} onValueChange={setCity} required>
            <SelectTrigger>
              <SelectValue placeholder={t.search.anyCity} />
            </SelectTrigger>
            <SelectContent>
              {SYRIAN_CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="office-desc">{t.office.description}</Label>
        <Textarea
          id="office-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* File uploads */}
      <div className="space-y-4">
        <FileUploadField
          label={t.office.uploadLogo}
          accept={ACCEPTED_IMAGE}
          value={logoUrl}
          onChange={setLogoUrl}
          bucket="office-logos"
        />
        <FileUploadField
          label={t.office.uploadDocument}
          accept={ACCEPTED_DOC}
          value={documentUrl}
          onChange={setDocumentUrl}
          bucket="office-documents"
        />
        <FileUploadField
          label={t.office.uploadId}
          accept={ACCEPTED_DOC}
          value={idUrl}
          onChange={setIdUrl}
          bucket="office-ids"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t.common.loading : t.office.applyNow}
      </Button>
    </form>
  );
}
