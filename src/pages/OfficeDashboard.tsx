import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/app/route-paths';
import {
  Plus,
  Building2,
  Clock,
  CheckCircle,
  Loader2,
  Users,
  Trash2,
  UserPlus,
  Home,
  Pencil,
  RefreshCw,
  XCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Eye,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AddPropertyForm from '@/components/AddPropertyForm';
import AdminPropertyEditDialog from '@/components/AdminPropertyEditDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import syria14Logo from '@/assets/syria14-logo.png';
import type { SupabaseProperty } from '@/hooks/useProperties';

type View = 'overview' | 'properties' | 'add-property' | 'inquiries' | 'members' | 'settings';
type PropertyFilter = 'all' | 'active' | 'pending' | 'inactive';

interface OfficeMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  created_at: string;
}

interface Inquiry {
  id: string;
  message: string;
  created_at: string;
  property_id: string;
  user_id: string;
  property?: { title: string };
  profile?: { name: string; email: string };
}

interface OfficeData {
  id: string;
  office_name: string;
  owner_name: string;
  email: string;
  phone: string;
  status: string;
}

const OfficeDashboard = () => {
  const { lang, t } = useLanguage();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('overview');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [members, setMembers] = useState<OfficeMember[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [office, setOffice] = useState<OfficeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editProperty, setEditProperty] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add member dialog
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);

    const { data: officeData } = await supabase
      .from('offices')
      .select('*')
      .eq('owner_id', session.user.id)
      .single();

    if (officeData) {
      setOffice(officeData as OfficeData);
      const [propsRes, membersRes, inquiriesRes] = await Promise.all([
        supabase
          .from('properties')
          .select('*, offices(office_name, phone), property_images(image_url, is_cover)')
          .eq('office_id', officeData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('office_members')
          .select('*')
          .eq('office_id', officeData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('inquiries')
          .select('*, properties:property_id(title)')
          .eq('property_id', officeData.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      setProperties((propsRes.data as SupabaseProperty[]) || []);
      setMembers((membersRes.data as OfficeMember[]) || []);
      setInquiries((inquiriesRes.data as any[]) || []);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      searchParams.get('action') === 'add-property' &&
      user?.role === 'office' &&
      user.officeStatus === 'approved'
    ) {
      setView('add-property');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, user]);

  if (!user || user.role !== 'office') return null;

  if (!user.officeStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl bg-card p-8 text-center shadow-card">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-slate-100 p-3">
              <span className="text-xl">⏳</span>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">
            {lang === 'ar' ? 'جارٍ التحقق' : 'Checking Office Status'}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'نقوم بتحميل حالة مكتبك. يرجى الانتظار أو إعادة تحميل الصفحة.'
              : 'We are loading your office status. Please wait or refresh the page.'}
          </p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              {lang === 'ar' ? 'إعادة التحميل' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if office is approved
  if (user.officeStatus === 'pending' || user.officeStatus === 'pending_review') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl bg-card p-8 text-center shadow-card">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-amber-100 p-3">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">
            {lang === 'ar' ? 'في انتظار الموافقة' : 'Pending Approval'}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'مكتبك قيد المراجعة من قبل الإدارة. ستحصل على إشعار عند اكتمال المراجعة.'
              : 'Your office is under review by admin. You will be notified when the review is complete.'}
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate(ROUTES.home)} variant="outline" className="w-full">
              {lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Button>
            <Button onClick={() => navigate(ROUTES.contact)} className="w-full">
              {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.officeStatus === 'rejected') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl bg-card p-8 text-center shadow-card">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-destructive">
            {lang === 'ar' ? 'تم رفض الطلب' : 'Application Rejected'}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'تم رفض طلب تسجيل مكتبك. يرجى التواصل معنا لمزيد من التفاصيل.'
              : 'Your office registration was rejected. Please contact us for more details.'}
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate(ROUTES.contact)} className="w-full">
              {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </Button>
            <Button onClick={() => navigate(ROUTES.home)} variant="outline" className="w-full">
              {lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Stats
  const activeCount = properties.filter((p) => p.status === 'active').length;
  const pendingCount = properties.filter((p) => p.status === 'pending').length;
  const inactiveCount = properties.filter((p) => p.status === 'inactive').length;

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    if (propertyFilter === 'all') return true;
    return p.status === propertyFilter;
  });

  const deleteProperty = async (id: string) => {
    setActionLoading(id);
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

  const togglePropertyStatus = async (id: string, currentStatus: string) => {
    setActionLoading(id);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('properties').update({ status: newStatus }).eq('id', id);

    if (error) {
      toast.error(lang === 'ar' ? 'فشل التحديث' : 'Update failed');
    } else {
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Status updated');
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    }
    setActionLoading(null);
  };

  const addMember = async () => {
    if (!office?.id || !memberEmail.trim()) return;
    setAddingMember(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', memberEmail.trim())
      .single();

    if (!profile) {
      toast.error(
        lang === 'ar'
          ? 'المستخدم غير موجود، يرجى التأكد من تسجيله أولاً'
          : 'User not found. They must register first.',
      );
      setAddingMember(false);
      return;
    }

    const { error } = await supabase.from('office_members').insert({
      office_id: office.id,
      user_id: profile.id,
      name: memberName.trim() || memberEmail.trim(),
      role: 'member',
    });

    if (error) {
      if (error.code === '23505') {
        toast.error(lang === 'ar' ? 'هذا المستخدم مضاف مسبقاً' : 'This user is already a member');
      } else {
        toast.error(lang === 'ar' ? 'فشلت الإضافة' : 'Failed to add member');
      }
    } else {
      toast.success(lang === 'ar' ? 'تم إضافة العضو بنجاح' : 'Member added successfully');
      setMemberEmail('');
      setMemberName('');
      setShowAddMember(false);
      fetchData();
    }
    setAddingMember(false);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('office_members').delete().eq('id', memberId);
    if (error) {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Failed to remove');
    } else {
      toast.success(lang === 'ar' ? 'تم حذف العضو' : 'Member removed');
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  const requestApproval = async () => {
    if (!office?.id) return;
    setActionLoading('approval');

    const { error } = await supabase
      .from('offices')
      .update({ status: 'pending_review' })
      .eq('id', office.id);

    if (error) {
      toast.error(lang === 'ar' ? 'فشل في إرسال الطلب' : 'Failed to send request');
    } else {
      toast.success(
        lang === 'ar' ? 'تم إرسال طلب الموافقة بنجاح' : 'Approval request sent successfully',
      );
      window.location.reload();
    }
    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      inactive: 'outline',
    };
    const labels: Record<string, { ar: string; en: string }> = {
      active: { ar: 'نشط', en: 'Active' },
      pending: { ar: 'بانتظار', en: 'Pending' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      inactive: { ar: 'متوقف', en: 'Paused' },
    };
    return (
      <Badge variant={variants[status] || 'outline'}>{labels[status]?.[lang] || status}</Badge>
    );
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: { ar: 'نظرة عامة', en: 'Overview' } },
    {
      id: 'properties',
      icon: Home,
      label: { ar: 'عقاراتي', en: 'My Properties' },
      badge: properties.length,
    },
    { id: 'add-property', icon: Plus, label: { ar: 'إضافة عقار', en: 'Add Property' } },
    {
      id: 'inquiries',
      icon: MessageSquare,
      label: { ar: 'الرسائل', en: 'Messages' },
      badge: inquiries.length,
    },
    { id: 'members', icon: Users, label: { ar: 'الموظفون', en: 'Team' }, badge: members.length },
    { id: 'settings', icon: Settings, label: { ar: 'الإعدادات', en: 'Settings' } },
  ];

  // Add Property View
  if (view === 'add-property') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" className="mb-6" onClick={() => setView('overview')}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {lang === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Button>
          <AddPropertyForm
            onClose={() => setView('overview')}
            onSuccess={() => {
              setView('properties');
              fetchData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-e border-border bg-card lg:flex">
        {/* Logo */}
        <div className="border-b border-border p-4">
          <Link to={ROUTES.home} className="flex items-center gap-3">
            <img src={syria14Logo} alt="Syria14" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Office Info */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {office?.office_name || user.officeName}
              </p>
              <Badge
                variant={user.officeStatus === 'approved' ? 'default' : 'secondary'}
                className="h-5 text-[10px]"
              >
                {user.officeStatus === 'approved'
                  ? lang === 'ar'
                    ? 'معتمد'
                    : 'Approved'
                  : user.officeStatus === 'pending' || user.officeStatus === 'pending_review'
                    ? lang === 'ar'
                      ? 'قيد المراجعة'
                      : 'Pending'
                    : lang === 'ar'
                      ? 'مرفوض'
                      : 'Rejected'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = view === item.id;
            const isDisabled = item.id === 'add-property' && user.officeStatus !== 'approved';
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setView(item.id as View)}
                disabled={isDisabled}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDisabled
                      ? 'cursor-not-allowed text-muted-foreground/50'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-start">{item.label[lang]}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className="h-5 min-w-5 justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
        <Link to={ROUTES.home} className="flex items-center gap-2">
          <img src={syria14Logo} alt="Syria14" className="h-8 w-auto" />
        </Link>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="rounded-lg bg-secondary px-3 py-2 text-sm"
        >
          {navItems.map((item) => (
            <option
              key={item.id}
              value={item.id}
              disabled={item.id === 'add-property' && user.officeStatus !== 'approved'}
            >
              {item.label[lang]}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 pt-20 lg:p-8 lg:pt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ══════ OVERVIEW ══════ */}
            {view === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar'
                        ? 'مرحباً بك في لوحة تحكم مكتبك'
                        : 'Welcome to your office dashboard'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setView('add-property')}
                    disabled={user.officeStatus !== 'approved'}
                    className="gradient-primary text-primary-foreground"
                  >
                    <Plus className="me-2 h-4 w-4" /> {t('dash.add_property')}
                  </Button>
                </div>

                {/* Approval Notice */}
                {user.officeStatus !== 'approved' && (
                  <Card
                    className={
                      user.officeStatus === 'pending' || user.officeStatus === 'pending_review'
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-destructive/50 bg-destructive/5'
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {user.officeStatus === 'pending' || user.officeStatus === 'pending_review' ? (
                          <Clock className="mt-0.5 h-5 w-5 text-amber-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {user.officeStatus === 'pending' || user.officeStatus === 'pending_review'
                              ? lang === 'ar'
                                ? 'مكتبك قيد المراجعة'
                                : 'Your Office is Under Review'
                              : lang === 'ar'
                                ? 'تم رفض طلبك'
                                : 'Your Request was Rejected'}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {user.officeStatus === 'pending' || user.officeStatus === 'pending_review'
                              ? lang === 'ar'
                                ? 'ستتمكن من إضافة العقارات فور الموافقة.'
                                : 'You can add properties once approved.'
                              : lang === 'ar'
                                ? 'يمكنك إعادة تقديم الطلب.'
                                : 'You can resubmit the request.'}
                          </p>
                          {(user.officeStatus === 'rejected') && (
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={requestApproval}
                              disabled={actionLoading === 'approval'}
                            >
                              {actionLoading === 'approval' ? (
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="me-2 h-4 w-4" />
                              )}
                              {lang === 'ar' ? 'إعادة تقديم الطلب' : 'Resubmit Request'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setView('properties')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{properties.length}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'إجمالي العقارات' : 'Total Properties'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => {
                      setView('properties');
                      setPropertyFilter('active');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{activeCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'عقارات نشطة' : 'Active Listings'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => {
                      setView('properties');
                      setPropertyFilter('pending');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                          <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setView('members')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{members.length}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions & Recent Properties */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setView('add-property')}
                        disabled={user.officeStatus !== 'approved'}
                      >
                        <Plus className="me-3 h-4 w-4" />{' '}
                        {lang === 'ar' ? 'إضافة عقار جديد' : 'Add New Property'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowAddMember(true)}
                      >
                        <UserPlus className="me-3 h-4 w-4" />{' '}
                        {lang === 'ar' ? 'إضافة موظف' : 'Add Team Member'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setView('settings')}
                      >
                        <Settings className="me-3 h-4 w-4" />{' '}
                        {lang === 'ar' ? 'إعدادات المكتب' : 'Office Settings'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">
                        {lang === 'ar' ? 'أحدث العقارات' : 'Recent Properties'}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setView('properties')}>
                        {lang === 'ar' ? 'عرض الكل' : 'View All'}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {properties.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          {lang === 'ar' ? 'لا توجد عقارات بعد' : 'No properties yet'}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {properties.slice(0, 3).map((p) => {
                            const coverImg =
                              p.property_images?.find((i) => i.is_cover)?.image_url ||
                              p.property_images?.[0]?.image_url ||
                              '/placeholder.svg';
                            return (
                              <div key={p.id} className="flex items-center gap-3">
                                <img
                                  src={coverImg}
                                  alt=""
                                  className="h-12 w-16 rounded-md object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{p.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.price.toLocaleString()} {t('common.syp')}
                                  </p>
                                </div>
                                {statusBadge(p.status)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ══════ PROPERTIES ══════ */}
            {view === 'properties' && (
              <div className="space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {lang === 'ar' ? 'عقاراتي' : 'My Properties'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'إدارة جميع عقاراتك' : 'Manage all your listings'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchData()}
                      disabled={loading}
                    >
                      <RefreshCw className={`me-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      {lang === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <Button
                      onClick={() => setView('add-property')}
                      disabled={user.officeStatus !== 'approved'}
                      className="gradient-primary text-primary-foreground"
                    >
                      <Plus className="me-2 h-4 w-4" /> {t('dash.add_property')}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'pending', 'inactive'] as PropertyFilter[]).map((filter) => (
                    <Button
                      key={filter}
                      variant={propertyFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPropertyFilter(filter)}
                    >
                      {filter === 'all' && (lang === 'ar' ? 'الكل' : 'All')}
                      {filter === 'active' && (lang === 'ar' ? 'نشط' : 'Active')}
                      {filter === 'pending' && (lang === 'ar' ? 'بانتظار' : 'Pending')}
                      {filter === 'inactive' && (lang === 'ar' ? 'متوقف' : 'Paused')}
                      <Badge variant="secondary" className="ms-2 h-5">
                        {filter === 'all'
                          ? properties.length
                          : properties.filter((p) => p.status === filter).length}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {/* Properties Table */}
                <Card>
                  <CardContent className="p-0">
                    {filteredProperties.length === 0 ? (
                      <div className="py-12 text-center">
                        <Home className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                        <p className="mb-4 text-muted-foreground">{t('search.no_results')}</p>
                        <Button
                          onClick={() => setView('add-property')}
                          disabled={user.officeStatus !== 'approved'}
                        >
                          <Plus className="me-2 h-4 w-4" /> {t('dash.add_property')}
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">
                                {lang === 'ar' ? 'العقار' : 'Property'}
                              </TableHead>
                              <TableHead>{lang === 'ar' ? 'السعر' : 'Price'}</TableHead>
                              <TableHead>{lang === 'ar' ? 'النوع' : 'Type'}</TableHead>
                              <TableHead>{lang === 'ar' ? 'التفاصيل' : 'Details'}</TableHead>
                              <TableHead>{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                              <TableHead>{lang === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                              <TableHead className="text-center">
                                {lang === 'ar' ? 'إجراءات' : 'Actions'}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProperties.map((p) => {
                              const coverImg =
                                p.property_images?.find((i) => i.is_cover)?.image_url ||
                                p.property_images?.[0]?.image_url ||
                                '/placeholder.svg';
                              return (
                                <TableRow key={p.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={coverImg}
                                        alt=""
                                        className="h-12 w-16 rounded-md object-cover"
                                      />
                                      <div>
                                        <p className="max-w-[200px] truncate text-sm font-medium">
                                          {p.title}
                                        </p>
                                        <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                                          {p.address}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{p.price.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {t('common.syp')}
                                        {p.listing_type === 'rent' &&
                                          ` / ${lang === 'ar' ? 'شهر' : 'mo'}`}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {p.listing_type === 'rent'
                                        ? t('listing.rent')
                                        : t('listing.sale')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm">
                                      {p.rooms}
                                      {lang === 'ar' ? 'غ' : 'R'} • {p.bathrooms}
                                      {lang === 'ar' ? 'ح' : 'B'} • {p.area_size}م²
                                    </p>
                                  </TableCell>
                                  <TableCell>{statusBadge(p.status)}</TableCell>
                                  <TableCell>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(p.created_at).toLocaleDateString(
                                        lang === 'ar' ? 'ar-SY' : 'en-US',
                                      )}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => window.open(`/property/${p.id}`, '_blank')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => setEditProperty(p)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {p.status !== 'pending' && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          disabled={actionLoading === p.id}
                                          onClick={() => togglePropertyStatus(p.id, p.status)}
                                        >
                                          {p.status === 'active' ? (
                                            <PauseCircle className="h-4 w-4" />
                                          ) : (
                                            <PlayCircle className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => setDeleteDialog({ id: p.id, name: p.title })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════ INQUIRIES ══════ */}
            {view === 'inquiries' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">
                    {lang === 'ar' ? 'الرسائل والاستفسارات' : 'Messages & Inquiries'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar'
                      ? 'استفسارات المستخدمين حول عقاراتك'
                      : 'User inquiries about your properties'}
                  </p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {inquiries.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          {lang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {inquiries.map((inq) => (
                          <div key={inq.id} className="p-4 transition-colors hover:bg-secondary/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {inq.property?.title || 'Unknown Property'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{inq.message}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {new Date(inq.created_at).toLocaleDateString(
                                    lang === 'ar' ? 'ar-SY' : 'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════ MEMBERS ══════ */}
            {view === 'members' && (
              <div className="space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {lang === 'ar' ? 'فريق العمل' : 'Team Members'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'إدارة موظفي المكتب' : 'Manage your office employees'}
                    </p>
                  </div>
                  <Button onClick={() => setShowAddMember(true)}>
                    <UserPlus className="me-2 h-4 w-4" />{' '}
                    {lang === 'ar' ? 'إضافة موظف' : 'Add Member'}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {members.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                        <p className="mb-2 text-muted-foreground">
                          {lang === 'ar' ? 'لا يوجد موظفون بعد' : 'No team members yet'}
                        </p>
                        <p className="mb-4 text-xs text-muted-foreground">
                          {lang === 'ar'
                            ? 'أضف موظفين ليتمكنوا من إدارة العقارات'
                            : 'Add employees to help manage properties'}
                        </p>
                        <Button onClick={() => setShowAddMember(true)}>
                          <UserPlus className="me-2 h-4 w-4" />{' '}
                          {lang === 'ar' ? 'إضافة موظف' : 'Add Member'}
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{m.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {m.role === 'member'
                                    ? lang === 'ar'
                                      ? 'موظف'
                                      : 'Employee'
                                    : m.role}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => removeMember(m.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══════ SETTINGS ══════ */}
            {view === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">
                    {lang === 'ar' ? 'إعدادات المكتب' : 'Office Settings'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar'
                      ? 'معلومات وإعدادات مكتبك'
                      : 'Your office information and settings'}
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'ar' ? 'معلومات المكتب' : 'Office Information'}</CardTitle>
                    <CardDescription>
                      {lang === 'ar' ? 'المعلومات الأساسية للمكتب' : 'Basic office information'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{lang === 'ar' ? 'اسم المكتب' : 'Office Name'}</Label>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{office?.office_name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{lang === 'ar' ? 'اسم المالك' : 'Owner Name'}</Label>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{office?.owner_name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{office?.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{office?.phone}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>{lang === 'ar' ? 'حالة المكتب' : 'Office Status'}</Label>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            office?.status === 'approved'
                              ? 'default'
                              : office?.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {office?.status === 'approved'
                            ? lang === 'ar'
                              ? 'معتمد'
                              : 'Approved'
                            : office?.status === 'pending'
                              ? lang === 'ar'
                                ? 'قيد المراجعة'
                                : 'Pending'
                              : lang === 'ar'
                                ? 'مرفوض'
                                : 'Rejected'}
                        </Badge>
                        {office?.status === 'rejected' && (
                          <Button
                            size="sm"
                            onClick={requestApproval}
                            disabled={actionLoading === 'approval'}
                          >
                            {actionLoading === 'approval' ? (
                              <Loader2 className="me-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {lang === 'ar' ? 'إعادة طلب الموافقة' : 'Request Approval'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'ar' ? 'إحصائيات' : 'Statistics'}</CardTitle>
                    <CardDescription>
                      {lang === 'ar' ? 'ملخص نشاط المكتب' : 'Summary of office activity'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-secondary/50 p-4 text-center">
                        <p className="text-2xl font-bold">{properties.length}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'إجمالي العقارات' : 'Total Properties'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-4 text-center">
                        <p className="text-2xl font-bold">{activeCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'عقارات نشطة' : 'Active'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-4 text-center">
                        <p className="text-2xl font-bold">{members.length}</p>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit property dialog */}
      <AdminPropertyEditDialog
        property={editProperty}
        open={!!editProperty}
        onOpenChange={(open) => {
          if (!open) setEditProperty(null);
        }}
        onSaved={(updated) => {
          setProperties((prev) =>
            prev.map((p) => (p.id === updated.id ? ({ ...p, ...updated } as SupabaseProperty) : p)),
          );
        }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {lang === 'ar'
                ? `هل أنت متأكد من حذف "${deleteDialog?.name}"؟`
                : `Are you sure you want to delete "${deleteDialog?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!!actionLoading}
              onClick={() => deleteDialog && deleteProperty(deleteDialog.id)}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dash.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'إضافة موظف جديد' : 'Add New Team Member'}</DialogTitle>
            <DialogDescription>
              {lang === 'ar'
                ? 'أدخل بيانات الموظف (يجب أن يكون مسجلاً في المنصة)'
                : 'Enter the employee details (they must be registered)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'اسم الموظف' : 'Employee Name'}</Label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder={lang === 'ar' ? 'البريد الإلكتروني للموظف' : 'Employee email'}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={addMember} disabled={addingMember || !memberEmail.trim()}>
              {addingMember ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="me-2 h-4 w-4" />
              )}
              {lang === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeDashboard;
