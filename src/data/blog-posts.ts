export interface BlogSection {
  heading: { ar: string; en: string };
  body: { ar: string; en: string };
}

export interface BlogPost {
  slug: string;
  image: string;
  category: { ar: string; en: string };
  publishedAt: string; // YYYY-MM-DD
  readTime: { ar: string; en: string };
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  seo: {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
  };
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // POST 1 — Syrian Food Traditions
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: 'syrian-food-traditions',
    image: '/hero-damascus.png',
    category: { ar: 'ثقافة وتراث', en: 'Culture & Heritage' },
    publishedAt: '2026-04-15',
    readTime: { ar: '8 دقائق', en: '8 min read' },
    title: {
      ar: 'التقاليد الغذائية السورية والتراث الثقافي',
      en: 'Syrian Food Traditions and Cultural Heritage',
    },
    excerpt: {
      ar: 'اكتشف عمق الثقافة السورية من خلال مطبخها الأصيل — قصص المائدة التي تجمع العائلات، وأسرار النكهات التي توارثتها الأجيال من دمشق إلى حلب.',
      en: 'Discover the depth of Syrian culture through its authentic cuisine — stories of tables that bring families together and the secrets of flavours passed down through generations from Damascus to Aleppo.',
    },
    seo: {
      titleAr: 'التقاليد الغذائية السورية — تراث طهي عريق | سيريا 14',
      titleEn: 'Syrian Food Traditions & Cultural Heritage | Syria 14',
      descriptionAr:
        'رحلة عبر التراث الغذائي السوري الأصيل — أشهر الأطباق من دمشق وحلب وحمص، والتقاليد الاجتماعية حول المائدة السورية.',
      descriptionEn:
        "A journey through Syria's authentic culinary heritage — famous dishes from Damascus, Aleppo and Homs, and the social traditions around the Syrian table.",
    },
    sections: [
      {
        heading: { ar: 'مقدمة: المطبخ كهوية', en: 'Introduction: Food as Identity' },
        body: {
          ar: 'لا يمكن فهم سوريا دون الجلوس على مائدتها. فالطعام هنا ليس مجرد وجبة تُقدَّم لإشباع الجوع، بل هو لغة تواصل، وذاكرة جماعية، وهوية راسخة تمتد عبر آلاف السنين. منذ فجر الحضارات في بلاد الشام، كانت أرض سوريا تنتج أجود الحبوب والزيتون والفواكه، وكان سكانها يُبدعون في تحويل هذه الهبات الطبيعية إلى فنون طهي لا مثيل لها.',
          en: 'You cannot understand Syria without sitting at its table. Food here is not merely a meal served to satisfy hunger — it is a language of connection, a collective memory, and a deep-rooted identity stretching back thousands of years. Since the dawn of civilisation in the Levant, Syrian land has produced the finest grains, olives, and fruits, and its people have long excelled at transforming these natural gifts into unparalleled culinary arts.',
        },
      },
      {
        heading: { ar: 'دمشق — عاصمة النكهات', en: 'Damascus — Capital of Flavours' },
        body: {
          ar: 'تُعدّ دمشق من أعرق المدن في العالم، وتراثها الغذائي يعكس هذا العمق التاريخي. من أشهر أطباقها "الكبة الدمشقية" بطبقتيها من البرغل ولحم الضأن المتبّل، و"الشيش برك" وهو فطائر اللحم المطهوة بالزبادي والثوم. لا تستطيع أن تغادر دمشق دون تذوّق "الفول الحمصي" في الصباح الباكر مع زيت الزيتون، أو "المحمرة" التي تُقدَّم على المائدة كمقبّلة لا غنى عنها.',
          en: 'Damascus is among the oldest cities in the world, and its culinary heritage reflects this historical depth. Among its most celebrated dishes is "Kibbeh Dimashqiyya" — layered bulgur and seasoned lamb — and "Shish Barak", delicate meat pastries simmered in garlicky yoghurt. You cannot leave Damascus without tasting morning "Ful Hammasi" drizzled with olive oil, or "Muhammara", the roasted pepper and walnut spread that graces every table as an indispensable starter.',
        },
      },
      {
        heading: { ar: 'حلب — بوابة التوابل', en: 'Aleppo — Gateway of Spices' },
        body: {
          ar: 'حلب مدينة التوابل بامتياز. لقرون طويلة كانت محطةً رئيسية على طريق الحرير، مما أغنى مطبخها بمزيج فريد من النكهات الشرقية والمتوسطية. الفلفل الحلبي المشهور بنكهته المتوازنة بين الحرارة والحلاوة، يُضاف إلى عشرات الأطباق كـ"الغزال" و"الكباب بالكرز". لا يُنسى "الكبة الحلبية" المقلية المحشوة بالصنوبر والزبيب، وهي مختلفة تماماً عن نظيرتها الدمشقية.',
          en: 'Aleppo is the city of spices par excellence. For centuries it served as a key station on the Silk Road, enriching its cuisine with a unique blend of Eastern and Mediterranean flavours. The famous Aleppo pepper — balanced between heat and sweetness — is added to dozens of dishes such as "Ghazal" kebabs and the celebrated "Cherry Kebab". Unforgettable too is the fried "Kibbeh Halabiyya" stuffed with pine nuts and raisins, entirely distinct from its Damascene counterpart.',
        },
      },
      {
        heading: {
          ar: 'حمص وطرطوس — بساطة البحر والبر',
          en: 'Homs and Tartus — Simplicity of Sea and Land',
        },
        body: {
          ar: 'تشتهر حمص بـ"الحمص بالطحينة" الذي أعطى المدينة اسمها في الوعي العالمي، لكنها أيضاً مصدر "الكبة النية" — لحم الخروف النيء المخلوط بالبرغل والبصل — الذي يأكله الحمصيون بجرأة وشهية. أما طرطوس وساحل سوريا، فيُقدّم مطبخها شواء السمك الطازج مع زيت الزيتون والليمون والكزبرة، وكأن البحر نفسه يُسهم في إعداد الطبق.',
          en: 'Homs is famous for its hummus with tahini — a dish that gave the city its name in global consciousness — but it is also the home of "Kibbeh Nayyeh", raw lamb mixed with bulgur and onion, eaten with bold appetite by the locals. The Tartus coast, meanwhile, offers fresh fish grilled with olive oil, lemon, and coriander — as if the sea itself contributes to preparing the dish.',
        },
      },
      {
        heading: {
          ar: 'التقاليد الاجتماعية حول المائدة',
          en: 'Social Traditions Around the Table',
        },
        body: {
          ar: 'في سوريا، المائدة مساحة مقدّسة. لا يُبدأ الأكل قبل أن يجلس الجميع، ولا تُقدَّم الوجبة دون أن تعلو الطاولة بالمقبّلات أولاً — من الحمص والمتبّل والفتوش والتبولة. السوري لا يأكل بمفرده إن كان بإمكانه أن يأكل مع آخرين، والضيف يُكرَم قبل أن يُكرَم صاحب البيت نفسه. قهوة الهيل وفنجان الشاي بالنعناع هما ختام كل مائدة كريمة.',
          en: 'In Syria, the table is a sacred space. Eating does not begin before everyone is seated, and no meal is served before the table is first laden with starters — hummus, mutabbal, fattoush, tabbouleh. A Syrian does not eat alone if there is any chance to eat with others, and a guest is honoured before the host himself. Cardamom coffee and a glass of mint tea are the seal of every generous table.',
        },
      },
      {
        heading: { ar: 'المطبخ السوري في العالم', en: 'Syrian Cuisine on the World Stage' },
        body: {
          ar: 'اليوم، يُعدّ المطبخ السوري من أكثر المطابخ العربية انتشاراً حول العالم. في باريس ولندن وبرلين وإسطنبول، تجد المطاعم السورية تحتل مكانة مرموقة بين تجار الطعام الراقي. هذا الانتشار لم يكن صدفة، بل جاء لأن الطعام السوري يحمل طابعاً صادقاً — نكهات أصيلة، مكوّنات طبيعية، وطريقة تحضير تحترم الموروث. إنه سفير صامت لحضارة عريقة.',
          en: 'Today, Syrian cuisine ranks among the most widespread Arab cuisines around the world. In Paris, London, Berlin, and Istanbul, Syrian restaurants occupy prestigious positions in the fine dining scene. This global reach was no accident — Syrian food carries an authentic character: genuine flavours, natural ingredients, and preparation methods that honour heritage. It is a silent ambassador of an ancient civilisation.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST 2 — History of Damascus
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: 'history-of-damascus',
    image: '/hero-damascus.png',
    category: { ar: 'تاريخ وحضارة', en: 'History & Civilization' },
    publishedAt: '2026-04-28',
    readTime: { ar: '12 دقيقة', en: '12 min read' },
    title: {
      ar: 'التاريخ الكامل لمدينة دمشق — من فجر الحضارة إلى اليوم',
      en: 'The Complete History of Damascus — From the Dawn of Civilisation to Today',
    },
    excerpt: {
      ar: 'دمشق — أقدم عاصمة مأهولة في التاريخ — رحلة عبر آلاف السنين من الحضارات المتعاقبة، من الكنعانيين إلى الأمويين، ومن العثمانيين إلى الحداثة.',
      en: 'Damascus — the oldest continuously inhabited capital in history — a journey across thousands of years of successive civilisations, from the Canaanites to the Umayyads, and from the Ottomans to modernity.',
    },
    seo: {
      titleAr: 'تاريخ مدينة دمشق الكامل — أقدم عاصمة في العالم | سيريا 14',
      titleEn: "Complete History of Damascus — World's Oldest Capital | Syria 14",
      descriptionAr:
        'استكشف التاريخ الكامل لمدينة دمشق من العصور القديمة إلى اليوم — الحضارات المتعاقبة والعصر الإسلامي الذهبي والحقبة العثمانية والدمشق الحديثة.',
      descriptionEn:
        'Explore the complete history of Damascus from ancient times to today — successive civilisations, the Islamic golden age, the Ottoman era, and modern Damascus.',
    },
    sections: [
      {
        heading: {
          ar: 'في البدء — غوطة دمشق والحياة الأولى',
          en: 'In the Beginning — The Ghouta and Early Life',
        },
        body: {
          ar: 'قبل أن يكون لدمشق اسم، كانت الغوطة موجودة. هذه الواحة الخضراء التي تحيط بالمدينة من كل جانب كانت المغناطيس الذي جذب الإنسان القديم منذ أكثر من أحد عشر ألف عام. وجد الباحثون آثار استيطان بشري في المنطقة تعود إلى الألفية التاسعة قبل الميلاد، حيث كانت مياه نهر بردى تروي الحقول وتمنح الحياة.',
          en: 'Before Damascus had a name, the Ghouta existed. This green oasis surrounding the city on every side was the magnet that drew ancient humans more than eleven thousand years ago. Researchers have found traces of human settlement in the area dating back to the ninth millennium BCE, where the waters of the Barada River irrigated the fields and sustained life.',
        },
      },
      {
        heading: {
          ar: 'العصر الكنعاني والآرامي — ميلاد المدينة',
          en: 'The Canaanite and Aramaic Age — Birth of the City',
        },
        body: {
          ar: 'في الألفية الثالثة قبل الميلاد، بدأت دمشق تأخذ شكل مدينة حقيقية في عهد الكنعانيين. لاحقاً، في القرن الثاني عشر قبل الميلاد، أسّس الآراميون دولة قوية جعلوا من دمشق عاصمة لها تحت اسم "دار مشق" — أي البيت الواسع الماء. كانت المدينة مركزاً تجارياً مهماً تمر عبره القوافل القادمة من بلاد الرافدين وفارس ومصر.',
          en: 'In the third millennium BCE, Damascus began to take the shape of a real city under the Canaanites. Later, in the twelfth century BCE, the Aramaeans founded a powerful state and made Damascus their capital under the name "Dar Mashq" — meaning the wide house of water. The city was an important commercial hub through which caravans passed from Mesopotamia, Persia, and Egypt.',
        },
      },
      {
        heading: {
          ar: 'الإمبراطوريات المتعاقبة — آشور وفارس واليونان وروما',
          en: 'Successive Empires — Assyria, Persia, Greece, and Rome',
        },
        body: {
          ar: 'في القرن الثامن قبل الميلاد، سقطت دمشق في يد الإمبراطورية الآشورية ثم الفارسية. وفي 333 قبل الميلاد، دخلها الإسكندر الأكبر ضمن فتوحاته الكبرى. في العصر الهيليني، أُعيد تخطيط المدينة وفق الطراز اليوناني. بعدها، تحوّلت دمشق إلى مدينة رومانية كبرى اشتُهرت بشارعها الرئيسي المستقيم "ديكوماني ماكسيموس" الذي لا يزال يمتد حتى يومنا هذا تحت اسم "الشارع المستقيم".',
          en: 'In the eighth century BCE, Damascus fell under the Assyrian and then Persian empires. In 333 BCE, Alexander the Great entered it as part of his great conquests. In the Hellenistic period, the city was replanned along Greek lines. Damascus then became a major Roman city, famous for its main straight road "Decumanus Maximus" — which still extends today under the name "The Straight Street".',
        },
      },
      {
        heading: {
          ar: 'الفتح الإسلامي والخلافة الأموية — العصر الذهبي',
          en: 'The Islamic Conquest and the Umayyad Caliphate — The Golden Age',
        },
        body: {
          ar: 'عام 635 ميلادية، فتح المسلمون دمشق في عهد الخليفة عمر بن الخطاب. وفي عام 661، أسّس معاوية بن أبي سفيان الدولة الأموية وجعل من دمشق عاصمة لأول إمبراطورية إسلامية امتدت من الأندلس غرباً حتى حدود الصين شرقاً. في هذا العصر، بُنيت المسجد الأموي الكبير — أحد أقدس المساجد في الإسلام وأعظمها معمارياً — فوق كنيسة يوحنا المعمدان، ليكون رمزاً للتواصل الحضاري بين الثقافات.',
          en: "In 635 CE, Muslim armies opened Damascus during the caliphate of Umar ibn al-Khattab. In 661, Muawiyah ibn Abi Sufyan founded the Umayyad state and made Damascus the capital of the first Islamic empire, stretching from Andalusia in the west to the borders of China in the east. In this era, the Great Umayyad Mosque was built — one of Islam's holiest and architecturally greatest mosques — erected over the Church of John the Baptist, symbolising civilisational continuity across cultures.",
        },
      },
      {
        heading: {
          ar: 'العصر العباسي والأيوبي والمملوكي',
          en: 'The Abbasid, Ayyubid, and Mamluk Periods',
        },
        body: {
          ar: 'مع قيام الخلافة العباسية عام 750، انتقلت العاصمة إلى بغداد وتراجع نجم دمشق السياسي، لكنها بقيت مركزاً ثقافياً وتجارياً مهماً. في القرن الثاني عشر، استعاد صلاح الدين الأيوبي المدينة وجعلها قاعدة لانطلاق حملاته في تحرير القدس. في العصر المملوكي، ازدهرت المدينة مجدداً وبُنيت فيها المدارس والمساجد والخانات الكثيرة التي لا تزال قائمة اليوم في البلدة القديمة.',
          en: "With the rise of the Abbasid Caliphate in 750, the capital moved to Baghdad and Damascus's political star dimmed — yet it remained an important cultural and commercial centre. In the twelfth century, Saladin Ayyub recaptured the city and made it the base for his campaigns to liberate Jerusalem. In the Mamluk period, the city flourished again; schools, mosques, and numerous khans were built, many of which still stand today in the old city.",
        },
      },
      {
        heading: {
          ar: 'الحقبة العثمانية — أربعة قرون من الازدهار',
          en: 'The Ottoman Era — Four Centuries of Prosperity',
        },
        body: {
          ar: 'في عام 1516، دخلت دمشق تحت الحكم العثماني الذي استمر أربعة قرون. خلال هذه الحقبة، أُضيفت إلى المدينة معمارية الجوامع والقصور والحمامات العامة "الحمّامات" التي لا تزال تُستعمل حتى اليوم. كانت دمشق محطة البداية للقوافل المتجهة إلى مكة المكرمة في الحج السنوي، مما جعلها تحتفظ بمكانتها الروحية والتجارية. ومن أبرز إنجازات هذه الحقبة التجديد الكبير الذي أجراه الوالي العثماني أسعد باشا العظم على قصره الشهير في البلدة القديمة.',
          en: 'In 1516, Damascus came under Ottoman rule for four centuries. During this era, the city gained the architecture of mosques, palaces, and public bathhouses — "hammams" — many of which are still used today. Damascus was the departure point for caravans heading to Mecca for the annual Hajj, preserving its spiritual and commercial importance. Among the period\'s outstanding achievements was the grand renovation carried out by Ottoman governor As\'ad Pasha al-Azm on his famous palace in the old city.',
        },
      },
      {
        heading: {
          ar: 'دمشق الحديثة — من الاستقلال إلى اليوم',
          en: 'Modern Damascus — From Independence to Today',
        },
        body: {
          ar: 'في عام 1920، أُعلنت المملكة العربية السورية في دمشق تحت قيادة الملك فيصل الأول، قبل أن تخضع المدينة لاحقاً للانتداب الفرنسي. في عام 1946، نالت سوريا استقلالها، ودمشق العاصمة. منذ ذلك اليوم، نمت المدينة بسرعة كبيرة وامتدت حول الغوطة القديمة. اليوم، تجمع دمشق بين الحضارة الأصيلة في بلدتها القديمة المسجّلة في قائمة التراث العالمي لليونسكو، وبين الحياة العصرية في أحياء مثل المزة وأبو رمانة والمالكي.',
          en: 'In 1920, the Arab Kingdom of Syria was proclaimed in Damascus under King Faisal I, before the city later fell under the French Mandate. In 1946, Syria gained independence, with Damascus as its capital. Since that day, the city has grown rapidly, expanding around the ancient Ghouta. Today, Damascus brings together authentic civilisation in its UNESCO-listed old city and modern life in districts such as Mezzeh, Abu Rummana, and Malki.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST 3 — Real Estate Investment in Syria
  // ─────────────────────────────────────────────────────────────────────────────
  {
    slug: 'real-estate-investment-syria',
    image: '/hero-damascus.png',
    category: { ar: 'استثمار عقاري', en: 'Real Estate Investment' },
    publishedAt: '2026-05-10',
    readTime: { ar: '10 دقائق', en: '10 min read' },
    title: {
      ar: 'لماذا قد يصبح الاستثمار العقاري في سوريا فرصة استراتيجية كبرى',
      en: 'Why Real Estate Investment in Syria Could Become a Major Strategic Opportunity',
    },
    excerpt: {
      ar: 'قراءة موضوعية في إمكانيات السوق العقاري السوري — الفرص والمخاطر والمدن الواعدة وما يجب أن يعرفه كل مستثمر قبل اتخاذ قراره.',
      en: "An objective analysis of the Syrian real estate market's potential — opportunities, risks, promising cities, and what every investor must know before making a decision.",
    },
    seo: {
      titleAr: 'الاستثمار العقاري في سوريا — فرص وتحديات | سيريا 14',
      titleEn: 'Real Estate Investment in Syria — Opportunities & Challenges | Syria 14',
      descriptionAr:
        'تحليل معمّق لسوق العقارات السوري بعد 2024 — أين تكمن الفرص؟ ما هي المخاطر؟ وكيف يفكر المستثمرون الأذكياء في هذا الملف؟',
      descriptionEn:
        'An in-depth analysis of the Syrian real estate market post-2024 — where do opportunities lie, what are the risks, and how do smart investors approach this landscape?',
    },
    sections: [
      {
        heading: { ar: 'السياق العام — لماذا الآن؟', en: 'The General Context — Why Now?' },
        body: {
          ar: 'شهدت سوريا على مدار سنوات طويلة اضطرابات أثّرت بشكل عميق على بنيتها الاقتصادية والعمرانية. غير أن ثمة مؤشرات واضحة على مرحلة جديدة يشهد فيها السوق العقاري نشاطاً متزايداً، لا سيما في مناطق الاستقرار. المستثمر الحكيم لا يبحث عن "اليقين الكامل" — فهو نادر في أي سوق — بل عن "الفرصة غير المقيَّمة بشكل صحيح". وسوريا تنتمي اليوم إلى هذه الفئة.',
          en: 'Syria experienced prolonged instability that profoundly affected its economic and urban fabric. Yet there are clear signs of a new phase in which the real estate market is showing increasing activity, particularly in stable regions. A wise investor does not seek "complete certainty" — rare in any market — but rather an "undervalued opportunity". Syria today belongs to that category.',
        },
      },
      {
        heading: {
          ar: 'الطلب الحقيقي على السكن — أرقام لا تكذب',
          en: "Real Housing Demand — Numbers Don't Lie",
        },
        body: {
          ar: 'يُقدَّر العجز في الوحدات السكنية بما يتراوح بين مليون ومليوني وحدة سكنية، وفقاً لتقديرات منظمات الأمم المتحدة والجهات الحكومية السورية. هذا الطلب المكبوت — مقترناً بتدفّق المغتربين الراغبين في الاستثمار في بلدهم الأصلي — يُولّد ضغطاً حقيقياً على الأسعار. في المناطق الآمنة كدمشق وساحل المتوسط، ارتفعت أسعار الشقق بشكل ملحوظ خلال العامين الماضيين.',
          en: 'The housing unit deficit is estimated at between one and two million units, according to UN organisations and Syrian government estimates. This pent-up demand — coupled with the influx of diaspora members wishing to invest in their homeland — generates real upward pressure on prices. In stable areas such as Damascus and the Mediterranean coast, apartment prices have risen noticeably over the past two years.',
        },
      },
      {
        heading: {
          ar: 'المدن والمناطق الأكثر جاذبية للاستثمار',
          en: 'The Most Attractive Cities and Regions for Investment',
        },
        body: {
          ar: 'دمشق وريفها: تبقى العاصمة الوجهة الأولى بسبب تركّز الخدمات والبنية التحتية. أحياء مثل المزة ودمر وقدسيا تشهد طلباً قوياً من المغتربين والسكان المحليين على حد سواء. اللاذقية وطرطوس: المنطقتان الساحليتان تجمعان ميزة السكن والسياحة معاً، مع وفرة المشاريع الفندقية والسكنية. حلب: تعاني من ندرة المعروض في ظل إعادة الإعمار الجارية، وهو ما يُولّد فرصاً حقيقية للمطوّرين.',
          en: 'Damascus and its suburbs remain the first destination due to their concentration of services and infrastructure. Neighbourhoods such as Mezzeh, Duma, and Qudsaya see strong demand from diaspora and local residents alike. Latakia and Tartus: the two coastal regions combine residential and tourism advantages, with an abundance of hotel and residential projects. Aleppo: suffers from supply scarcity amid ongoing reconstruction — generating genuine opportunities for developers.',
        },
      },
      {
        heading: {
          ar: 'التعافي السياحي وأثره على العقارات',
          en: 'Tourism Recovery and Its Impact on Real Estate',
        },
        body: {
          ar: 'سوريا تمتلك إرثاً سياحياً استثنائياً — تدمر وبصرى الشام والمدن القديمة المسجّلة في قائمة اليونسكو. مع عودة الحركة السياحية التدريجية، تتصاعد الأهمية الاستراتيجية للعقارات التجارية والفندقية في المناطق السياحية. المستثمر الذي يدخل هذا القطاع مبكراً لن يستفيد فقط من ارتفاع القيمة، بل أيضاً من دخل إيجاري مستدام.',
          en: 'Syria possesses an exceptional tourism heritage — Palmyra, Bosra, and UNESCO-listed ancient cities. With the gradual return of tourist movement, the strategic importance of commercial and hotel properties in tourist areas is rising. An investor who enters this sector early will benefit not only from value appreciation, but also from sustainable rental income.',
        },
      },
      {
        heading: { ar: 'المخاطر — قراءة صادقة', en: 'The Risks — An Honest Assessment' },
        body: {
          ar: 'لا تكتمل أي دراسة جدية دون تقييم المخاطر. أولاً: تبقى مسألة الملكية والتوثيق الرسمي تحدياً حقيقياً في بعض المناطق، ويُنصح دائماً بالتحقق القانوني الدقيق قبل أي صفقة. ثانياً: التذبذب في قيمة الليرة السورية يضيف مخاطر العملة للمستثمرين الأجانب. ثالثاً: البنية التحتية في بعض المناطق لا تزال في طور الترميم. هذه المخاطر حقيقية ولا يجوز تجاهلها — لكنها في الوقت ذاته جزء من معادلة السوق الناشئ التي تعني أن الأسعار لم ترتفع بعد إلى مستوياتها الحقيقية.',
          en: 'No serious study is complete without assessing risks. First: property ownership and official documentation remain a genuine challenge in some areas — thorough legal verification before any transaction is always advised. Second: fluctuations in the Syrian pound add currency risk for foreign investors. Third: infrastructure in some areas is still under reconstruction. These risks are real and must not be ignored — but they are simultaneously part of an emerging market equation, meaning prices have not yet reached their true levels.',
        },
      },
      {
        heading: { ar: 'منظور الاستثمار طويل المدى', en: 'The Long-Term Investment Perspective' },
        body: {
          ar: 'التاريخ يثبت أن الأسواق التي تمرّ بمراحل إعادة بناء تُنتج أكبر عوائد استثمارية للذين دخلوا مبكراً. ما يشهده السوق السوري اليوم يتشابه في بعض جوانبه مع ما شهدته مناطق مرّت بتحوّلات كبرى قبل عقود وأصبحت اليوم وجهات استثمارية مرموقة. المستثمر الذي يُفكّر بأفق زمني لا يقل عن خمس إلى عشر سنوات، ويُحسن اختيار الموقع والتوثيق القانوني، يملك قصة استثمارية مقنعة. سيريا 14 لا تُقدّم هذا كتوصية استثمارية مباشرة، بل كقراءة موضوعية لواقع السوق.',
          en: "History proves that markets undergoing reconstruction phases generate the greatest investment returns for those who entered early. What Syria's market is experiencing today shares aspects with regions that went through major transformations decades ago and are now prestigious investment destinations. An investor who thinks with a time horizon of at least five to ten years, and who carefully selects location and legal documentation, has a compelling investment story. Syria 14 presents this not as a direct investment recommendation, but as an objective reading of market realities.",
        },
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, count = 2): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, count);
}
