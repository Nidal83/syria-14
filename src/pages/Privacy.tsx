import { useLanguage } from '@/i18n/LanguageContext';

const Privacy = () => {
  const { lang } = useLanguage();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">
        {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
      </h1>
      <div className="prose prose-sm space-y-4 text-muted-foreground">
        <p>
          {lang === 'ar'
            ? 'نحن في سوريا 14 نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.'
            : 'At Syria 14, we respect your privacy and are committed to protecting your personal data.'}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {lang === 'ar' ? 'البيانات المجمعة' : 'Data Collection'}
        </h2>
        <p>
          {lang === 'ar'
            ? 'نجمع البيانات الضرورية لتقديم خدماتنا، بما في ذلك الاسم والبريد الإلكتروني ورقم الهاتف.'
            : 'We collect data necessary to provide our services, including name, email, and phone number.'}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {lang === 'ar' ? 'حماية البيانات' : 'Data Protection'}
        </h2>
        <p>
          {lang === 'ar'
            ? 'نستخدم أحدث تقنيات الأمان لحماية بياناتك من الوصول غير المصرح به.'
            : 'We use the latest security technologies to protect your data from unauthorized access.'}
        </p>
      </div>
    </div>
  );
};

export default Privacy;
