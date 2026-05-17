import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, Hash, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { useCurrentOffice } from '@/features/offices/hooks/use-current-office';
import { useUpdateOffice } from '@/features/offices/hooks/use-update-office';
import { useOfficeStats } from '@/features/offices/hooks/use-office-stats';
import {
  fetchGovernorates,
  fetchAreasByGovernorate,
  type Governorate,
  type Area,
} from '@/features/properties/api/properties.service';
import { useState } from 'react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  office_name: z.string().min(2),
  phone: z.string().min(7),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
  governorate_id: z.string().optional(),
  area_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Status badge ─────────────────────────────────────────────────────────────

function OfficeStageBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label =
    status === 'approved'
      ? t.office.status.approved
      : status === 'rejected'
        ? t.office.status.rejected
        : t.office.status.pending;
  const cls =
    status === 'approved'
      ? 'bg-green-600 text-white'
      : status === 'rejected'
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-amber-500 text-white';
  return <Badge className={cls}>{label}</Badge>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfficeProfilePage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();

  const { data: office, isLoading: officeLoading } = useCurrentOffice(profile?.id);
  const { data: stats, isLoading: statsLoading } = useOfficeStats(office?.id);
  const updateMutation = useUpdateOffice();

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      office_name: '',
      phone: '',
      whatsapp: '',
      address: '',
      description: '',
      governorate_id: '',
      area_id: '',
    },
  });

  // Populate form when office data loads
  useEffect(() => {
    if (!office) return;
    form.reset({
      office_name: office.office_name,
      phone: office.phone,
      whatsapp: office.whatsapp ?? '',
      address: office.address,
      description: office.description,
      governorate_id: office.governorate_id ?? '',
      area_id: office.area_id ?? '',
    });
  }, [office, form]);

  // Load governorates
  useEffect(() => {
    fetchGovernorates().then(setGovernorates);
  }, []);

  // Load areas when governorate changes
  const selectedGovId = form.watch('governorate_id');
  useEffect(() => {
    if (!selectedGovId) {
      setAreas([]);
      return;
    }
    fetchAreasByGovernorate(selectedGovId).then(setAreas);
  }, [selectedGovId]);

  function govName(g: Governorate) {
    return locale === 'ar' ? g.name_ar : g.name_en;
  }
  function areaName(a: Area) {
    return locale === 'ar' ? a.name_ar : a.name_en;
  }

  function formatDate(iso: string | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function onSubmit(values: FormValues) {
    updateMutation.mutate({
      office_name: values.office_name,
      phone: values.phone,
      whatsapp: values.whatsapp || null,
      address: values.address ?? '',
      description: values.description ?? '',
      governorate_id: values.governorate_id || null,
      area_id: values.area_id || null,
    });
  }

  if (officeLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {t.office.noOffice}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t.office.profile.title}</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left column — office card ───────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{office.office_name}</CardTitle>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {office.owner_name}
                  </p>
                </div>
              </div>
              <OfficeStageBadge status={office.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label={t.office.stats.total} value={stats.total} />
                  <StatCard label={t.office.stats.active} value={stats.active} />
                  <StatCard label={t.office.stats.hidden} value={stats.hidden} />
                  <StatCard label={t.office.stats.sold} value={stats.sold} />
                </div>
              ) : null}

              {/* Metadata */}
              <div className="space-y-2 border-t pt-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{t.office.meta.registered}:</span>
                  <span>{formatDate(office.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{t.office.meta.approved}:</span>
                  <span>—</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{t.office.meta.officeId}:</span>
                  <span className="break-all font-mono text-[10px]">{office.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column — edit form ────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.office.profile.subtitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {/* Office name */}
                  <FormField
                    control={form.control}
                    name="office_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.office.officeName}
                          <span className="ms-0.5 text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.office.phone}
                            <span className="ms-0.5 text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.office.whatsapp}
                            <span className="ms-1 text-xs text-muted-foreground">
                              ({t.common.optional})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Governorate + Area */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="governorate_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.property.field.governorate}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {governorates.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {govName(g)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="area_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.property.field.area}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ''}
                            disabled={!selectedGovId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {areas.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {areaName(a)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.property.field.address}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.office.description}
                          <span className="ms-1 text-xs text-muted-foreground">
                            ({t.common.optional})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} maxLength={1000} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t.office.form.saving}
                      </>
                    ) : (
                      t.office.form.save
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
