import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { EyeOff, Eye, Search, MoreHorizontal, ArchiveRestore, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyRow {
  id: string;
  title: string;
  category: string;
  listing_type: string;
  price: number;
  currency: string;
  status: string;
  reference_id: string | null;
  created_at: string;
  offices: { office_name: string } | null;
}

// ─── Query ────────────────────────────────────────────────────────────────────

function useProperties() {
  return useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, category, listing_type, price, currency, status, reference_id, created_at, offices(office_name)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PropertyRow[];
    },
    staleTime: 1000 * 30,
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  hidden: 'bg-gray-100 text-gray-700',
  inactive: 'bg-gray-100 text-gray-500',
  sold: 'bg-blue-100 text-blue-800',
  rented: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-700',
  archived: 'bg-slate-100 text-slate-500',
};

// ─── Confirm dialog (generic) ─────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  isPending,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? t.common.loading : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: properties = [], isLoading, isError } = useProperties();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // No delete action anywhere in this page
  type Action = 'unpublish' | 'publish' | 'archive' | 'restore';
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [targetProperty, setTargetProperty] = useState<PropertyRow | null>(null);

  function openAction(action: Action, property: PropertyRow) {
    setActiveAction(action);
    setTargetProperty(property);
  }
  function closeAction() {
    setActiveAction(null);
    setTargetProperty(null);
  }

  const mutation = useMutation({
    mutationFn: async ({ action, property }: { action: Action; property: PropertyRow }) => {
      if (action === 'unpublish') {
        const { error } = await supabase
          .from('properties')
          .update({ status: 'hidden' })
          .eq('id', property.id);
        if (error) throw error;
      } else if (action === 'publish') {
        const { error } = await supabase
          .from('properties')
          .update({ status: 'active' })
          .eq('id', property.id);
        if (error) throw error;
      } else if (action === 'archive') {
        // admin_archive_property: SECURITY DEFINER RPC added by migration 20260618100000.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.rpc as any)('admin_archive_property', {
          p_property_id: property.id,
        });
        if (error) throw error;
      } else if (action === 'restore') {
        // admin_restore_property: SECURITY DEFINER RPC added by migration 20260618100000.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.rpc as any)('admin_restore_property', {
          p_property_id: property.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      const successMap: Record<Action, string> = {
        unpublish: t.admin.unpublishSuccess,
        publish: t.admin.publishSuccess,
        archive: t.admin.archiveSuccess,
        restore: t.admin.restorePropertySuccess,
      };
      toast.success(successMap[action]);
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      closeAction();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = properties.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !(p.reference_id ?? '').toLowerCase().includes(q) &&
        !(p.offices?.office_name ?? '').toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const dialogProps = (): {
    title: string;
    description: string;
    label: string;
    destructive?: boolean;
  } | null => {
    if (!activeAction || !targetProperty) return null;
    const map: Record<
      Action,
      { title: string; description: string; label: string; destructive?: boolean }
    > = {
      unpublish: {
        title: t.admin.unpublish,
        description: t.admin.unpublish,
        label: t.admin.unpublish,
      },
      publish: {
        title: t.admin.publish,
        description: t.admin.publish,
        label: t.admin.publish,
      },
      archive: {
        title: t.admin.archiveProperty,
        description: t.admin.confirmArchiveProperty,
        label: t.admin.archiveProperty,
      },
      restore: {
        title: t.admin.restoreProperty,
        description: t.admin.confirmRestoreProperty,
        label: t.admin.restoreProperty,
      },
    };
    return map[activeAction];
  };

  const dp = dialogProps();

  const filterTabs = ['all', 'active', 'hidden', 'pending', 'inactive', 'archived'] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.admin.properties}</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {properties.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s === 'all'
                ? t.admin.allStatuses
                : (t.property.statuses[s as keyof typeof t.property.statuses] ?? s)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.admin.propertyRef}</th>
                <th className="px-4 py-3 text-start">{t.property.title}</th>
                <th className="px-4 py-3 text-start">{t.admin.ownerOffice}</th>
                <th className="px-4 py-3 text-start">{t.property.category}</th>
                <th className="px-4 py-3 text-start">{t.property.price}</th>
                <th className="px-4 py-3 text-start">{t.property.status}</th>
                <th className="px-4 py-3 text-start">{t.admin.submittedAt}</th>
                <th className="px-4 py-3 text-start">{t.admin.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="bg-background hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                    {p.reference_id ?? '—'}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.offices?.office_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.property.categories[p.category as keyof typeof t.property.categories] ??
                      p.category}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {p.price.toLocaleString()} {p.currency}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[p.status] ?? statusColors.draft}>
                      {t.property.statuses[p.status as keyof typeof t.property.statuses] ??
                        p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(p.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t.admin.actions}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        {/* Archived: only Restore */}
                        {p.status === 'archived' && (
                          <DropdownMenuItem onClick={() => openAction('restore', p)}>
                            <ArchiveRestore className="me-2 h-4 w-4 text-green-600" />
                            {t.admin.restoreProperty}
                          </DropdownMenuItem>
                        )}

                        {/* Non-archived */}
                        {p.status !== 'archived' && (
                          <>
                            {/* Unpublish active listings */}
                            {p.status === 'active' && (
                              <DropdownMenuItem onClick={() => openAction('unpublish', p)}>
                                <EyeOff className="me-2 h-4 w-4" />
                                {t.admin.unpublish}
                              </DropdownMenuItem>
                            )}
                            {/* Publish hidden / inactive / pending listings */}
                            {(p.status === 'hidden' ||
                              p.status === 'inactive' ||
                              p.status === 'pending') && (
                              <DropdownMenuItem onClick={() => openAction('publish', p)}>
                                <Eye className="me-2 h-4 w-4 text-green-600" />
                                {t.admin.publish}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {/* Archive (available for all non-archived statuses) */}
                            <DropdownMenuItem onClick={() => openAction('archive', p)}>
                              <Archive className="me-2 h-4 w-4 text-slate-500" />
                              {t.admin.archiveProperty}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm dialog */}
      {dp && targetProperty && (
        <ConfirmDialog
          open={Boolean(activeAction && targetProperty)}
          title={dp.title}
          description={dp.description}
          confirmLabel={dp.label}
          destructive={dp.destructive}
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate({ action: activeAction!, property: targetProperty })}
          onClose={closeAction}
        >
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{targetProperty.title}</p>
            <p className="font-mono text-xs text-muted-foreground" dir="ltr">
              {targetProperty.reference_id}
            </p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
