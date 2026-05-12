import { useLanguage } from '@/i18n/LanguageContext';

const Terms = () => {
  const { lang } = useLanguage();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">
        {lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
      </h1>
      <div className="prose prose-sm space-y-4 text-muted-foreground">
        <p>
          {lang === 'ar'
            ? 'مرحباً بك في سوريا 14. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بالشروط والأحكام التالية.'
            : 'Welcome to Syria 14. By using this platform, you agree to comply with the following terms and conditions.'}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {lang === 'ar' ? 'استخدام المنصة' : 'Platform Usage'}
        </h2>
        <p>
          {lang === 'ar'
            ? 'يجب استخدام المنصة لأغراض البحث عن العقارات ونشرها فقط. يُحظر استخدام المنصة لأي غرض غير قانوني.'
            : 'The platform must be used only for searching and listing properties. Using the platform for any illegal purpose is prohibited.'}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {lang === 'ar' ? 'المكاتب العقارية' : 'Real Estate Offices'}
        </h2>
        <p>
          {lang === 'ar'
            ? 'يجب على المكاتب العقارية التسجيل والحصول على موافقة الإدارة قبل نشر أي عقار على المنصة.'
            : 'Real estate offices must register and obtain admin approval before publishing any property on the platform.'}
        </p>
      </div>
    </div>
  );
};

export default Terms;
