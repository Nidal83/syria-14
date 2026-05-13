import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export default function OfficePropertiesPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.office.myProperties}</h1>
        <Button asChild size="sm">
          <Link to={PATHS.officeNewProperty}>
            <Plus className="me-2 h-4 w-4" />
            {t.property.addProperty}
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground">{t.property.noProperties}</p>
    </div>
  );
}
