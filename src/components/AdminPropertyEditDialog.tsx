import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { propertyTypes } from '@/data/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface EditableProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  listing_type: string;
  property_type: string;
  rooms: number;
  bathrooms: number;
  area_size: number;
  floor: number;
  furnished: boolean;
  address: string;
  status: string;
}

interface AdminPropertyEditDialogProps {
  property: EditableProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: EditableProperty) => void;
}

const AdminPropertyEditDialog = ({
  property,
  open,
  onOpenChange,
  onSaved,
}: AdminPropertyEditDialogProps) => {
  const { lang, t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    listing_type: 'sale',
    property_type: 'apartment',
    rooms: '1',
    bathrooms: '1',
    area_size: '',
    floor: '0',
    furnished: false,
    address: '',
    status: 'pending',
  });

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title,
        description: property.description || '',
        price: String(property.price),
        listing_type: property.listing_type,
        property_type: property.property_type,
        rooms: String(property.rooms),
        bathrooms: String(property.bathrooms),
        area_size: String(property.area_size),
        floor: String(property.floor),
        furnished: property.furnished,
        address: property.address || '',
        status: property.status,
      });
    }
  }, [property]);

  const update = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price) || 0,
      listing_type: form.listing_type as 'rent' | 'sale',
      property_type: form.property_type,
      rooms: parseInt(form.rooms) || 0,
      bathrooms: parseInt(form.bathrooms) || 0,
      area_size: parseFloat(form.area_size) || 0,
      floor: parseInt(form.floor) || 0,
      furnished: form.furnished,
      address: form.address,
      status: form.status,
    };

    const { error } = await supabase.from('properties').update(payload).eq('id', property.id);

    if (error) {
      console.error('Update error:', error);
      toast.error(lang === 'ar' ? 'فشل التحديث' : 'Update failed');
    } else {
      toast.success(lang === 'ar' ? 'تم تحديث العقار بنجاح' : 'Property updated successfully');
      onSaved({ ...property, ...payload });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang === 'ar' ? 'تعديل العقار' : 'Edit Property'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <Label>{lang === 'ar' ? 'عنوان الإعلان' : 'Listing Title'}</Label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>

          {/* Listing type + Property type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang === 'ar' ? 'نوع الإعلان' : 'Listing Type'}</Label>
              <select
                value={form.listing_type}
                onChange={(e) => update('listing_type', e.target.value)}
                className={selectClass}
              >
                <option value="sale">{t('listing.sale')}</option>
                <option value="rent">{t('listing.rent')}</option>
              </select>
            </div>
            <div>
              <Label>{t('property.type')}</Label>
              <select
                value={form.property_type}
                onChange={(e) => update('property_type', e.target.value)}
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

          {/* Status */}
          <div>
            <Label>{lang === 'ar' ? 'الحالة' : 'Status'}</Label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className={selectClass}
            >
              <option value="pending">{lang === 'ar' ? 'بانتظار' : 'Pending'}</option>
              <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
              <option value="rejected">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <Label>
              {t('detail.price')} ({t('common.syp')})
            </Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              min="0"
            />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>{t('filter.rooms')}</Label>
              <Input
                type="number"
                value={form.rooms}
                onChange={(e) => update('rooms', e.target.value)}
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
              <Label>{t('filter.floor')}</Label>
              <Input
                type="number"
                value={form.floor}
                onChange={(e) => update('floor', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label>{lang === 'ar' ? 'المساحة (م²)' : 'Size (m²)'}</Label>
              <Input
                type="number"
                value={form.area_size}
                onChange={(e) => update('area_size', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Furnished */}
          <div className="flex items-center gap-3">
            <Switch checked={form.furnished} onCheckedChange={(v) => update('furnished', v)} />
            <Label>{t('filter.furnished_yes')}</Label>
          </div>

          {/* Address */}
          <div>
            <Label>{t('auth.address')}</Label>
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <Label>{t('detail.description')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPropertyEditDialog;
