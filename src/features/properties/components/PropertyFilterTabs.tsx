import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export type PropertyFilter = 'all' | 'active' | 'hidden';

interface Props {
  active: PropertyFilter;
  counts: { all: number; active: number; hidden: number };
  onChange: (f: PropertyFilter) => void;
}

export function PropertyFilterTabs({ active, counts, onChange }: Props) {
  const { t } = useI18n();

  const tabs: { key: PropertyFilter; label: string }[] = [
    { key: 'all', label: `${t.common.all} (${counts.all})` },
    { key: 'active', label: `${t.property.statuses.active} (${counts.active})` },
    { key: 'hidden', label: `${t.property.statuses.hidden} (${counts.hidden})` },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
