import { useI18n } from '@/lib/i18n/context';

export default function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <main className="container max-w-3xl py-12">
      <h1 className="mb-4 text-3xl font-bold">{t.footer.privacyPolicy}</h1>
      <p className="text-muted-foreground">{t.footer.pagePlaceholder}</p>
    </main>
  );
}
