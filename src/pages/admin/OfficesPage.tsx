import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';

function useOffices() {
  return useQuery({
    queryKey: ['admin-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('id, office_name, email, phone, status, is_active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminOfficesPage() {
  const { t } = useI18n();
  const { data: offices = [], isLoading, isError } = useOffices();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.admin.offices}</h1>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.office.officeName}</th>
                <th className="px-4 py-3 text-start">{t.auth.email}</th>
                <th className="px-4 py-3 text-start">{t.office.phone}</th>
                <th className="px-4 py-3 text-start">{t.property.status}</th>
                <th className="px-4 py-3 text-start">{t.admin.submittedAt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {offices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
              {offices.map((o) => (
                <tr key={o.id} className="bg-background hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{o.office_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.email}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {o.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[o.status] ?? statusColors.pending}>
                      {o.status === 'approved'
                        ? t.admin.approved
                        : o.status === 'rejected'
                          ? t.admin.rejected
                          : t.admin.pending}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(o.created_at), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
