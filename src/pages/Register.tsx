import { useState, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/ui/password-input';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { governorates, areas } from '@/data/properties';
import { toast } from 'sonner';
import { ROUTES } from '@/app/route-paths';

const Register = () => {
  const { lang, t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'user' | 'office'>('user');
  const [loading, setLoading] = useState(false);
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    officeName: '',
    managerName: '',
    governorate: '',
    area: '',
    address: '',
    description: '',
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));
  const currentAreas = form.governorate ? areas[form.governorate] || [] : [];

  const slugify = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const uploadOfficeFile = useCallback(
    async (file: File, bucket: 'office-documents' | 'office-ids') => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const path = `${form.email.replace(/[^a-zA-Z0-9]/g, '_')}/${filename}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);
      return publicUrl;
    },
    [form.email],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let verificationDocumentUrl: string | undefined;
    let idDocumentUrl: string | undefined;

    if (mode === 'office') {
      try {
        if (verificationDocument) {
          verificationDocumentUrl = await uploadOfficeFile(
            verificationDocument,
            'office-documents',
          );
        }
        if (idDocument) {
          idDocumentUrl = await uploadOfficeFile(idDocument, 'office-ids');
        }
      } catch (error) {
        toast.error(lang === 'ar' ? 'فشل رفع المستندات' : 'Failed to upload documents');
        setLoading(false);
        return;
      }
    }

    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: mode,
      officeName: mode === 'office' ? form.officeName : undefined,
      managerName: mode === 'office' ? form.managerName : undefined,
      governorate: mode === 'office' ? form.governorate : undefined,
      area: mode === 'office' ? form.area : undefined,
      address: mode === 'office' ? form.address : undefined,
      description: mode === 'office' ? form.description : undefined,
      verificationDocumentUrl,
      idDocumentUrl,
    });
    setLoading(false);
    if (result.success === true) {
      // Office registrations show the "pending admin approval" toast and go home —
      // the office can't do anything until the admin approves anyway.
      // Regular users go to /verify-email so they know to check their inbox.
      if (mode === 'office') {
        toast.success(t('auth.pending'));
        navigate(ROUTES.home);
      } else {
        toast.success(
          lang === 'ar'
            ? 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني.'
            : 'Account created. Check your email.',
        );
        navigate(ROUTES.verifyEmail, { state: { email: form.email } });
      }
    } else {
      toast.error(result.error);
    }
  };

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-card">
        <h1 className="mb-4 text-center text-2xl font-bold">{t('auth.register')}</h1>

        {/* Mode toggle */}
        <div className="mb-6 flex rounded-lg bg-secondary p-1">
          <button
            onClick={() => setMode('user')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === 'user' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            {t('auth.as_user')}
          </button>
          <button
            onClick={() => setMode('office')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === 'office' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
          >
            {t('auth.as_office')}
          </button>
        </div>

        {mode === 'user' && (
          <>
            <GoogleSignInButton
              className="w-full"
              label={lang === 'ar' ? 'التسجيل باستخدام جوجل' : 'Sign up with Google'}
            />
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">
                {lang === 'ar' ? 'أو' : 'or'}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'user' ? (
            <div>
              <Label htmlFor="reg-name">{t('auth.name')}</Label>
              <Input
                id="reg-name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="reg-office-name">{t('auth.office_name')}</Label>
                <Input
                  id="reg-office-name"
                  name="organization"
                  autoComplete="organization"
                  value={form.officeName}
                  onChange={(e) => update('officeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reg-manager-name">{t('auth.manager_name')}</Label>
                <Input
                  id="reg-manager-name"
                  name="manager-name"
                  autoComplete="name"
                  value={form.managerName}
                  onChange={(e) => update('managerName', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="reg-email">{t('auth.email')}</Label>
            <Input
              id="reg-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-phone">{t('auth.phone')}</Label>
            <Input
              id="reg-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-password">{t('auth.password')}</Label>
            <PasswordInput
              id="reg-password"
              name="new-password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === 'ar' ? '8 أحرف على الأقل' : 'At least 8 characters'}
            </p>
          </div>

          {mode === 'office' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reg-governorate">{t('gov.label')}</Label>
                  <select
                    id="reg-governorate"
                    name="governorate"
                    autoComplete="address-level1"
                    value={form.governorate}
                    onChange={(e) => update('governorate', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t('common.select')}</option>
                    {governorates.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g[lang]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="reg-area">{t('filter.area')}</Label>
                  <select
                    id="reg-area"
                    name="area"
                    autoComplete="address-level2"
                    value={form.area}
                    onChange={(e) => update('area', e.target.value)}
                    className={selectClass}
                    disabled={!form.governorate}
                  >
                    <option value="">{t('common.select')}</option>
                    {currentAreas.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="reg-address">{t('auth.address')}</Label>
                <Input
                  id="reg-address"
                  name="street-address"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reg-description">{t('auth.description')}</Label>
                <Textarea
                  id="reg-description"
                  name="description"
                  autoComplete="off"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="reg-verification-document">
                  {lang === 'ar' ? 'المستند الرسمي للتحقق' : 'Official Verification Document'}
                </Label>
                <input
                  id="reg-verification-document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setVerificationDocument(e.target.files?.[0] ?? null)}
                  className={selectClass}
                />
                {verificationDocument && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lang === 'ar' ? 'ملف محدد:' : 'Selected file:'} {verificationDocument.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="reg-id-document">
                  {lang === 'ar' ? 'صورة الهوية' : 'Personal ID Image'}
                </Label>
                <input
                  id="reg-id-document"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => setIdDocument(e.target.files?.[0] ?? null)}
                  className={selectClass}
                />
                {idDocument && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lang === 'ar' ? 'ملف محدد:' : 'Selected file:'} {idDocument.name}
                  </p>
                )}
              </div>
            </>
          )}

          <Button
            type="submit"
            className="gradient-primary w-full text-primary-foreground"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.register')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.has_account')}{' '}
          <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
