export type Lang = 'ar' | 'en';

export const translations = {
  // Header
  'site.name': { ar: 'سوريا 14', en: 'Syria 14' },
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.search': { ar: 'البحث', en: 'Search' },
  'nav.favorites': { ar: 'المفضلة', en: 'Favorites' },
  'nav.contact': { ar: 'اتصل بنا', en: 'Contact' },
  'nav.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'nav.register': { ar: 'إنشاء حساب', en: 'Register' },
  'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'nav.hello': { ar: 'مرحباً', en: 'Hello' },

  // Theme
  'theme.light': { ar: 'فاتح', en: 'Light' },
  'theme.dark': { ar: 'داكن', en: 'Dark' },
  'theme.syria': { ar: 'سوريا 🇸🇾', en: 'Syria 🇸🇾' },

  // Hero
  'hero.title': { ar: 'اعثر على منزل أحلامك في سوريا', en: 'Find Your Dream Home in Syria' },
  'hero.subtitle': {
    ar: 'اكتشف أفضل العقارات للبيع والإيجار في جميع أنحاء سوريا',
    en: 'Discover the best properties for sale and rent across Syria',
  },

  // Search
  'search.button': { ar: 'بحث', en: 'Search' },
  'search.results': { ar: 'نتائج البحث', en: 'Search Results' },
  'search.no_results': { ar: 'لا توجد نتائج', en: 'No results found' },
  'search.advanced': { ar: 'بحث متقدم', en: 'Advanced Search' },

  // Listing type
  'listing.all': { ar: 'الكل', en: 'All' },
  'listing.rent': { ar: 'للإيجار', en: 'For Rent' },
  'listing.sale': { ar: 'للبيع', en: 'For Sale' },

  // Property types
  'property.type': { ar: 'نوع العقار', en: 'Property Type' },
  'property.apartment': { ar: 'شقة', en: 'Apartment' },
  'property.villa': { ar: 'فيلا', en: 'Villa' },
  'property.villa_pool': { ar: 'فيلا مع مسبح', en: 'Villa with Pool' },
  'property.chalet': { ar: 'شاليه', en: 'Chalet' },
  'property.arabic_house': { ar: 'بيت عربي', en: 'Arabic House' },
  'property.office': { ar: 'مكتب', en: 'Office' },
  'property.shop': { ar: 'محل تجاري', en: 'Shop' },
  'property.warehouse': { ar: 'مستودع', en: 'Warehouse' },
  'property.hotel_apt': { ar: 'شقة فندقية', en: 'Hotel Apartment' },
  'property.agri_land': { ar: 'أرض زراعية', en: 'Agricultural Land' },
  'property.comm_land': { ar: 'أرض تجارية', en: 'Commercial Land' },
  'property.building': { ar: 'بناء', en: 'Building' },

  // Governorates
  'gov.label': { ar: 'المحافظة', en: 'Governorate' },
  'gov.damascus': { ar: 'دمشق', en: 'Damascus' },
  'gov.rural_damascus': { ar: 'ريف دمشق', en: 'Rural Damascus' },
  'gov.aleppo': { ar: 'حلب', en: 'Aleppo' },
  'gov.homs': { ar: 'حمص', en: 'Homs' },
  'gov.hama': { ar: 'حماة', en: 'Hama' },
  'gov.latakia': { ar: 'اللاذقية', en: 'Latakia' },
  'gov.tartus': { ar: 'طرطوس', en: 'Tartus' },
  'gov.idlib': { ar: 'إدلب', en: 'Idlib' },
  'gov.daraa': { ar: 'درعا', en: 'Daraa' },
  'gov.sweida': { ar: 'السويداء', en: 'Sweida' },
  'gov.quneitra': { ar: 'القنيطرة', en: 'Quneitra' },
  'gov.raqqa': { ar: 'الرقة', en: 'Raqqa' },
  'gov.deir_ez_zor': { ar: 'دير الزور', en: 'Deir ez-Zor' },
  'gov.hasakah': { ar: 'الحسكة', en: 'Hasakah' },

  // Filters
  'filter.area': { ar: 'المنطقة', en: 'Area' },
  'filter.furnished': { ar: 'الفرش', en: 'Furnished' },
  'filter.furnished_yes': { ar: 'مفروش', en: 'Furnished' },
  'filter.furnished_no': { ar: 'غير مفروش', en: 'Not Furnished' },
  'filter.floor': { ar: 'الطابق', en: 'Floor' },
  'filter.ground': { ar: 'أرضي', en: 'Ground' },
  'filter.rooms': { ar: 'الغرف', en: 'Rooms' },
  'filter.bathrooms': { ar: 'الحمامات', en: 'Bathrooms' },
  'filter.price_from': { ar: 'السعر من', en: 'Price From' },
  'filter.price_to': { ar: 'السعر إلى', en: 'Price To' },
  'filter.area_from': { ar: 'المساحة من', en: 'Area From' },
  'filter.area_to': { ar: 'المساحة إلى', en: 'Area To' },
  'filter.all': { ar: 'الكل', en: 'All' },

  // Property details
  'detail.description': { ar: 'الوصف', en: 'Description' },
  'detail.contact': { ar: 'رقم التواصل', en: 'Contact Number' },
  'detail.office': { ar: 'المكتب العقاري', en: 'Real Estate Office' },
  'detail.call': { ar: 'اتصال', en: 'Call' },
  'detail.whatsapp': { ar: 'واتساب', en: 'WhatsApp' },
  'detail.save': { ar: 'حفظ في المفضلة', en: 'Save to Favorites' },
  'detail.saved': { ar: 'محفوظ', en: 'Saved' },
  'detail.back': { ar: 'رجوع', en: 'Back' },
  'detail.price': { ar: 'السعر', en: 'Price' },
  'detail.sqm': { ar: 'م²', en: 'm²' },

  // Features
  'feature.balcony': { ar: 'شرفة', en: 'Balcony' },
  'feature.elevator': { ar: 'مصعد', en: 'Elevator' },
  'feature.parking': { ar: 'موقف سيارات', en: 'Parking' },
  'feature.pool': { ar: 'مسبح', en: 'Swimming Pool' },
  'feature.garden': { ar: 'حديقة', en: 'Garden' },
  'feature.heating': { ar: 'تدفئة', en: 'Heating' },
  'feature.ac': { ar: 'تكييف', en: 'Air Conditioning' },

  // Auth
  'auth.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'auth.register': { ar: 'إنشاء حساب', en: 'Register' },
  'auth.register_office': { ar: 'تسجيل مكتب عقاري', en: 'Register Office' },
  'auth.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.name': { ar: 'الاسم الكامل', en: 'Full Name' },
  'auth.phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'auth.office_name': { ar: 'اسم المكتب', en: 'Office Name' },
  'auth.manager_name': { ar: 'اسم المدير', en: 'Manager Name' },
  'auth.address': { ar: 'العنوان', en: 'Address' },
  'auth.description': { ar: 'وصف المكتب', en: 'Office Description' },
  'auth.logo': { ar: 'شعار المكتب', en: 'Office Logo' },
  'auth.pending': { ar: 'بانتظار الموافقة', en: 'Pending Approval' },
  'auth.as_user': { ar: 'كمستخدم', en: 'As User' },
  'auth.as_office': { ar: 'كمكتب عقاري', en: 'As Real Estate Office' },
  'auth.no_account': { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  'auth.has_account': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },

  // Dashboard
  'dash.overview': { ar: 'نظرة عامة', en: 'Overview' },
  'dash.properties': { ar: 'العقارات', en: 'Properties' },
  'dash.add_property': { ar: 'إضافة عقار', en: 'Add Property' },
  'dash.active': { ar: 'نشط', en: 'Active' },
  'dash.pending': { ar: 'بانتظار الموافقة', en: 'Pending' },
  'dash.inactive': { ar: 'غير نشط', en: 'Inactive' },
  'dash.rejected': { ar: 'مرفوض', en: 'Rejected' },
  'dash.profile': { ar: 'الملف الشخصي', en: 'Profile' },
  'dash.messages': { ar: 'الرسائل', en: 'Messages' },
  'dash.users': { ar: 'المستخدمون', en: 'Users' },
  'dash.offices': { ar: 'المكاتب العقارية', en: 'Offices' },
  'dash.stats': { ar: 'الإحصائيات', en: 'Statistics' },
  'dash.settings': { ar: 'الإعدادات', en: 'Settings' },
  'dash.approve': { ar: 'موافقة', en: 'Approve' },
  'dash.reject': { ar: 'رفض', en: 'Reject' },
  'dash.activate': { ar: 'تفعيل', en: 'Activate' },
  'dash.deactivate': { ar: 'إلغاء التفعيل', en: 'Deactivate' },
  'dash.delete': { ar: 'حذف', en: 'Delete' },
  'dash.total_properties': { ar: 'إجمالي العقارات', en: 'Total Properties' },
  'dash.total_users': { ar: 'إجمالي المستخدمين', en: 'Total Users' },
  'dash.total_offices': { ar: 'إجمالي المكاتب', en: 'Total Offices' },
  'dash.pending_approvals': { ar: 'بانتظار الموافقة', en: 'Pending Approvals' },

  // Office
  'office.pending_approval': { ar: 'في انتظار الموافقة', en: 'Pending Approval' },
  'office.pending_message': {
    ar: 'مكتبك قيد المراجعة من قبل الإدارة. ستحصل على إشعار عند اكتمال المراجعة.',
    en: 'Your office is under review by admin. You will be notified when the review is complete.',
  },
  'office.application_rejected': { ar: 'تم رفض الطلب', en: 'Application Rejected' },
  'office.rejection_message': {
    ar: 'تم رفض طلب تسجيل مكتبك. يرجى التواصل معنا لمزيد من التفاصيل.',
    en: 'Your office registration was rejected. Please contact us for more details.',
  },

  // Pages
  'page.terms': { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  'page.privacy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  'page.contact': { ar: 'اتصل بنا', en: 'Contact Us' },

  // Footer
  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.desc': { ar: 'منصة العقارات الأولى في سوريا', en: "Syria's #1 Real Estate Platform" },

  // Common
  'common.syp': { ar: 'ل.س', en: 'SYP' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.submit': { ar: 'إرسال', en: 'Submit' },
  'common.select': { ar: 'اختر', en: 'Select' },
} as const;

export type TranslationKey = keyof typeof translations;
