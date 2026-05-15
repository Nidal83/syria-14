import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';

function useProperties() {
  return useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, category, listing_type, price, currency, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-700',
};

export default function AdminPropertiesPage() {
  const { t } = useI18n();
  const { data: properties = [], isLoading, isError } = useProperties();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.admin.properties}</h1>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.property.title}</th>
                <th className="px-4 py-3 text-start">{t.property.category}</th>
                <th className="px-4 py-3 text-start">{t.property.listingType}</th>
                <th className="px-4 py-3 text-start">{t.property.price}</th>
                <th className="px-4 py-3 text-start">{t.property.status}</th>
                <th className="px-4 py-3 text-start">{t.admin.submittedAt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
              {properties.map((p) => (
                <tr key={p.id} className="bg-background hover:bg-muted/20">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.property.categories[p.category as keyof typeof t.property.categories] ??
                      p.category}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.listing_type === 'sale' ? t.property.sale : t.property.rent}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
