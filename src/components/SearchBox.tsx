import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

// Phase 2: full advanced filter implementation
export default function SearchBox({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className={`rounded-2xl bg-card shadow-card ${compact ? 'p-3' : 'p-4 md:p-6'}`}>
      <Button
        onClick={() => navigate(PATHS.search)}
        className="h-11 w-full gap-2 text-base font-semibold"
      >
        <Search className="h-4 w-4" />
        {t.search.placeholder}
      </Button>
    </div>
  );
}
