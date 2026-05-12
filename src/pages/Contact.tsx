import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const { lang, t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">{t('page.contact')}</h1>
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">info@syria14.com</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">+963 11 123 4567</p>
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'الهاتف' : 'Phone'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{lang === 'ar' ? 'دمشق، سوريا' : 'Damascus, Syria'}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'الموقع' : 'Location'}
              </p>
            </div>
          </div>
        </div>
        <form className="space-y-4 rounded-xl bg-card p-6 shadow-card">
          <div>
            <Label>{t('auth.name')}</Label>
            <Input />
          </div>
          <div>
            <Label>{t('auth.email')}</Label>
            <Input type="email" />
          </div>
          <div>
            <Label>{lang === 'ar' ? 'الرسالة' : 'Message'}</Label>
            <Textarea rows={4} />
          </div>
          <Button className="gradient-primary w-full text-primary-foreground">
            {t('common.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
