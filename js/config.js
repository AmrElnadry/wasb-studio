/* =========================================================
   وثب | WASB — ملف المحتوى
   كل ما يتغير في الموقع موجود هنا: بيانات التواصل، النصوص، والمشاريع.
   ========================================================= */

/* 1) بيانات التواصل — املأ ما تريد إظهاره واترك الباقي فارغاً.
      الرابط الفارغ لا يظهر في الموقع. */
window.WASB_CONTACT = {
  whatsapp: '',   // مثال: '9665XXXXXXXX' (أرقام فقط مع مفتاح الدولة)
  email: '',      // مثال: 'hello@wasb.studio'
  instagram: '',  // رابط كامل
  behance: '',    // رابط كامل
  linkedin: '',   // رابط كامل
  x: ''           // رابط كامل
};

/* 2) النصوص باللغتين */
window.WASB_I18N = {
  ar: {
    'nav.menu': 'القائمة', 'nav.close': 'إغلاق', 'hero.folio': 'بورتفوليو', 'word.studio': 'استوديو',
    'about.lead': 'الوثبة قفزة واحدة محسوبة، وهذا ما نصنعه لكل علامة.', 'index.label': 'فهرس الأعمال',
    'say.line': 'نصنع للعلامة قفزتها: من حضورٍ عادي إلى حضورٍ يُرى.',
    'door.identity.t': 'شعار ودليل هوية متكامل.', 'door.website.t': 'واجهات وتجربة تعكس علامتك.', 'door.profile.t': 'ملف تعريفي يقدّم شركتك بوضوح.',
    'door.identity': 'الهوية البصرية', 'door.website': 'المواقع الإلكترونية', 'door.profile': 'بروفايلات الشركات',
    'filter.all': 'الكل', 'filter.identity': 'هوية بصرية', 'filter.website': 'مواقع', 'filter.profile': 'بروفايلات',
    'svc.0.a': 'الشعار ونسخه', 'svc.0.b': 'الألوان والخطوط', 'svc.0.c': 'العناصر المساندة والأنماط', 'svc.0.d': 'دليل الاستخدام والتطبيقات', 'svc.0.cta': 'أعمال الهوية',
    'svc.1.a': 'هيكلة المحتوى', 'svc.1.b': 'تصميم الواجهات', 'svc.1.c': 'نسخة الجوال والكمبيوتر', 'svc.1.cta': 'أعمال المواقع',
    'svc.2.a': 'تنظيم المحتوى', 'svc.2.b': 'تصميم الصفحات', 'svc.2.c': 'نسخة للطباعة ونسخة رقمية', 'svc.2.cta': 'أعمال البروفايلات',
    'skip': 'تخطَّ إلى الأعمال',
    'nav.works': 'الأعمال', 'nav.services': 'الخدمات', 'nav.approach': 'المنهجية', 'nav.about': 'عن وثب',
    'cta.start': 'ابدأ مشروعك', 'cta.works': 'شاهد الأعمال',
    'hero.title': 'علامتك تستحق قفزة.',
    'hero.lede': 'نأخذ العلامة العادية ونعيد بناءها: أوضح، أقوى، وأصعب أن تُنسى.',
    'gate.a': 'من حضورٍ عادي', 'gate.b': 'إلى حضورٍ يُرى.',
    'works.title': 'أعمال مختارة',
    'works.note': 'ستة مشاريع وأربعة مواقع. كل عمل معروض بالطريقة التي تناسب طبيعته.',
    'sites.title': 'مواقع تعمل الآن',
    'sites.note': 'لقطات مباشرة من مواقع صمّمناها وهي على الهواء.',
    'services.title': 'ثلاث خدمات، قفزة واحدة.',
    'svc.0.name': 'الشعار ودليل الهوية',
    'svc.0.text': 'نبني العلامة من جذرها، ثم نكتب دليلاً يضمن أن تُستخدم الهوية بشكل صحيح في كل مكان.',
    'svc.1.name': 'تصميم المواقع',
    'svc.1.text': 'واجهة وتجربة تعكسان شخصية العلامة وتعرضان محتواها بوضوح، على الجوال قبل الكمبيوتر.',
    'svc.2.name': 'بروفايلات الشركات',
    'svc.2.text': 'ملف تعريفي منظم يقدّم الشركة وخدماتها ومشاريعها بلغة بصرية واحدة.',
    'approach.title': 'كيف نصل إلى القفزة',
    'step.0.name': 'نفهم', 'step.0.text': 'نسمع، نسأل، وندرس السوق والمنافسين قبل أن نرسم خطاً واحداً.',
    'step.1.name': 'نبني الفكرة', 'step.1.text': 'نحوّل ما فهمناه إلى فكرة واحدة واضحة تقود كل قرار بصري.',
    'step.2.name': 'نصمّم', 'step.2.text': 'الشعار، النظام، الصفحات. نعمل على التفاصيل حتى يتماسك الكل.',
    'step.3.name': 'نطبّق', 'step.3.text': 'نسلّم ملفات جاهزة للاستخدام ودليلاً يحفظ الهوية بعدنا.',
    'about.title': 'وثب: الاسم هو الوعد.',
    'about.p1': 'الوثبة قفزة واحدة محسوبة. هذا ما نصنعه لكل عميل: ليس تصميماً منفرداً، بل انتقالاً واضحاً في الهوية والحضور الرقمي.',
    'about.p2': 'يقود الاستوديو عمرو علي، مدير إبداعي مقيم في الرياض، بخبرة في الإخراج الفني وبناء العلامات لشركات في السعودية والمنطقة.',
    'contact.title': 'جاهز للقفزة؟',
    'contact.lede': 'أخبرنا عن علامتك وما تريد أن تصل إليه. نرد عليك بخطوة أولى واضحة.',
    'contact.empty': 'بيانات التواصل تُضاف قريباً.',
    'contact.whatsapp': 'واتساب', 'contact.email': 'البريد', 'contact.instagram': 'إنستغرام',
    'contact.behance': 'بيهانس', 'contact.linkedin': 'لينكدإن', 'contact.x': 'إكس',
    'foot.name': 'وثب استوديو', 'foot.top': 'إلى الأعلى',
    'case.close': 'إغلاق', 'case.next': 'المشروع التالي', 'case.visit': 'زيارة الموقع', 'case.scope': 'نطاق العمل',
    'case.drag': 'اسحب للتصفح',
    'plate.open': 'عرض المشروع'
  },
  en: {
    'nav.menu': 'Menu', 'nav.close': 'Close', 'hero.folio': 'Portfolio', 'word.studio': 'Studio',
    'about.lead': 'A wasb is one measured leap. That is what we make for every brand.', 'index.label': 'Work index',
    'say.line': 'We build the leap a brand needs: from being present to being seen.',
    'door.identity.t': 'Logo and a complete brand guideline.', 'door.website.t': 'Interfaces and experience that carry your brand.', 'door.profile.t': 'A profile that presents your company clearly.',
    'door.identity': 'Brand identity', 'door.website': 'Websites', 'door.profile': 'Company profiles',
    'filter.all': 'All', 'filter.identity': 'Identity', 'filter.website': 'Websites', 'filter.profile': 'Profiles',
    'svc.0.a': 'Logo and its versions', 'svc.0.b': 'Colour and type', 'svc.0.c': 'Supporting elements and patterns', 'svc.0.d': 'Usage guideline and applications', 'svc.0.cta': 'Identity work',
    'svc.1.a': 'Content structure', 'svc.1.b': 'Interface design', 'svc.1.c': 'Mobile and desktop', 'svc.1.cta': 'Website work',
    'svc.2.a': 'Content organisation', 'svc.2.b': 'Page design', 'svc.2.c': 'Print and digital versions', 'svc.2.cta': 'Profile work',
    'skip': 'Skip to work',
    'nav.works': 'Work', 'nav.services': 'Services', 'nav.approach': 'Approach', 'nav.about': 'About',
    'cta.start': 'Start a project', 'cta.works': 'See the work',
    'hero.title': 'Your brand deserves a leap.',
    'hero.lede': 'We take an ordinary brand and rebuild it: clearer, stronger, harder to forget.',
    'gate.a': 'From being present', 'gate.b': 'to being seen.',
    'works.title': 'Selected work',
    'works.note': 'Six projects and four websites, each shown the way its nature calls for.',
    'sites.title': 'Websites, live now',
    'sites.note': 'Captures of sites we designed, taken from the live web.',
    'services.title': 'Three services, one leap.',
    'svc.0.name': 'Logo & brand guidelines',
    'svc.0.text': 'We build the brand from its root, then write the guideline that keeps the identity used correctly everywhere.',
    'svc.1.name': 'Website design',
    'svc.1.text': 'Interface and experience that carry the brand’s character and present its content clearly, on mobile before desktop.',
    'svc.2.name': 'Company profiles',
    'svc.2.text': 'A structured profile presenting the company, its services and its projects in one visual language.',
    'approach.title': 'How we get to the leap',
    'step.0.name': 'Understand', 'step.0.text': 'We listen, ask, and study the market and competitors before drawing a single line.',
    'step.1.name': 'Build the idea', 'step.1.text': 'We turn what we learned into one clear idea that leads every visual decision.',
    'step.2.name': 'Design', 'step.2.text': 'The logo, the system, the pages. We work the details until the whole holds together.',
    'step.3.name': 'Apply', 'step.3.text': 'We hand over ready-to-use files and a guideline that protects the identity after us.',
    'about.title': 'WASB: the name is the promise.',
    'about.p1': 'In Arabic, wasb is a single, measured leap. That is what we make for each client: not one isolated design, but a clear step up in identity and digital presence.',
    'about.p2': 'The studio is led by Amr Ali, a creative director based in Riyadh, with a background in art direction and brand building for companies in Saudi Arabia and the region.',
    'contact.title': 'Ready to leap?',
    'contact.lede': 'Tell us about your brand and where you want it to go. We will reply with a clear first step.',
    'contact.empty': 'Contact details coming soon.',
    'contact.whatsapp': 'WhatsApp', 'contact.email': 'Email', 'contact.instagram': 'Instagram',
    'contact.behance': 'Behance', 'contact.linkedin': 'LinkedIn', 'contact.x': 'X',
    'foot.name': 'WASB Studio', 'foot.top': 'Back to top',
    'case.close': 'Close', 'case.next': 'Next project', 'case.visit': 'Visit site', 'case.scope': 'Scope',
    'case.drag': 'Drag to browse',
    'plate.open': 'View project'
  }
};

/* تسميات الخدمات */
window.WASB_TAGS = {
  identity: { ar: 'هوية بصرية', en: 'Brand identity' },
  logo:     { ar: 'شعار', en: 'Logo' },
  profile:  { ar: 'بروفايل شركة', en: 'Company profile' },
  website:  { ar: 'موقع إلكتروني', en: 'Website' },
  merch:    { ar: 'تطبيقات الهوية', en: 'Brand applications' },
  signage:  { ar: 'واجهات ولوحات', en: 'Signage' },
  print:    { ar: 'مطبوعات', en: 'Print' }
};

/* 3) المشاريع
   لإضافة مشروع: انسخ أي عنصر، غيّر id والصور، وأضف الصور داخل assets/.
   cover: صورة المشروع (تُعرض كما هي).   focus: نقطة القص 'أفقي% رأسي%' حتى لا يضيع جوهر العمل.
   blocks: محتوى صفحة المشروع بالترتيب.
     full   : صورة واحدة بعرض كامل
     grid   : شبكة صور (cols = عدد الأعمدة)
     strip  : شريط صفحات يُسحب أفقياً (مناسب لصفحات PDF)
     browser: لقطة موقع داخل إطار متصفح
*/
(function () {
  const A = 'assets/';
  const seq = (dir, name, nums) => nums.map(n => A + dir + '/' + name + '-' + n + '.webp');

  window.WASB_PROJECTS = [
    {
      id: 'fzt', span: 7, shape: 'low', ground: '#173D3D', ink: '#E8DEC7',
      name: { ar: 'فزت', en: 'FZT' },
      line: { ar: 'شركة فزت للتسويق وإدارة الفعاليات', en: 'FZT, marketing and event management' },
      tags: ['identity', 'profile', 'website'],
      cover: A + 'fzt/profile-01.webp', focus: '80% 30%',
      blocks: [
        { type: 'full', src: A + 'fzt/guide-02.webp' },
        { type: 'strip', title: { ar: 'دليل الهوية', en: 'Brand guidelines' }, ratio: '16/9', items: seq('fzt', 'guide', ['01', '02', '03', '05', '06', '07', '09', '11', '13']) },
        { type: 'grid', cols: 2, items: [A + 'fzt/poster.webp', A + 'fzt/pattern.webp'], fit: 'contain' },
        { type: 'strip', title: { ar: 'بروفايل الشركة', en: 'Company profile' }, ratio: '1.414/1', items: seq('fzt', 'profile', ['01', '02', '03', '04', '05', '08', '09', '10', '11', '12', '13', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28']) },
        { type: 'browser', title: { ar: 'تصميم الموقع', en: 'Website design' }, src: A + 'fzt/website.webp', label: 'fzt.com.sa' }
      ]
    },
    {
      id: 'ula', span: 5, shape: 'arch', ground: '#1B2A52', ink: '#E9E2D6',
      name: { ar: 'نادي العلا · Summer Camp', en: 'AlUla Club · Summer Camp' },
      line: { ar: 'طقم هدايا لاعبي المعسكر الصيفي، لصالح فزت ونادي العلا', en: 'Summer camp player gift set, for FZT and AlUla Club' },
      tags: ['identity', 'merch'],
      cover: A + 'ula/artwork-h.webp', focus: '40% 45%',
      blocks: [
        { type: 'full', src: A + 'ula/artwork-h.webp' },
        { type: 'grid', cols: 2, items: [A + 'ula/backpack.webp', A + 'ula/scarf.webp'] },
        { type: 'grid', cols: 3, items: [A + 'ula/pillow.webp', A + 'ula/tag.webp', A + 'ula/eyemask.webp'] },
        { type: 'grid', cols: 2, items: [A + 'ula/pin.webp', A + 'ula/bottle.webp'] }
      ]
    },
    {
      id: 'iaar', span: 5, shape: 'arch', ground: '#37363E', ink: '#D4DADA',
      name: { ar: 'آيار', en: 'IAAR' },
      line: { ar: 'شركة آيار للصناعات الخشبية والمعدنية', en: 'IAAR, wood and metal industries' },
      tags: ['identity', 'profile', 'print'],
      cover: A + 'iaar/cards.webp', focus: '70% 45%',
      blocks: [
        { type: 'full', src: A + 'iaar/cards.webp' },
        { type: 'strip', title: { ar: 'دليل الهوية', en: 'Brand guidelines' }, ratio: '16/9', items: seq('iaar', 'guide', ['01', '02', '03', '05', '06', '08', '09', '10', '11', '12']) },
        { type: 'grid', cols: 3, items: [A + 'iaar/logo-01.webp', A + 'iaar/logo-05.webp', A + 'iaar/logo-07.webp'] },
        { type: 'grid', cols: 2, items: [A + 'iaar/stationery-02.webp', A + 'iaar/stationery-03.webp'], fit: 'contain' },
        { type: 'strip', title: { ar: 'بروفايل الشركة', en: 'Company profile' }, ratio: '12/7', items: seq('iaar', 'profile', [1, 2, 3, 4, 5, 6]) }
      ]
    },
    {
      id: 'alkamal', span: 7, shape: 'low', ground: '#2A241B', ink: '#E7D3AE',
      name: { ar: 'الكمال', en: 'Al Kamal' },
      line: { ar: 'شركة مقاولات: بروفايل مطبوع وموقع إلكتروني', en: 'Contracting company: printed profile and website' },
      tags: ['profile', 'website'],
      cover: A + 'alkamal/cover-dark.webp', focus: '48% 45%',
      blocks: [
        { type: 'full', src: A + 'alkamal/cover-dark.webp' },
        { type: 'grid', cols: 2, items: [A + 'alkamal/spread-about.webp', A + 'alkamal/spread-structure.webp'] },
        { type: 'full', src: A + 'alkamal/spread-city.webp' },
        { type: 'grid', cols: 3, items: [A + 'alkamal/spread-p1.webp', A + 'alkamal/spread-p2.webp', A + 'alkamal/spread-p3.webp'] },
        { type: 'browser', title: { ar: 'الموقع الإلكتروني', en: 'Website' }, src: A + 'web/alkamal.webp', label: 'alkamal-er.com', url: 'https://alkamal-er.com/' }
      ]
    },
    {
      id: 'dan', span: 7, shape: 'low', ground: '#0F2C47', ink: '#E7CF9E',
      name: { ar: 'دان الرائدة', en: 'Dan AlRaeda' },
      line: { ar: 'فريقك المتكامل لنجاح أعمالك', en: 'Back office services' },
      tags: ['logo', 'profile'],
      cover: A + 'dan/logo-2.webp', focus: '40% 30%',
      blocks: [
        { type: 'full', src: A + 'dan/logo-1.webp' },
        { type: 'grid', cols: 2, items: [A + 'dan/logo-2.webp', A + 'dan/logo-4.webp'] },
        { type: 'full', src: A + 'dan/logo-3.webp' },
        { type: 'strip', title: { ar: 'بروفايل الشركة', en: 'Company profile' }, ratio: 'auto', items: seq('dan', 'profile', [1, 2, 3, 4, 5, 6, 7, 8, 9]) }
      ]
    },
    {
      id: 'greazy', span: 5, shape: 'arch', ground: '#F0E3C6', ink: '#151413',
      name: { ar: 'Greazy', en: 'Greazy' },
      line: { ar: 'مطعم: شعار، واجهات المحل، ولوحات داخلية وقائمة طعام', en: 'Restaurant: logo, storefront, interior signage and menu' },
      tags: ['logo', 'signage', 'print'],
      cover: A + 'greazy/front-0.webp', focus: '50% 40%',
      blocks: [
        { type: 'full', src: A + 'greazy/front-0.webp' },
        { type: 'grid', cols: 2, items: [A + 'greazy/front-1.webp', A + 'greazy/front-2.webp', A + 'greazy/front-3.webp', A + 'greazy/front-4.webp'] },
        { type: 'grid', cols: 2, items: [A + 'greazy/plan-1.webp', A + 'greazy/plan-4.webp'], fit: 'contain', title: { ar: 'مخططات التنفيذ', en: 'Production layouts' } },
        { type: 'full', src: A + 'greazy/in-1.webp' },
        { type: 'grid', cols: 3, items: [A + 'greazy/in-2.webp', A + 'greazy/in-3.webp', A + 'greazy/in-4.webp'] },
        { type: 'full', src: A + 'greazy/menu.webp', title: { ar: 'قائمة الطعام', en: 'Menu' } }
      ]
    }
  ];

  /* ترتيب ظهور المشاريع في الصفحة */
  const ORDER = ['ula', 'fzt', 'iaar', 'alkamal', 'dan', 'greazy'];
  window.WASB_PROJECTS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  /* 4) المواقع الحيّة */
  window.WASB_SITES = [
    { id: 'vendviz', label: 'vendviz.com', url: 'https://www.vendviz.com/', src: A + 'web/vendviz.webp', tall: true },
    { id: 'alkamal-site', label: 'alkamal-er.com', url: 'https://alkamal-er.com/', src: A + 'web/alkamal.webp' },
    { id: 'jadeed', label: 'jadeedsa.com', url: 'https://jadeedsa.com/', src: A + 'web/jadeed.webp', tall: true },
    { id: 'viora', label: 'viora-dev.com', url: 'https://viora-dev.com/', src: A + 'web/viora.webp' }
  ];
})();
