// Writes what search engines and AI tools read, from the same data the page uses (js/config.js):
//   index.html  -> JSON-LD block, plain-HTML list of works and sites (replaced by the script on load)
//   sitemap.xml, llms.txt
// Run after any change to js/config.js:   node scripts/seo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const SITE = 'https://amrelnadry.github.io/wasb-studio/';   // change here when the custom domain is set
const root = fileURLToPath(new URL('..', import.meta.url));

const ctx = { window: {} };
vm.runInNewContext(readFileSync(root + 'js/config.js', 'utf8'), ctx);
const { WASB_PROJECTS: P, WASB_SITES: S, WASB_TAGS: T, WASB_CONTACT: C } = ctx.window;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tags = (p, l) => p.tags.map(k => T[k][l]).join('، ');
const intl = n => '+966' + n.replace(/^0/, '');

const SERVICES = [
  { ar: 'تصميم شعار وهوية بصرية', en: 'Logo and brand identity design',
    dAr: 'تصميم شعار وهوية بصرية لشركة أو منتج أو فعالية، وتطوير الهوية البصرية القائمة، مع دليل استخدام الهوية.',
    dEn: 'Logo and visual identity for a company, product or event, rebranding of existing identities, and brand guidelines.' },
  { ar: 'تصميم وتطوير المواقع الإلكترونية', en: 'Website design and development',
    dAr: 'تصميم مواقع إلكترونية للشركات وتطويرها وإطلاقها.',
    dEn: 'Company websites, designed, built and launched.' },
  { ar: 'تصميم بروفايل الشركة', en: 'Company profile design',
    dAr: 'تصميم بروفايل شركة مطبوع ورقمي، وبروشورات ومطبوعات تسويقية.',
    dEn: 'Printed and digital company profiles, brochures and marketing print.' }
];

const org = {
  '@type': 'ProfessionalService',
  '@id': SITE + '#studio',
  name: 'وثب استوديو',
  alternateName: ['WASB Studio', 'وثب', 'WASB'],
  description: 'استوديو تصميم هوية بصرية في الرياض يخدم الشركات الناشئة والمتوسطة في السعودية: تصميم شعارات وهويات بصرية، مواقع إلكترونية، وبروفايلات شركات.',
  disambiguatingDescription: 'A brand identity and design studio in Riyadh, Saudi Arabia, serving startups and SMEs: logos, visual identity, websites and company profiles.',
  url: SITE,
  logo: SITE + 'assets/wasb/symbol.svg',
  image: SITE + 'assets/og.jpg',
  telephone: C.phones.map(intl),
  address: { '@type': 'PostalAddress', streetAddress: 'حي الفلاح', addressLocality: 'الرياض', addressCountry: 'SA' },
  areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
  parentOrganization: { '@type': 'Organization', name: 'Blue Network', url: 'https://blue-network.sa/' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: intl(C.phones[0]), availableLanguage: ['ar', 'en'], url: 'https://wa.me/' + C.whatsapp },
  knowsLanguage: ['ar', 'en'],
  sameAs: ['https://blue-network.sa/', C.instagram, C.behance, C.linkedin, C.x].filter(Boolean),
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'الخدمات', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.ar, alternateName: s.en, description: s.dAr, areaServed: 'SA' } })) }
};
const works = {
  '@type': 'ItemList', name: 'أعمال وثب استوديو',
  itemListElement: P.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: {
    '@type': 'CreativeWork', name: p.name.ar, alternateName: p.name.en, description: p.line.ar + ' (' + tags(p, 'ar') + ')',
    image: SITE + p.cover, url: SITE + '#/work/' + p.id, creator: { '@id': SITE + '#studio' } } }))
    .concat(S.map((s, i) => ({ '@type': 'ListItem', position: P.length + i + 1, item: {
      '@type': 'WebSite', name: s.label, url: s.url, creator: { '@id': SITE + '#studio' } } })))
};
const site = { '@type': 'WebSite', '@id': SITE + '#site', url: SITE, name: 'وثب استوديو', alternateName: 'WASB Studio', inLanguage: ['ar', 'en'], publisher: { '@id': SITE + '#studio' } };
const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, site, works] });

// ---------- index.html ----------
const put = (html, name, body) => {
  const re = new RegExp(`(<!-- seo:${name} -->)[\\s\\S]*?(<!-- /seo:${name} -->)`);
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  return html.replace(re, `$1${body}$2`);
};
let h = readFileSync(root + 'index.html', 'utf8');
h = put(h, 'ld', `<script type="application/ld+json">${ld.replace(/</g, '\\u003c')}</script>`);
h = put(h, 'works', P.map(p => `<a class="tile" href="#/work/${p.id}"><img src="${p.cover}" alt="${esc(p.line.ar)}" loading="lazy"><span class="tile__cap"><span class="tile__name">${esc(p.name.ar)}</span><span class="tile__tags">${esc(tags(p, 'ar'))}</span></span></a>`).join(''));
h = put(h, 'sites', `<ul>${S.map(s => `<li><a href="${s.url}">${esc(s.label)}</a></li>`).join('')}</ul>`);
writeFileSync(root + 'index.html', h);

// ---------- sitemap.xml ----------
const today = new Date().toISOString().slice(0, 10);
writeFileSync(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${today}</lastmod>
${P.map(p => `    <image:image><image:loc>${SITE}${p.cover}</image:loc></image:image>`).join('\n')}
  </url>
</urlset>
`);

// ---------- llms.txt ----------
writeFileSync(root + 'llms.txt', `# وثب استوديو (WASB Studio)

> استوديو تصميم وهوية بصرية في الرياض، المملكة العربية السعودية، وهو الذراع الإبداعي لـ Blue Network. يعمل مع الشركات الناشئة والمتوسطة في جميع القطاعات داخل السعودية.
> WASB Studio is the design and brand identity studio of Blue Network, based in Riyadh, Saudi Arabia, working with startups and SMEs across all sectors in Saudi Arabia.

## الخدمات / Services

${SERVICES.map(s => `- ${s.ar} / ${s.en}: ${s.dAr} ${s.dEn}`).join('\n')}

## أعمال مختارة / Selected work

${P.map(p => `- [${p.name.ar} / ${p.name.en}](${SITE}#/work/${p.id}): ${p.line.ar}. ${p.line.en}. (${tags(p, 'ar')} / ${tags(p, 'en')})`).join('\n')}

## مواقع أطلقناها / Websites we launched

${S.map(s => `- [${s.label}](${s.url})`).join('\n')}

## التواصل / Contact

- واتساب / WhatsApp: https://wa.me/${C.whatsapp}
- هاتف / Phone: ${C.phones.map(intl).join('، ')}
- العنوان / Address: حي الفلاح، الرياض، المملكة العربية السعودية (Al Falah, Riyadh, Saudi Arabia)
- الموقع / Website: ${SITE}
- Blue Network: https://blue-network.sa/
`);
console.log('seo: ok', P.length, 'works,', S.length, 'sites');
