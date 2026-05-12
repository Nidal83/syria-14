import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Shield,
  MessageSquare,
  BarChart3,
  Home,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  Activity,
  Pencil,
  Plus,
} from 'lucide-react';
import AdminPropertyEditDialog from '@/components/AdminPropertyEditDialog';
import AddPropertyForm from '@/components/AddPropertyForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type Tab = 'overview' | 'offices' | 'properties' | 'users' | 'inquiries';

interface Office {
  id: string;
  office_name: string;
  owner_name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  governorate_id: string | null;
  area_id: string | null;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  listing_type: string;
  property_type: string;
  status: string;
  created_at: string;
  office_id: string;
  rooms: number;
  bathrooms: number;
  area_size: number;
  floor: number;
  furnished: boolean;
  address: string;
  offices?: { office_name: string } | null;
  property_images?: { image_url: string; is_cover: boolean }[];
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Inquiry {
  id: string;
  user_id: string;
  property_id: string;
  message: string;
  created_at: string;
  profiles?: { name: string; email: string; phone: string } | null;
  properties?: { title: string } | null;
}

const AdminDashboard = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [offices, setOffices] = useState<Office[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [officeFilter, setOfficeFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'property' | 'office' | 'user';
    id: string;
    name: string;
  } | null>(null);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [officesRes, propertiesRes, profilesRes, rolesRes, inquiriesRes] = await Promise.all([
      supabase.from('offices').select('*').order('created_at', { ascending: false }),
      supabase
        .from('properties')
        .select('*, offices(office_name), property_images(image_url, is_cover)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase
        .from('inquiries')
        .select('*, properties(title)')
        .order('created_at', { ascending: false }),
    ]);
    const officesData = (officesRes.data as Office[]) || [];
    console.log(`[AdminDashboard] Fetched ${officesData.length} offices`, officesData.map(o => ({ id: o.id, status: o.status, owner: o.owner_id })));
    setOffices(officesData);
    setProperties((propertiesRes.data as Property[]) || []);
    setProfiles((profilesRes.data as Profile[]) || []);
    setUserRoles((rolesRes.data as UserRole[]) || []);
    setInquiries((inquiriesRes.data as Inquiry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user || user.role !== 'admin') return null;

  // ── Helpers ──
  const getUserRole = (userId: string) =>
    userRoles.find((r) => r.user_id === userId)?.role || 'user';

  const updateUserRole = async (userId: string, role: 'user' | 'office' | 'admin') => {
    setActionLoading(userId);

    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['user', 'office', 'admin'].filter((r) => r !== role));

      if (role !== 'user') {
        const { error: insertError } = await supabase.from('user_roles').upsert(
          {
            user_id: userId,
            role,
          },
          { onConflict: ['user_id', 'role'] },
        );
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from('user_roles').upsert(
          {
            user_id: userId,
            role: 'user',
          },
          { onConflict: ['user_id', 'role'] },
        );
        if (insertError) throw insertError;
      }

      await fetchData();
      toast.success(
        lang === 'ar'
          ? 'تم تحديث الدور بنجاح'
          : 'Role updated successfully',
      );
    } catch (err) {
      console.error('Failed to update role', err);
      toast.error(lang === 'ar' ? 'فشل تحديث الدور' : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const updateOfficeStatus = async (officeId: string, status: 'approved' | 'rejected') => {
    setActionLoading(officeId);

    const { data: office, error: officeError } = await supabase
      .from('offices')
      .select('owner_id')
      .eq('id', officeId)
      .single();

    if (officeError || !office) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.from('offices').update({ status }).eq('id', officeId);
    if (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
      setActionLoading(null);
      return;
    }

    if (status === 'approved') {
      await supabase.from('user_roles').upsert({
        user_id: office.owner_id,
        role: 'office',
      }, { onConflict: ['user_id', 'role'] });
    } else {
      await supabase.from('user_roles').delete().eq('user_id', office.owner_id).eq('role', 'office');
    }

    toast.success(
      status === 'approved'
        ? lang === 'ar'
          ? 'تمت الموافقة على المكتب'
          : 'Office approved'
        : lang === 'ar'
          ? 'تم رفض المكتب'
          : 'Office rejected',
    );
    setOffices((prev) => prev.map((o) => (o.id === officeId ? { ...o, status } : o)));
    setActionLoading(null);
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    setActionLoading(propertyId);
    const { error } = await supabase.from('properties').update({ status }).eq('id', propertyId);
    if (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } else {
      const msgs: Record<string, { ar: string; en: string }> = {
        active: { ar: 'تم تفعيل العقار', en: 'Property activated' },
        rejected: { ar: 'تم رفض العقار', en: 'Property rejected' },
        inactive: { ar: 'تم إلغاء تفعيل العقار', en: 'Property deactivated' },
      };
      toast.success(msgs[status]?.[lang] || 'Updated');
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, status } : p)));
    }
    setActionLoading(null);
  };

  const deleteProperty = async (id: string) => {
    setActionLoading(id);
    // Delete images first, then property
    await supabase.from('property_images').delete().eq('property_id', id);
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed');
    } else {
      toast.success(lang === 'ar' ? 'تم حذف العقار' : 'Property deleted');
      setProperties((prev) => prev.filter((p) => p.id !== id));
    }
    setActionLoading(null);
    setDeleteDialog(null);
  };

  const deleteOffice = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('offices').delete().eq('id', id);
    if (error) {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed');
    } else {
      toast.success(lang === 'ar' ? 'تم حذف المكتب' : 'Office deleted');
      setOffices((prev) => prev.filter((o) => o.id !== id));
    }
    setActionLoading(null);
    setDeleteDialog(null);
  };

  const deleteUser = async (id: string) => {
    setActionLoading(id);
    try {
      await supabase.from('inquiries').delete().eq('user_id', id);
      await supabase.from('favorites').delete().eq('user_id', id);
      await supabase.from('offices').delete().eq('owner_id', id);
      await supabase.from('user_roles').delete().eq('user_id', id);
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        throw error;
      }
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setUserRoles((prev) => prev.filter((r) => r.user_id !== id));
      setOffices((prev) => prev.filter((o) => o.owner_id !== id));
      toast.success(lang === 'ar' ? 'تم حذف المستخدم' : 'User deleted');
    } catch (err) {
      console.error('Failed to delete user', err);
      toast.error(lang === 'ar' ? 'فشل حذف المستخدم' : 'Failed to delete user');
    } finally {
      setActionLoading(null);
      setDeleteDialog(null);
    }
  };

  // ── Computed ──
  const pendingOffices = offices.filter((o) => o.status === 'pending' || o.status === 'pending_review');
  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const activeProperties = properties.filter((p) => p.status === 'active');
  const approvedOffices = offices.filter((o) => o.status === 'approved');
  const totalUsers = profiles.length;
  const officeUsers = userRoles.filter((r) => r.role === 'office').length;
  const regularUsers = userRoles.filter((r) => r.role === 'user').length;

  const filteredOffices = offices.filter((o) => {
      const isPending = o.status === 'pending' || o.status === 'pending_review';
      const matchFilter =
        officeFilter === 'all' ||
        (officeFilter === 'pending' && isPending) ||
        o.status === officeFilter;
      const matchSearch =
        !searchQuery ||
        o.office_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });

  const filteredProperties = properties.filter((p) => {
    const matchFilter = propertyFilter === 'all' || p.status === propertyFilter;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredProfiles = profiles.filter((p) => {
    return (
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // ── Status badge ──
  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-primary/10 text-primary',
      approved: 'bg-primary/10 text-primary',
      pending: 'bg-primary-gold/10 text-primary-gold',
      pending_review: 'bg-primary-gold/10 text-primary-gold',
      rejected: 'bg-destructive/10 text-destructive',
      inactive: 'bg-muted text-muted-foreground',
    };
    const labels: Record<string, { ar: string; en: string }> = {
      active: { ar: 'نشط', en: 'Active' },
      approved: { ar: 'معتمد', en: 'Approved' },
      pending: { ar: 'بانتظار', en: 'Pending' },
      pending_review: { ar: 'قيد المراجعة', en: 'Pending Review' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
    };
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || styles.inactive}`}
      >
        {labels[status]?.[lang] || status}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-destructive/10 text-destructive',
      office: 'bg-accent/20 text-accent-foreground',
      user: 'bg-secondary text-muted-foreground',
    };
    const labels: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مسؤول', en: 'Admin' },
      office: { ar: 'مكتب', en: 'Office' },
      user: { ar: 'مستخدم', en: 'User' },
    };
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[role] || styles.user}`}
      >
        {labels[role]?.[lang] || role}
      </span>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: BarChart3 },
    {
      key: 'offices',
      label: lang === 'ar' ? 'المكاتب' : 'Offices',
      icon: Building2,
      badge: pendingOffices.length,
    },
    {
      key: 'properties',
      label: lang === 'ar' ? 'العقارات' : 'Properties',
      icon: Home,
      badge: pendingProperties.length,
    },
    { key: 'users', label: lang === 'ar' ? 'المستخدمون' : 'Users', icon: Users },
    {
      key: 'inquiries',
      label: lang === 'ar' ? 'الاستفسارات' : 'Inquiries',
      icon: MessageSquare,
      badge: inquiries.length,
    },
  ];

  if (showAddForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AddPropertyForm
          isAdmin
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {lang === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'إدارة كاملة للموقع' : 'Full website management'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="gradient-primary text-primary-foreground"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="me-2 h-4 w-4" /> {t('dash.add_property')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={loading}>
              <RefreshCw className={`me-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {lang === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-secondary p-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ════════════════ OVERVIEW ════════════════ */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    {
                      label: lang === 'ar' ? 'إجمالي العقارات' : 'Total Properties',
                      value: properties.length,
                      icon: Home,
                      color: 'text-primary',
                      bg: 'bg-primary/10',
                    },
                    {
                      label: lang === 'ar' ? 'العقارات النشطة' : 'Active Properties',
                      value: activeProperties.length,
                      icon: CheckCircle,
                      color: 'text-primary',
                      bg: 'bg-primary/10',
                    },
                    {
                      label: lang === 'ar' ? 'إجمالي المكاتب' : 'Total Offices',
                      value: offices.length,
                      icon: Building2,
                      color: 'text-accent-foreground',
                      bg: 'bg-accent/20',
                    },
                    {
                      label: lang === 'ar' ? 'المكاتب المعتمدة' : 'Approved Offices',
                      value: approvedOffices.length,
                      icon: UserCheck,
                      color: 'text-primary',
                      bg: 'bg-primary/10',
                    },
                    {
                      label: lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
                      value: totalUsers,
                      icon: Users,
                      color: 'text-accent-foreground',
                      bg: 'bg-accent/20',
                    },
                    {
                      label: lang === 'ar' ? 'مستخدمون عاديون' : 'Regular Users',
                      value: regularUsers,
                      icon: Users,
                      color: 'text-muted-foreground',
                      bg: 'bg-secondary',
                    },
                    {
                      label: lang === 'ar' ? 'مكاتب بانتظار' : 'Pending Offices',
                      value: pendingOffices.length,
                      icon: Clock,
                      color: 'text-primary-gold',
                      bg: 'bg-primary-gold/10',
                    },
                    {
                      label: lang === 'ar' ? 'عقارات بانتظار' : 'Pending Properties',
                      value: pendingProperties.length,
                      icon: AlertTriangle,
                      color: 'text-destructive',
                      bg: 'bg-destructive/10',
                    },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-card p-5 shadow-card">
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${s.bg}`}>
                          <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pending sections */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Pending offices */}
                  <div className="rounded-xl bg-card p-5 shadow-card">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Clock className="h-5 w-5 text-primary-gold" />
                      {lang === 'ar' ? 'مكاتب بانتظار الموافقة' : 'Pending Offices'}
                      <span className="text-sm text-muted-foreground">
                        ({pendingOffices.length})
                      </span>
                    </h2>
                    {pendingOffices.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {lang === 'ar' ? 'لا توجد طلبات' : 'No pending requests'}
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-3 overflow-y-auto">
                        {pendingOffices.map((office) => (
                          <div
                            key={office.id}
                            className="flex items-center justify-between rounded-lg bg-secondary p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{office.office_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {office.owner_name} • {office.phone}
                              </p>
                            </div>
                            <div className="flex flex-shrink-0 gap-1.5">
                              <Button
                                size="sm"
                                className="gradient-primary h-8 text-primary-foreground"
                                disabled={actionLoading === office.id}
                                onClick={() => updateOfficeStatus(office.id, 'approved')}
                              >
                                {actionLoading === office.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive"
                                disabled={actionLoading === office.id}
                                onClick={() => updateOfficeStatus(office.id, 'rejected')}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending properties */}
                  <div className="rounded-xl bg-card p-5 shadow-card">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Clock className="h-5 w-5 text-primary-gold" />
                      {lang === 'ar' ? 'عقارات بانتظار الموافقة' : 'Pending Properties'}
                      <span className="text-sm text-muted-foreground">
                        ({pendingProperties.length})
                      </span>
                    </h2>
                    {pendingProperties.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {lang === 'ar' ? 'لا توجد طلبات' : 'No pending requests'}
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-3 overflow-y-auto">
                        {pendingProperties.map((p) => {
                          const img =
                            p.property_images?.find((i) => i.is_cover)?.image_url ||
                            p.property_images?.[0]?.image_url;
                          return (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 rounded-lg bg-secondary p-3"
                            >
                              {img && (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-12 w-16 flex-shrink-0 rounded-lg object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{p.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.offices?.office_name || '—'} • {p.price.toLocaleString()}{' '}
                                  {t('common.syp')}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 gap-1.5">
                                <Button
                                  size="sm"
                                  className="gradient-primary h-8 text-primary-foreground"
                                  disabled={actionLoading === p.id}
                                  onClick={() => updatePropertyStatus(p.id, 'active')}
                                >
                                  {actionLoading === p.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-destructive"
                                  disabled={actionLoading === p.id}
                                  onClick={() => updatePropertyStatus(p.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-xl bg-card p-5 shadow-card">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Activity className="h-5 w-5 text-primary" />
                    {lang === 'ar' ? 'آخر النشاطات' : 'Recent Activity'}
                  </h2>
                  <div className="space-y-2">
                    {[
                      ...properties.slice(0, 3).map((p) => ({
                        type: 'property' as const,
                        title: p.title,
                        status: p.status,
                        date: p.created_at,
                      })),
                      ...offices.slice(0, 3).map((o) => ({
                        type: 'office' as const,
                        title: o.office_name,
                        status: o.status,
                        date: o.created_at,
                      })),
                    ]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 6)
                      .map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'property' ? (
                              <Home className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="max-w-[200px] truncate text-sm font-medium">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.date)}
                              </p>
                            </div>
                          </div>
                          {statusBadge(item.status)}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ OFFICES ════════════════ */}
            {tab === 'offices' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={lang === 'ar' ? 'بحث بالاسم...' : 'Search by name...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-10"
                    />
                  </div>
                  <div className="flex gap-1.5 rounded-lg bg-secondary p-1">
                    {['all', 'pending', 'approved', 'rejected'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setOfficeFilter(f)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${officeFilter === f ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {f === 'all'
                          ? lang === 'ar'
                            ? 'الكل'
                            : 'All'
                          : f === 'pending'
                            ? lang === 'ar'
                              ? 'بانتظار'
                              : 'Pending'
                            : f === 'approved'
                              ? lang === 'ar'
                                ? 'معتمد'
                                : 'Approved'
                              : lang === 'ar'
                                ? 'مرفوض'
                                : 'Rejected'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  {filteredOffices.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      {lang === 'ar' ? 'لا توجد مكاتب' : 'No offices found'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'اسم المكتب' : 'Office Name'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'المدير' : 'Owner'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('auth.phone')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('auth.email')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'التاريخ' : 'Date'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'الحالة' : 'Status'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'إجراءات' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOffices.map((office) => (
                            <tr
                              key={office.id}
                              className="border-b border-border transition-colors hover:bg-secondary/30"
                            >
                              <td className="px-4 py-3 font-medium">{office.office_name}</td>
                              <td className="px-4 py-3">{office.owner_name}</td>
                              <td className="px-4 py-3 font-mono text-xs">{office.phone}</td>
                              <td className="px-4 py-3 text-xs">{office.email}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {formatDate(office.created_at)}
                              </td>
                              <td className="px-4 py-3">{statusBadge(office.status)}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {office.status !== 'approved' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-primary"
                                      disabled={actionLoading === office.id}
                                      onClick={() => updateOfficeStatus(office.id, 'approved')}
                                    >
                                      {actionLoading === office.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        t('dash.approve')
                                      )}
                                    </Button>
                                  )}
                                  {office.status !== 'rejected' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-destructive"
                                      disabled={actionLoading === office.id}
                                      onClick={() => updateOfficeStatus(office.id, 'rejected')}
                                    >
                                      {t('dash.reject')}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-destructive"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: 'office',
                                        id: office.id,
                                        name: office.office_name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ PROPERTIES ════════════════ */}
            {tab === 'properties' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={lang === 'ar' ? 'بحث بالعنوان...' : 'Search by title...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-10"
                    />
                  </div>
                  <div className="flex gap-1.5 rounded-lg bg-secondary p-1">
                    {['all', 'pending', 'active', 'rejected', 'inactive'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setPropertyFilter(f)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${propertyFilter === f ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {f === 'all'
                          ? lang === 'ar'
                            ? 'الكل'
                            : 'All'
                          : f === 'pending'
                            ? lang === 'ar'
                              ? 'بانتظار'
                              : 'Pending'
                            : f === 'active'
                              ? lang === 'ar'
                                ? 'نشط'
                                : 'Active'
                              : f === 'rejected'
                                ? lang === 'ar'
                                  ? 'مرفوض'
                                  : 'Rejected'
                                : lang === 'ar'
                                  ? 'غير نشط'
                                  : 'Inactive'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  {filteredProperties.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      {t('search.no_results')}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'العقار' : 'Property'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('detail.office')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('detail.price')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'النوع' : 'Type'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'التفاصيل' : 'Details'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'التاريخ' : 'Date'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'الحالة' : 'Status'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'إجراءات' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map((p) => {
                            const img =
                              p.property_images?.find((i) => i.is_cover)?.image_url ||
                              p.property_images?.[0]?.image_url;
                            return (
                              <tr
                                key={p.id}
                                className="border-b border-border transition-colors hover:bg-secondary/30"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {img && (
                                      <img
                                        src={img}
                                        alt=""
                                        className="h-10 w-14 flex-shrink-0 rounded-lg object-cover"
                                      />
                                    )}
                                    <span className="max-w-[180px] truncate font-medium">
                                      {p.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {p.offices?.office_name || '—'}
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {p.price.toLocaleString()}{' '}
                                  <span className="text-xs text-muted-foreground">
                                    {t('common.syp')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {p.listing_type === 'sale'
                                    ? t('listing.sale')
                                    : t('listing.rent')}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  {p.rooms}R • {p.bathrooms}B • {p.area_size}m²
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  {formatDate(p.created_at)}
                                </td>
                                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    {p.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs text-primary"
                                          disabled={actionLoading === p.id}
                                          onClick={() => updatePropertyStatus(p.id, 'active')}
                                        >
                                          {actionLoading === p.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            t('dash.activate')
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs text-destructive"
                                          disabled={actionLoading === p.id}
                                          onClick={() => updatePropertyStatus(p.id, 'rejected')}
                                        >
                                          {t('dash.reject')}
                                        </Button>
                                      </>
                                    )}
                                    {p.status === 'active' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-destructive"
                                        disabled={actionLoading === p.id}
                                        onClick={() => updatePropertyStatus(p.id, 'inactive')}
                                      >
                                        {t('dash.deactivate')}
                                      </Button>
                                    )}
                                    {(p.status === 'inactive' || p.status === 'rejected') && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-primary"
                                        disabled={actionLoading === p.id}
                                        onClick={() => updatePropertyStatus(p.id, 'active')}
                                      >
                                        {t('dash.activate')}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-accent-foreground"
                                      onClick={() => setEditProperty(p)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-destructive"
                                      onClick={() =>
                                        setDeleteDialog({
                                          type: 'property',
                                          id: p.id,
                                          name: p.title,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ USERS ════════════════ */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={
                      lang === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>

                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  {filteredProfiles.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      {lang === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('auth.name')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('auth.email')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {t('auth.phone')}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'الدور' : 'Role'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'إجراءات' : 'Actions'}
                            </th>
                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                              {lang === 'ar' ? 'تاريخ التسجيل' : 'Joined'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProfiles.map((profile) => (
                            <tr
                              key={profile.id}
                              className="border-b border-border transition-colors hover:bg-secondary/30"
                            >
                              <td className="px-4 py-3 font-medium">{profile.name || '—'}</td>
                              <td className="px-4 py-3 text-xs">{profile.email}</td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {profile.phone || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <select
                                    className="max-w-[10rem] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-ring"
                                    value={getUserRole(profile.id)}
                                    disabled={actionLoading === profile.id}
                                    onChange={(e) =>
                                      updateUserRole(
                                        profile.id,
                                        e.target.value as 'user' | 'office' | 'admin',
                                      )
                                    }
                                  >
                                    <option value="user">
                                      {lang === 'ar' ? 'مستخدم' : 'User'}
                                    </option>
                                    <option value="office">
                                      {lang === 'ar' ? 'مكتب' : 'Office'}
                                    </option>
                                    <option value="admin">
                                      {lang === 'ar' ? 'مسؤول' : 'Admin'}
                                    </option>
                                  </select>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-10 text-xs font-semibold"
                                    disabled={actionLoading === profile.id}
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: 'user',
                                        id: profile.id,
                                        name: profile.name || profile.email,
                                      })
                                    }
                                  >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {lang === 'ar' ? 'حذف المستخدم' : 'Delete User'}
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {formatDate(profile.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ INQUIRIES ════════════════ */}
            {tab === 'inquiries' && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  {inquiries.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      {lang === 'ar' ? 'لا توجد استفسارات' : 'No inquiries yet'}
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {inquiries.map((inq) => (
                        <div key={inq.id} className="p-4 transition-colors hover:bg-secondary/30">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {lang === 'ar' ? 'عقار: ' : 'Property: '}
                                {inq.properties?.title || inq.property_id}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {inq.message || (lang === 'ar' ? 'بدون رسالة' : 'No message')}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-xs text-muted-foreground">
                              {formatDate(inq.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
              <DialogDescription>
                {lang === 'ar'
                  ? `هل أنت متأكد من حذف "${deleteDialog?.name}"؟ لا يمكن التراجع عن هذا.`
                  : `Are you sure you want to delete "${deleteDialog?.name}"? This cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={!!actionLoading}
                onClick={() => {
                  if (deleteDialog?.type === 'property') deleteProperty(deleteDialog.id);
                  else if (deleteDialog?.type === 'office') deleteOffice(deleteDialog.id);
                  else if (deleteDialog?.type === 'user') deleteUser(deleteDialog.id);
                }}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dash.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit property dialog */}
        <AdminPropertyEditDialog
          property={editProperty}
          open={!!editProperty}
          onOpenChange={(open) => {
            if (!open) setEditProperty(null);
          }}
          onSaved={(updated) => {
            setProperties((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
            );
          }}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
