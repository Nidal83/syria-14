import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Building2, Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { PATHS } from '@/routes/paths';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const ACCEPTED_DOC = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_MB = 5;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const baseFields = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  confirmPassword: z.string(),
});

const baseSchema = baseFields.refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type UserFormData = z.infer<typeof baseSchema>;

const officeFields = baseFields.extend({
  officeName: z.string().min(2),
  city: z.string().optional(),
  officeDescription: z.string().optional(),
});

const officeSchema = officeFields.refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type OfficeFormData = z.infer<typeof officeSchema>;

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Document upload area ─────────────────────────────────────────────────────

function DocUploadArea({
  label,
  file,
  onFile,
  required,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_DOC.includes(f.type)) {
      toast.error('يرجى رفع صورة أو ملف PDF');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`الحجم الأقصى ${MAX_MB}MB`);
      return;
    }
    onFile(f);
    e.target.value = '';
  }

  const isImage = file && file.type.startsWith('image/');

  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
        {!required && (
          <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>
        )}
      </Label>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-12 w-12 rounded-lg border border-border/40 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <span className="flex-1 truncate text-sm text-foreground/80">{file.name}</span>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="rounded-md p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border/50 p-4 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/80">{label}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, PDF — max {MAX_MB}MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_DOC.join(',')}
            className="sr-only"
            onChange={handleChange}
          />
        </button>
      )}
    </div>
  );
}

// ─── Password field ───────────────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  registration,
  error,
}: {
  id: string;
  label: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? 'text' : 'password'} className="pe-10" {...registration} />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Type selection card ──────────────────────────────────────────────────────

function TypeCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border/50 bg-white hover:border-primary/40 hover:bg-muted/30',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-xl transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className={cn('text-base font-bold', selected ? 'text-primary' : 'text-foreground')}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {selected && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

// ─── USER registration form ───────────────────────────────────────────────────

function UserRegisterForm() {
  const { t } = useI18n();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(baseSchema),
  });

  async function onSubmit(data: UserFormData) {
    setSubmitError('');
    const result = await registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    if (result.success === false) {
      setSubmitError(result.error);
      return;
    }
    navigate(PATHS.login, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="u-name">{t.auth.fullName}</Label>
        <Input id="u-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="u-email">{t.auth.email}</Label>
        <Input
          id="u-email"
          type="email"
          {...register('email')}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="u-phone">{t.auth.phone}</Label>
        <Input
          id="u-phone"
          type="tel"
          {...register('phone')}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <PasswordField
        id="u-password"
        label={t.auth.password}
        registration={register('password')}
        error={errors.password?.message}
      />
      <PasswordField
        id="u-confirm"
        label={t.auth.confirmPassword}
        registration={register('confirmPassword')}
        error={errors.confirmPassword?.message}
      />

      {submitError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <User className="h-4 w-4" />
        {isSubmitting ? t.common.loading : t.auth.register}
      </Button>
    </form>
  );
}

// ─── OFFICE registration form ─────────────────────────────────────────────────

function OfficeRegisterForm() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [city, setCity] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
  });

  const officeName = watch('officeName') ?? '';

  async function onSubmit(data: OfficeFormData) {
    if (!city) {
      setSubmitError('يرجى اختيار المدينة');
      return;
    }
    if (!docFile) {
      setSubmitError('يرجى رفع وثيقة الشركة الرسمية');
      return;
    }
    if (!idFile) {
      setSubmitError('يرجى رفع وثيقة الهوية');
      return;
    }

    setSubmitError('');

    // 1. Create auth account
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, phone: data.phone } },
    });

    if (authErr || !authData.user) {
      setSubmitError(authErr?.message ?? t.errors.generic);
      return;
    }

    const userId = authData.user.id;

    // 2. Sign in to get active session for storage uploads
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInErr) {
      // Session might already be active (auto-confirm enabled)
    }

    // 3. Upload documents
    async function uploadFile(file: File, bucket: string): Promise<string | null> {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { data: d, error: e } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });
      if (e || !d) return null;
      return supabase.storage.from(bucket).getPublicUrl(d.path).data.publicUrl;
    }

    const [documentUrl, idDocumentUrl] = await Promise.all([
      uploadFile(docFile, 'office-documents'),
      uploadFile(idFile, 'office-ids'),
    ]);

    // 4. Submit office application
    const slug = toSlug(officeName || data.officeName);
    const { error: appErr } = await supabase.from('office_applications').insert({
      user_id: userId,
      office_name: data.officeName.trim(),
      office_slug: slug,
      phone: data.phone.trim(),
      city,
      description: data.officeDescription?.trim() ?? '',
      document_url: documentUrl,
      id_document_url: idDocumentUrl,
      status: 'pending_review',
    });

    if (appErr) {
      setSubmitError(appErr.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="space-y-5 py-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">تم إرسال طلبك بنجاح!</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            سيتم مراجعة طلبك من قبل فريق سيريا 14 وسيتم إشعارك عند الموافقة.
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate(PATHS.login)}>
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* ── Account info ── */}
      <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          بيانات الحساب
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="o-name">{t.auth.fullName}</Label>
          <Input id="o-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="o-email">{t.auth.email}</Label>
            <Input
              id="o-email"
              type="email"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-phone">{t.auth.phone}</Label>
            <Input
              id="o-phone"
              type="tel"
              {...register('phone')}
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            id="o-password"
            label={t.auth.password}
            registration={register('password')}
            error={errors.password?.message}
          />
          <PasswordField
            id="o-confirm"
            label={t.auth.confirmPassword}
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>
      </div>

      {/* ── Office info ── */}
      <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          بيانات المكتب
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="o-office-name">
              {t.office.officeName} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="o-office-name"
              {...register('officeName')}
              aria-invalid={Boolean(errors.officeName)}
            />
            {errors.officeName && (
              <p className="text-xs text-destructive">{errors.officeName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              {t.office.city} <span className="text-destructive">*</span>
            </Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
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

        <div className="space-y-1.5">
          <Label htmlFor="o-desc">{t.office.description}</Label>
          <Textarea id="o-desc" rows={2} {...register('officeDescription')} />
        </div>
      </div>

      {/* ── Documents ── */}
      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            الوثائق الرسمية
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">مطلوبة لمراجعة وقبول الطلب</p>
        </div>

        <DocUploadArea
          label="السجل التجاري أو وثيقة الشركة الرسمية"
          file={docFile}
          onFile={setDocFile}
          required
        />
        <DocUploadArea label="وثيقة الهوية الشخصية" file={idFile} onFile={setIdFile} required />
      </div>

      {submitError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <Building2 className="h-4 w-4" />
        {isSubmitting ? t.common.loading : 'تسجيل وتقديم طلب المكتب'}
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { t } = useI18n();
  const [accountType, setAccountType] = useState<'user' | 'office' | null>(null);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Logo className="mx-auto justify-center" />
        </div>

        {/* Type selection */}
        <div>
          <h1 className="mb-1 text-center text-xl font-bold text-foreground">{t.auth.register}</h1>
          <p className="mb-4 text-center text-sm text-muted-foreground">اختر نوع الحساب للمتابعة</p>

          <div className="flex gap-3">
            <TypeCard
              selected={accountType === 'user'}
              onClick={() => setAccountType('user')}
              icon={User}
              title="مستخدم عادي"
              description="للأفراد الراغبين في البحث عن عقارات وحفظ المفضلة"
            />
            <TypeCard
              selected={accountType === 'office'}
              onClick={() => setAccountType('office')}
              icon={Building2}
              title="مكتب عقاري"
              description="للمكاتب الراغبة في نشر عقاراتها وإدارة قوائمها"
            />
          </div>
        </div>

        {/* Form — shown only after type selection */}
        {accountType && (
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                {accountType === 'user' ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Building2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <h2 className="text-base font-bold">
                {accountType === 'user' ? 'إنشاء حساب مستخدم' : 'تسجيل مكتب عقاري'}
              </h2>
            </div>

            {accountType === 'user' ? <UserRegisterForm /> : <OfficeRegisterForm />}
          </div>
        )}

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          {t.auth.hasAccount}{' '}
          <Link to={PATHS.login} className="font-medium text-primary hover:underline">
            {t.auth.signInHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
