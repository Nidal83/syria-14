import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { PATHS } from '@/routes/paths';

const REFERENCE_PATTERN = /^SY14-\d{1,8}$/i;

/**
 * Compact search input that accepts a property reference ID
 * (format: SY14-NNNNN) and navigates the user directly to that
 * listing if it exists.
 */
export function ReferenceIdSearch() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();

    if (!trimmed) return;

    if (!REFERENCE_PATTERN.test(trimmed)) {
      toast.error(t.home.referenceSearch.invalid);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .eq('reference_id', trimmed)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error(t.home.referenceSearch.notFound);
        return;
      }
      navigate(PATHS.propertyDetail(trimmed));
    } catch (err) {
      console.error('[ReferenceIdSearch] lookup failed', err);
      toast.error(t.home.referenceSearch.notFound);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md gap-2">
      <Input
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.home.referenceSearch.placeholder}
        aria-label={t.home.referenceSearch.label}
        className="font-mono uppercase"
      />
      <Button type="submit" disabled={loading}>
        <Search className="me-2 h-4 w-4" />
        {loading ? t.common.loading : t.home.referenceSearch.submit}
      </Button>
    </form>
  );
}
