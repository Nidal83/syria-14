import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { governorates, areas, propertyTypes } from '@/data/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import PropertyImageUpload from '@/components/PropertyImageUpload';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AddPropertyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

const featureOptions = [
  { key: 'balcony', ar: 'شرفة', en: 'Balcony' },
  { key: 'elevator', ar: 'مصعد', en: 'Elevator' },
  { key: 'parking', ar: 'موقف سيارات', en: 'Parking' },
  { key: 'pool', ar: 'مسبح', en: 'Swimming Pool' },
  { key: 'garden', ar: 'حديقة', en: 'Garden' },
  { key: 'heating', ar: 'تدفئة', en: 'Heating' },
  { key: 'ac', ar: 'تكييف', en: 'Air Conditioning' },
  { key: 'security', ar: 'حراسة أمنية', en: 'Security' },
  { key: 'generator', ar: 'مولد كهربائي', en: 'Generator' },
  { key: 'solar', ar: 'طاقة شمسية', en: 'Solar Power' },
  { key: 'water_tank', ar: 'خزان مياه', en: 'Water Tank' },
  { key: 'storage', ar: 'غرفة تخزين', en: 'Storage Room' },
  { key: 'maid_room', ar: 'غرفة خادمة', en: 'Maid Room' },
  { key: 'gym', ar: 'صالة رياضية', en: 'Gym' },
  { key: 'intercom', ar: 'انتركم', en: 'Intercom' },
  { key: 'satellite', ar: 'ستلايت', en: 'Satellite' },
  { key: 'internet', ar: 'إنترنت', en: 'Internet Ready' },
];

const directionOptions = [
  { key: 'north', ar: 'شمالي', en: 'North' },
  { key: 'south', ar: 'جنوبي', en: 'South' },
  { key: 'east', ar: 'شرقي', en: 'East' },
  { key: 'west', ar: 'غربي', en: 'West' },
  { key: 'north_east', ar: 'شمال شرقي', en: 'North-East' },
  { key: 'north_west', ar: 'شمال غربي', en: 'North-West' },
  { key: 'south_east', ar: 'جنوب شرقي', en: 'South-East' },
  { key: 'south_west', ar: 'جنوب غربي', en: 'South-West' },
];

const viewOptions = [
  { key: 'street', ar: 'إطلالة على الشارع', en: 'Street View' },
  { key: 'sea', ar: 'إطلالة بحرية', en: 'Sea View' },
  { key: 'mountain', ar: 'إطلالة جبلية', en: 'Mountain View' },
  { key: 'garden', ar: 'إطلالة على حديقة', en: 'Garden View' },
  { key: 'city', ar: 'إطلالة على المدينة', en: 'City View' },
  { key: 'internal', ar: 'داخلية', en: 'Internal' },
];

const ownershipOptions = [
  { key: 'green', ar: 'طابو أخضر', en: 'Green Deed' },
  { key: 'court', ar: 'حكم محكمة', en: 'Court Order' },
  { key: 'contract', ar: 'عقد بيع', en: 'Sales Contract' },
  { key: 'cooperative', ar: 'جمعية سكنية', en: 'Housing Cooperative' },
];

const paymentOptions = [
  { key: 'cash', ar: 'كاش', en: 'Cash' },
  { key: 'installments', ar: 'تقسيط', en: 'Installments' },
  { key: 'cash_installments', ar: 'كاش أو تقسيط', en: 'Cash or Installments' },
  { key: 'exchange', ar: 'مقايضة', en: 'Exchange' },
];

const AddPropertyForm = ({ onClose, onSuccess, isAdmin = false }: AddPropertyFormProps) => {
  const { lang, t } = useLanguage();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ url: string; isCover: boolean }[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [offices, setOffices] = useState<{ id: string; office_name: string }[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    listingType: 'sale' as 'sale' | 'rent',
    propertyType: 'apartment',
    governorate: '',
    area: '',
    address: '',
    price: '',
    areaSize: '',
    rooms: '1',
    bathrooms: '1',
    livingRooms: '1',
    kitchens: '1',
    floor: '0',
    totalFloors: '0',
    buildingAge: '0',
    direction: '',
    view: '',
    ownershipType: '',
    paymentMethod: '',
    furnished: false,
    contactPhone: '',
    whatsapp: '',
    videoUrl: '',
  });

  // Fetch offices for admin mode
  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('offices')
        .select('id, office_name')
        .eq('status', 'approved')
        .then(({ data }) => {
          setOffices(data || []);
          if (data && data.length > 0) setSelectedOfficeId(data[0].id);
        });
    }
  }, [isAdmin]);

  const update = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));
  const currentAreas = form.governorate ? areas[form.governorate] || [] : [];
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const toggleFeature = (key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !user) return;

    if (images.length === 0) {
      toast.error(
        lang === 'ar' ? 'يرجى إضافة صورة واحدة على الأقل' : 'Please add at least one image',
      );
      return;
    }

    setLoading(true);
    try {
      let officeId: string;

      if (isAdmin) {
        if (!selectedOfficeId) {
          toast.error(lang === 'ar' ? 'يرجى اختيار مكتب' : 'Please select an office');
          setLoading(false);
          return;
        }
        officeId = selectedOfficeId;
      } else {
        // Get the user's office
        const { data: office, error: officeErr } = await supabase
          .from('offices')
          .select('id')
          .eq('owner_id', session.user.id)
          .single();

        if (officeErr || !office) {
          toast.error(lang === 'ar' ? 'لم يتم العثور على المكتب' : 'Office not found');
          setLoading(false);
          return;
        }
        officeId = office.id;
      }

      // Insert property
      const { data: property, error: propErr } = await supabase
        .from('properties')
        .insert({
          title: form.title,
          description: form.description,
          listing_type: form.listingType,
          property_type: form.propertyType,
          address: form.address,
          price: parseFloat(form.price) || 0,
          area_size: parseFloat(form.areaSize) || 0,
          rooms: parseInt(form.rooms) || 1,
          bathrooms: parseInt(form.bathrooms) || 1,
          living_rooms: parseInt(form.livingRooms) || 1,
          kitchens: parseInt(form.kitchens) || 1,
          floor: parseInt(form.floor) || 0,
          total_floors: parseInt(form.totalFloors) || 0,
          building_age: parseInt(form.buildingAge) || 0,
          direction: form.direction,
          view: form.view,
          ownership_type: form.ownershipType,
          payment_method: form.paymentMethod,
          furnished: form.furnished,
          features: features,
          contact_phone: form.contactPhone,
          whatsapp: form.whatsapp,
          video_url: form.videoUrl,
          office_id: officeId,
          status: isAdmin ? 'active' : 'pending',
        })
        .select('id')
        .single();

      if (propErr || !property) {
        console.error('Property insert error:', propErr);
        toast.error(lang === 'ar' ? 'فشل إنشاء العقار' : 'Failed to create property');
        setLoading(false);
        return;
      }

      // Insert images
      const imageInserts = images.map((img) => ({
        property_id: property.id,
        image_url: img.url,
        is_cover: img.isCover,
      }));

      const { error: imgErr } = await supabase.from('property_images').insert(imageInserts);

      if (imgErr) {
        console.error('Image insert error:', imgErr);
      }

      toast.success(
        lang === 'ar'
          ? 'تم إضافة العقار بنجاح - بانتظار الموافقة'
          : 'Property added successfully - pending approval',
      );
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <BackIcon className="h-4 w-4" /> {t('detail.back')}
        </button>
        <h2 className="text-xl font-bold">{t('dash.add_property')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="rounded-xl bg-card p-5 shadow-card">
          <Label className="mb-3 block text-base font-semibold">
            {lang === 'ar' ? 'صور العقار (6 صور كحد أقصى)' : 'Property Images (max 6)'}
          </Label>
          <PropertyImageUpload images={images} onImagesChange={setImages} maxImages={6} />
        </div>

        {/* Office selector for admin */}
        {isAdmin && (
          <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
            <h3 className="text-base font-semibold">
              {lang === 'ar' ? 'المكتب العقاري' : 'Office'}
            </h3>
            <div>
              <Label>{lang === 'ar' ? 'اختر المكتب' : 'Select Office'}</Label>
              <select
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">{t('common.select')}</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.office_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold">
            {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}
          </h3>

          <div>
            <Label>{lang === 'ar' ? 'عنوان الإعلان' : 'Listing Title'} *</Label>
            <Input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              placeholder={
                lang === 'ar' ? 'مثال: شقة فاخرة في المزة' : 'e.g. Luxury apartment in Mazzeh'
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang === 'ar' ? 'نوع الإعلان' : 'Listing Type'} *</Label>
              <select
                value={form.listingType}
                onChange={(e) => update('listingType', e.target.value)}
                className={selectClass}
              >
                <option value="sale">{t('listing.sale')}</option>
                <option value="rent">{t('listing.rent')}</option>
              </select>
            </div>
            <div>
              <Label>{t('property.type')} *</Label>
              <select
                value={form.propertyType}
                onChange={(e) => update('propertyType', e.target.value)}
                className={selectClass}
              >
                {propertyTypes.map((pt) => (
                  <option key={pt.key} value={pt.key}>
                    {pt[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                {t('detail.price')} ({t('common.syp')}) *
              </Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                required
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label>
              <select
                value={form.paymentMethod}
                onChange={(e) => update('paymentMethod', e.target.value)}
                className={selectClass}
              >
                <option value="">{t('common.select')}</option>
                {paymentOptions.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>{lang === 'ar' ? 'نوع الملكية' : 'Ownership Type'}</Label>
            <select
              value={form.ownershipType}
              onChange={(e) => update('ownershipType', e.target.value)}
              className={selectClass}
            >
              <option value="">{t('common.select')}</option>
              {ownershipOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o[lang]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t('detail.description')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder={
                lang === 'ar' ? 'وصف تفصيلي للعقار...' : 'Detailed property description...'
              }
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold">{lang === 'ar' ? 'الموقع' : 'Location'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('gov.label')} *</Label>
              <select
                value={form.governorate}
                onChange={(e) => {
                  update('governorate', e.target.value);
                  update('area', '');
                }}
                className={selectClass}
                required
              >
                <option value="">{t('common.select')}</option>
                {governorates.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('filter.area')}</Label>
              <select
                value={form.area}
                onChange={(e) => update('area', e.target.value)}
                className={selectClass}
                disabled={!form.governorate}
              >
                <option value="">{t('common.select')}</option>
                {currentAreas.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>{t('auth.address')}</Label>
            <Input
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder={lang === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}
            />
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold">
            {lang === 'ar' ? 'تفاصيل العقار' : 'Property Details'}
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>{lang === 'ar' ? 'غرف النوم' : 'Bedrooms'}</Label>
              <Input
                type="number"
                value={form.rooms}
                onChange={(e) => update('rooms', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'غرف المعيشة' : 'Living Rooms'}</Label>
              <Input
                type="number"
                value={form.livingRooms}
                onChange={(e) => update('livingRooms', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{t('filter.bathrooms')}</Label>
              <Input
                type="number"
                value={form.bathrooms}
                onChange={(e) => update('bathrooms', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'المطابخ' : 'Kitchens'}</Label>
              <Input
                type="number"
                value={form.kitchens}
                onChange={(e) => update('kitchens', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>{t('filter.floor')}</Label>
              <Input
                type="number"
                value={form.floor}
                onChange={(e) => update('floor', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'عدد الطوابق' : 'Total Floors'}</Label>
              <Input
                type="number"
                value={form.totalFloors}
                onChange={(e) => update('totalFloors', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'المساحة (م²)' : 'Size (m²)'}</Label>
              <Input
                type="number"
                value={form.areaSize}
                onChange={(e) => update('areaSize', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'عمر البناء (سنوات)' : 'Building Age (years)'}</Label>
              <Input
                type="number"
                value={form.buildingAge}
                onChange={(e) => update('buildingAge', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang === 'ar' ? 'الاتجاه' : 'Direction'}</Label>
              <select
                value={form.direction}
                onChange={(e) => update('direction', e.target.value)}
                className={selectClass}
              >
                <option value="">{t('common.select')}</option>
                {directionOptions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{lang === 'ar' ? 'الإطلالة' : 'View'}</Label>
              <select
                value={form.view}
                onChange={(e) => update('view', e.target.value)}
                className={selectClass}
              >
                <option value="">{t('common.select')}</option>
                {viewOptions.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.furnished} onCheckedChange={(v) => update('furnished', v)} />
            <Label>{t('filter.furnished_yes')}</Label>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold">
            {lang === 'ar' ? 'المميزات والمرافق' : 'Features & Amenities'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {featureOptions.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFeature(f.key)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  features.includes(f.key)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 rounded-xl bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold">
            {lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder={lang === 'ar' ? '+963 9XX XXX XXX' : '+963 9XX XXX XXX'}
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder={lang === 'ar' ? '+963 9XX XXX XXX' : '+963 9XX XXX XXX'}
              />
            </div>
          </div>
          <div>
            <Label>{lang === 'ar' ? 'رابط فيديو (يوتيوب)' : 'Video URL (YouTube)'}</Label>
            <Input
              value={form.videoUrl}
              onChange={(e) => update('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="gradient-primary flex-1 text-primary-foreground"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('dash.add_property')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPropertyForm;
