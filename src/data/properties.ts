export interface Property {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  listingType: 'rent' | 'sale';
  propertyType: string;
  governorate: string;
  area: string;
  address: { ar: string; en: string };
  price: number;
  areaSize: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  furnished: boolean;
  features: string[];
  images: string[];
  coverIndex: number;
  phone: string;
  officeName: { ar: string; en: string };
  officeId: string;
  status: 'active' | 'pending' | 'inactive' | 'rejected';
  createdAt: string;
}

export const governorates: { key: string; ar: string; en: string }[] = [
  { key: 'damascus', ar: 'دمشق', en: 'Damascus' },
  { key: 'rural_damascus', ar: 'ريف دمشق', en: 'Rural Damascus' },
  { key: 'aleppo', ar: 'حلب', en: 'Aleppo' },
  { key: 'homs', ar: 'حمص', en: 'Homs' },
  { key: 'hama', ar: 'حماة', en: 'Hama' },
  { key: 'latakia', ar: 'اللاذقية', en: 'Latakia' },
  { key: 'tartus', ar: 'طرطوس', en: 'Tartus' },
  { key: 'idlib', ar: 'إدلب', en: 'Idlib' },
  { key: 'daraa', ar: 'درعا', en: 'Daraa' },
  { key: 'sweida', ar: 'السويداء', en: 'Sweida' },
  { key: 'quneitra', ar: 'القنيطرة', en: 'Quneitra' },
  { key: 'raqqa', ar: 'الرقة', en: 'Raqqa' },
  { key: 'deir_ez_zor', ar: 'دير الزور', en: 'Deir ez-Zor' },
  { key: 'hasakah', ar: 'الحسكة', en: 'Hasakah' },
];

export const areas: Record<string, { key: string; ar: string; en: string }[]> = {
  damascus: [
    { key: 'mazzeh', ar: 'المزة', en: 'Mazzeh' },
    { key: 'malki', ar: 'المالكي', en: 'Malki' },
    { key: 'abu_rummaneh', ar: 'أبو رمانة', en: 'Abu Rummaneh' },
    { key: 'bab_touma', ar: 'باب توما', en: 'Bab Touma' },
    { key: 'kafar_souseh', ar: 'كفرسوسة', en: 'Kafar Souseh' },
    { key: 'mashrou_dummar', ar: 'مشروع دمر', en: 'Dummar' },
    { key: 'qasaa', ar: 'القصاع', en: 'Qasaa' },
  ],
  rural_damascus: [
    { key: 'jaramana', ar: 'جرمانا', en: 'Jaramana' },
    { key: 'sahnaya', ar: 'صحنايا', en: 'Sahnaya' },
    { key: 'daraya', ar: 'داريا', en: 'Daraya' },
    { key: 'qudsaya', ar: 'قدسيا', en: 'Qudsaya' },
    { key: 'yabroud', ar: 'يبرود', en: 'Yabroud' },
  ],
  aleppo: [
    { key: 'azizieh', ar: 'العزيزية', en: 'Azizieh' },
    { key: 'shahba', ar: 'شهبا', en: 'Shahba' },
    { key: 'hamdaniyeh', ar: 'الحمدانية', en: 'Hamdaniyeh' },
    { key: 'jamileh', ar: 'الجميلية', en: 'Jamileh' },
  ],
  homs: [
    { key: 'homs_center', ar: 'وسط حمص', en: 'Homs Center' },
    { key: 'inshaat', ar: 'الإنشاءات', en: 'Inshaat' },
    { key: 'waer', ar: 'الوعر', en: 'Waer' },
  ],
  latakia: [
    { key: 'latakia_center', ar: 'وسط اللاذقية', en: 'Latakia Center' },
    { key: 'corniche', ar: 'الكورنيش', en: 'Corniche' },
    { key: 'ziraa', ar: 'الزراعة', en: 'Ziraa' },
  ],
  tartus: [
    { key: 'tartus_center', ar: 'وسط طرطوس', en: 'Tartus Center' },
    { key: 'corniche_tartus', ar: 'الكورنيش', en: 'Corniche' },
  ],
  hama: [{ key: 'hama_center', ar: 'وسط حماة', en: 'Hama Center' }],
  idlib: [{ key: 'idlib_center', ar: 'وسط إدلب', en: 'Idlib Center' }],
  daraa: [{ key: 'daraa_center', ar: 'وسط درعا', en: 'Daraa Center' }],
  sweida: [{ key: 'sweida_center', ar: 'وسط السويداء', en: 'Sweida Center' }],
  quneitra: [{ key: 'quneitra_center', ar: 'وسط القنيطرة', en: 'Quneitra Center' }],
  raqqa: [{ key: 'raqqa_center', ar: 'وسط الرقة', en: 'Raqqa Center' }],
  deir_ez_zor: [{ key: 'deir_center', ar: 'وسط دير الزور', en: 'Deir ez-Zor Center' }],
  hasakah: [{ key: 'hasakah_center', ar: 'وسط الحسكة', en: 'Hasakah Center' }],
};

export const propertyTypes: { key: string; ar: string; en: string }[] = [
  { key: 'apartment', ar: 'شقة', en: 'Apartment' },
  { key: 'villa', ar: 'فيلا', en: 'Villa' },
  { key: 'villa_pool', ar: 'فيلا مع مسبح', en: 'Villa with Pool' },
  { key: 'chalet', ar: 'شاليه', en: 'Chalet' },
  { key: 'arabic_house', ar: 'بيت عربي', en: 'Arabic House' },
  { key: 'office', ar: 'مكتب', en: 'Office' },
  { key: 'shop', ar: 'محل تجاري', en: 'Shop' },
  { key: 'warehouse', ar: 'مستودع', en: 'Warehouse' },
  { key: 'hotel_apt', ar: 'شقة فندقية', en: 'Hotel Apartment' },
  { key: 'agri_land', ar: 'أرض زراعية', en: 'Agricultural Land' },
  { key: 'comm_land', ar: 'أرض تجارية', en: 'Commercial Land' },
  { key: 'building', ar: 'بناء', en: 'Building' },
];

// Sample properties
export const sampleProperties: Property[] = [
  {
    id: '1',
    title: { ar: 'شقة فاخرة في المزة', en: 'Luxury Apartment in Mazzeh' },
    description: {
      ar: 'شقة فاخرة بإطلالة رائعة على الجبل، تشطيبات عالية الجودة مع ديكور حديث. تتميز بموقع ممتاز قرب الخدمات والمرافق.',
      en: 'Luxury apartment with stunning mountain views, high-quality finishes and modern decor. Excellent location near services and amenities.',
    },
    listingType: 'sale',
    propertyType: 'apartment',
    governorate: 'damascus',
    area: 'mazzeh',
    address: { ar: 'المزة - فيلات غربية', en: 'Mazzeh - Western Villas' },
    price: 850000000,
    areaSize: 220,
    rooms: 4,
    bathrooms: 2,
    floor: 5,
    furnished: true,
    features: ['balcony', 'elevator', 'parking', 'ac'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    coverIndex: 0,
    phone: '+963912345678',
    officeName: { ar: 'مكتب العدنان', en: 'Al Adnan Office' },
    officeId: '2',
    status: 'active',
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    title: { ar: 'فيلا مع مسبح في يعفور', en: 'Villa with Pool in Yaafour' },
    description: {
      ar: 'فيلا مستقلة مع مسبح خاص وحديقة واسعة، مناسبة للعائلات الكبيرة. تصميم عصري وإطلالة طبيعية خلابة.',
      en: 'Detached villa with private pool and spacious garden, suitable for large families. Modern design with stunning natural views.',
    },
    listingType: 'sale',
    propertyType: 'villa_pool',
    governorate: 'rural_damascus',
    area: 'qudsaya',
    address: { ar: 'قدسيا - يعفور', en: 'Qudsaya - Yaafour' },
    price: 2500000000,
    areaSize: 500,
    rooms: 6,
    bathrooms: 4,
    floor: 0,
    furnished: false,
    features: ['pool', 'garden', 'parking', 'ac', 'heating'],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    coverIndex: 0,
    phone: '+963911222333',
    officeName: { ar: 'مكتب الشام', en: 'Al Sham Office' },
    officeId: '3',
    status: 'active',
    createdAt: '2026-02-28',
  },
  {
    id: '3',
    title: { ar: 'شقة للإيجار في أبو رمانة', en: 'Apartment for Rent in Abu Rummaneh' },
    description: {
      ar: 'شقة مفروشة بالكامل في أرقى أحياء دمشق، قريبة من السفارات والمطاعم الراقية.',
      en: 'Fully furnished apartment in the finest Damascus neighborhood, close to embassies and upscale restaurants.',
    },
    listingType: 'rent',
    propertyType: 'apartment',
    governorate: 'damascus',
    area: 'abu_rummaneh',
    address: { ar: 'أبو رمانة - شارع الجلاء', en: 'Abu Rummaneh - Al Jalaa St.' },
    price: 5000000,
    areaSize: 150,
    rooms: 3,
    bathrooms: 2,
    floor: 3,
    furnished: true,
    features: ['balcony', 'elevator', 'ac', 'heating'],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    coverIndex: 0,
    phone: '+963933444555',
    officeName: { ar: 'مكتب العدنان', en: 'Al Adnan Office' },
    officeId: '2',
    status: 'active',
    createdAt: '2026-03-05',
  },
  {
    id: '4',
    title: { ar: 'محل تجاري في حلب', en: 'Commercial Shop in Aleppo' },
    description: {
      ar: 'محل تجاري بموقع استراتيجي في قلب مدينة حلب، مناسب لجميع الأنشطة التجارية.',
      en: 'Commercial shop in a strategic location in the heart of Aleppo, suitable for all commercial activities.',
    },
    listingType: 'rent',
    propertyType: 'shop',
    governorate: 'aleppo',
    area: 'azizieh',
    address: { ar: 'العزيزية - الشارع الرئيسي', en: 'Azizieh - Main Street' },
    price: 3000000,
    areaSize: 80,
    rooms: 1,
    bathrooms: 1,
    floor: 0,
    furnished: false,
    features: ['parking'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    coverIndex: 0,
    phone: '+963944555666',
    officeName: { ar: 'مكتب الشهباء', en: 'Al Shahba Office' },
    officeId: '4',
    status: 'active',
    createdAt: '2026-03-03',
  },
  {
    id: '5',
    title: { ar: 'شاليه على البحر في اللاذقية', en: 'Beach Chalet in Latakia' },
    description: {
      ar: 'شاليه مطل على البحر مباشرة مع إطلالة بانورامية. مثالي للعطلات الصيفية والاسترخاء.',
      en: 'Seaside chalet with direct sea view and panoramic outlook. Ideal for summer holidays and relaxation.',
    },
    listingType: 'sale',
    propertyType: 'chalet',
    governorate: 'latakia',
    area: 'corniche',
    address: { ar: 'الكورنيش الجنوبي', en: 'South Corniche' },
    price: 1200000000,
    areaSize: 180,
    rooms: 3,
    bathrooms: 2,
    floor: 0,
    furnished: true,
    features: ['garden', 'ac', 'pool', 'balcony'],
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    ],
    coverIndex: 0,
    phone: '+963955666777',
    officeName: { ar: 'مكتب الساحل', en: 'Coast Office' },
    officeId: '5',
    status: 'active',
    createdAt: '2026-02-20',
  },
  {
    id: '6',
    title: { ar: 'بيت عربي تراثي في باب توما', en: 'Traditional Arabic House in Bab Touma' },
    description: {
      ar: 'بيت عربي أصيل في قلب دمشق القديمة مع فسحة سماوية وعناصر تراثية أصيلة. فرصة استثمارية مميزة.',
      en: 'Authentic Arabic house in the heart of Old Damascus with a courtyard and original heritage elements. Unique investment opportunity.',
    },
    listingType: 'sale',
    propertyType: 'arabic_house',
    governorate: 'damascus',
    area: 'bab_touma',
    address: { ar: 'باب توما - دمشق القديمة', en: 'Bab Touma - Old Damascus' },
    price: 3000000000,
    areaSize: 350,
    rooms: 5,
    bathrooms: 3,
    floor: 0,
    furnished: false,
    features: ['garden', 'heating'],
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    ],
    coverIndex: 0,
    phone: '+963912345678',
    officeName: { ar: 'مكتب العدنان', en: 'Al Adnan Office' },
    officeId: '2',
    status: 'active',
    createdAt: '2026-03-07',
  },
];
