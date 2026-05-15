import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';

function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  office: 'bg-blue-100 text-blue-800',
  pending_office: 'bg-yellow-100 text-yellow-800',
  user: 'bg-gray-100 text-gray-700',
};

export default function AdminUsersPage() {
  const { t } = useI18n();
  const { data: users = [], isLoading, isError } = useUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.admin.users}</h1>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.auth.fullName}</th>
                <th className="px-4 py-3 text-start">{t.auth.email}</th>
                <th className="px-4 py-3 text-start">{t.auth.phone}</th>
                <th className="px-4 py-3 text-start">{t.property.status}</th>
                <th className="px-4 py-3 text-start">{t.admin.submittedAt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="bg-background hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {u.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={roleColors[u.role] ?? roleColors.user}>
                      {t.roles[u.role as keyof typeof t.roles] ?? u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(u.created_at), 'dd/MM/yyyy')}
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
