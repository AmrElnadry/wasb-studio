// Builds the site from content/*.json (the files the control panel edits):
//   js/content.js            the data the home page script reads
//   index.html               Arabic home: structured data and plain-HTML lists for search engines and AI tools
//   en/index.html            English home
//   work/<id>/index.html     a page per project (Arabic), and en/work/<id>/index.html (English)
//   sitemap.xml, llms.txt
// Run after any content change:   node scripts/build.mjs
// GitHub Actions runs it on every push before publishing (.github/workflows/deploy.yml).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = 'https://wasb.studio/';
const root = fileURLToPath(new URL('..', import.meta.url));
const read = f => JSON.parse(readFileSync(root + 'content/' + f, 'utf8'));
const P = read('projects.json'), S = read('sites.json'), C = read('contact.json'), T = read('tags.json'), I = read('texts.json');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = p => !p ? '' : /^(https?:)?\//.test(p) ? p : '/' + p;
const full = p => SITE + abs(p).slice(1);
const L = (o, l) => (o && (o[l] || o.ar)) || '';
const t = (k, l) => (I[l] && I[l][k]) || I.ar[k] || k;
const tags = (p, l) => p.tags.filter(k => T[k]).map(k => T[k][l]).join(l === 'ar' ? '، ' : ', ');
const intl = n => '+966' + String(n).replace(/\D/g, '').replace(/^(966|0)/, '');
const base = l => l === 'en' ? '/en/' : '/';
const workPath = (id, l) => `${base(l)}work/${id}/`;
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 8);
const write = (f, s) => { mkdirSync(root + f.replace(/[^/]*$/, ''), { recursive: true }); writeFileSync(root + f, s); };

// pixel size from the file header (WebP, PNG, JPEG, SVG), so the gallery can lay out rows before images load
const sizes = new Map();
function imgSize(p) {
  if (sizes.has(p)) return sizes.get(p);
  let out = [4, 3];
  try {
    const b = readFileSync(root + abs(p).slice(1));
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const c = b.toString('ascii', 12, 16);
      if (c === 'VP8X') out = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      else if (c === 'VP8L') { const n = b.readUInt32LE(21); out = [1 + (n & 0x3fff), 1 + ((n >>> 14) & 0x3fff)]; }
      else if (c === 'VP8 ') out = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    } else if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') out = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b[0] === 0xFF && b[1] === 0xD8) {
      for (let i = 2; i < b.length - 9;) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { out = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    } else {
      const vb = b.toString('utf8', 0, 4000).match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
      if (vb) out = [+vb[1], +vb[2]];
    }
  } catch (e) {}
  sizes.set(p, out);
  return out;
}
// very tall images (long website shots) show their top part; the panel uses the same limits
const ratio = p => { const [w, h] = imgSize(p); return w / h; };
// gallery entries are { src, half }; older files may hold plain paths
const gsrc = g => typeof g === 'string' ? g : g.src;
const gimgs = p => (p.gallery || []).map(gsrc);
// Behance-style column: every image at full width, except two half-width images in a row,
// which share one line at the same height (the panel uses the same rule)
function galLayout(items) {
  const out = items.map(g => ({ src: gsrc(g), half: !!(g && g.half), r: ratio(gsrc(g)), s: 1, full: true }));
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i], b = out[i + 1];
    if (a.half && b.half) { const sum = a.r + b.r; a.full = b.full = false; a.s = a.r / sum; b.s = b.r / sum; i++; }
  }
  return out;
}

// ---------- checks: a broken entry should fail the build, not the live site ----------
const ids = new Set();
for (const p of P) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(p.id || '')) throw new Error('bad project id: ' + p.id);
  if (ids.has(p.id)) throw new Error('duplicate project id: ' + p.id);
  ids.add(p.id);
  if (!p.cover) throw new Error(p.id + ': no cover image');
  for (const f of [p.cover, ...gimgs(p)])
    if (f && !/^https?:/.test(f) && !existsSync(root + abs(f).slice(1))) throw new Error(`${p.id}: missing image ${f}`);
}

// ---------- js/content.js ----------
// the home page needs only what a tile shows; the gallery lives on each project's own page
// projects marked hidden in the panel keep their page but stay off the home page grid
const HOME = P.filter(p => p.featured !== false);
const projects = HOME.map(p => ({ id: p.id, name: p.name, line: p.line, tags: p.tags, cover: abs(p.cover), focus: p.focus }));
const sites = S.map(s => ({ ...s, src: abs(s.src) }));
const contentJs = `/* generated by scripts/build.mjs from content/*.json — edit those (or use /admin/), not this file */
window.WASB_CONTACT = ${JSON.stringify(C)};
window.WASB_I18N = ${JSON.stringify(I)};
window.WASB_TAGS = ${JSON.stringify(T)};
window.WASB_PROJECTS = ${JSON.stringify(projects)};
window.WASB_SITES = ${JSON.stringify(sites)};
`;
write('js/content.js', contentJs);
const V = hash(contentJs);
const css = readFileSync(root + 'css/style.css', 'utf8'), pageJs = readFileSync(root + 'js/page.js', 'utf8');
const mainJs = readFileSync(root + 'js/main.js', 'utf8');
const VC = hash(css), VP = hash(pageJs), VM = hash(mainJs);

// ---------- structured data ----------
const SERVICES = [
  { ar: 'تصميم شعار وهوية بصرية', en: 'Logo and brand identity design',
    dAr: 'تصميم شعار وهوية بصرية لشركة أو منتج أو فعالية، وتطوير الهوية البصرية القائمة، مع دليل استخدام الهوية.',
    dEn: 'Logo and visual identity for a company, product or event, rebranding of existing identities, and brand guidelines.' },
  { ar: 'تصميم وتطوير المواقع الإلكترونية', en: 'Website design and development',
    dAr: 'تصميم مواقع إلكترونية للشركات وتطويرها وإطلاقها.', dEn: 'Company websites, designed, built and launched.' },
  { ar: 'تصميم بروفايل الشركة', en: 'Company profile design',
    dAr: 'تصميم بروفايل شركة مطبوع ورقمي، وبروشورات ومطبوعات تسويقية.', dEn: 'Printed and digital company profiles, brochures and marketing print.' }
];
const org = {
  '@type': 'ProfessionalService', '@id': SITE + '#studio', name: 'وثب استوديو', alternateName: ['WASB Studio', 'وثب', 'WASB'],
  description: 'استوديو تصميم وهوية بصرية في الرياض للشركات الناشئة والمتوسطة في السعودية: تصميم شعار وهوية بصرية، تطوير الهوية، بروفايل شركات وبروشورات، ومواقع إلكترونية.',
  url: SITE, logo: SITE + 'assets/wasb/symbol.svg', image: SITE + 'assets/share-ar.jpg',
  telephone: (C.phones || []).map(intl), email: C.email || undefined,
  address: { '@type': 'PostalAddress', streetAddress: 'حي الفلاح', addressLocality: 'الرياض', addressCountry: 'SA' },
  areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
  parentOrganization: { '@type': 'Organization', name: 'Blue Network', url: 'https://blue-network.sa/' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: C.phones && C.phones[0] ? intl(C.phones[0]) : undefined, email: C.email || undefined, availableLanguage: ['ar', 'en'], url: C.whatsapp ? 'https://wa.me/' + C.whatsapp : undefined },
  knowsLanguage: ['ar', 'en'],
  sameAs: ['https://blue-network.sa/', C.instagram, C.behance, C.linkedin, C.x].filter(Boolean),
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'الخدمات', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.ar, alternateName: s.en, description: s.dAr, areaServed: 'SA' } })) }
};
const works = {
  '@type': 'ItemList', name: 'أعمال وثب استوديو',
  itemListElement: P.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: {
    '@type': 'CreativeWork', name: p.name.ar, alternateName: p.name.en, description: p.line.ar + ' (' + tags(p, 'ar') + ')',
    image: full(p.cover), url: SITE + 'work/' + p.id + '/', creator: { '@id': SITE + '#studio' } } }))
    .concat(S.map((s, i) => ({ '@type': 'ListItem', position: P.length + i + 1, item: { '@type': 'WebSite', name: s.label, url: s.url, creator: { '@id': SITE + '#studio' } } })))
};
const website = { '@type': 'WebSite', '@id': SITE + '#site', url: SITE, name: 'وثب استوديو', alternateName: 'WASB Studio', inLanguage: ['ar', 'en'], publisher: { '@id': SITE + '#studio' } };
const ldTag = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

// ---------- home pages ----------
const put = (html, name, body) => {
  const re = new RegExp(`(<!-- seo:${name} -->)[\\s\\S]*?(<!-- /seo:${name} -->)`);
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  return html.replace(re, (m, a, b) => a + body + b);
};
const stamp = h => h.replace(/\/js\/content\.js\?v=[^"]*/, '/js/content.js?v=' + V).replace(/\/css\/style\.css\?v=[^"]*/, '/css/style.css?v=' + VC).replace(/\/js\/main\.js\?v=[^"]*/, '/js/main.js?v=' + VM);
// a title like «Client · Company Profile»: the dot holds on to the word before it, so a wrapped line never starts with it
const nameHtml = s => esc(s).replace(/ · /g, '&nbsp;· ');
// the project page's big title: the client on one line, the kind of work under it, in grey and with no dot
const titleHtml = s => { const i = s.indexOf(' · '); return i < 0 ? esc(s) : `${esc(s.slice(0, i))} <span class="phead__kind">${esc(s.slice(i + 3))}</span>`; };
const tilesFor = l => HOME.map(p => `<a class="tile" href="${workPath(p.id, l)}"><img src="${abs(p.cover)}" alt="${esc(L(p.line, l))}" loading="lazy"><span class="tile__cap"><span class="tile__name">${nameHtml(L(p.name, l))}</span><span class="tile__tags">${esc(tags(p, l))}</span></span></a>`).join('');
const sitesList = `<ul>${S.map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('')}</ul>`;

let ar = readFileSync(root + 'index.html', 'utf8');
ar = put(ar, 'ld', ldTag({ '@context': 'https://schema.org', '@graph': [org, website, works] }));
ar = put(ar, 'works', tilesFor('ar'));
ar = put(ar, 'sites', sitesList);
ar = stamp(ar);
writeFileSync(root + 'index.html', ar);

// English: the same page, with the English words already in place for anyone who reads the HTML
const EN_TITLE = 'WASB Studio | Logo and brand identity design, websites and company profiles in Saudi Arabia';
const EN_DESC = 'WASB Studio is a design studio in Riyadh for startups and SMEs across Saudi Arabia: logo and brand identity design, rebranding, company profiles, brochures and websites.';
const meta = (h, attr, key, val) => h.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), (m, a, b) => a + esc(val) + b);
let en = ar.replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr">');
en = en.replace(/<title>[^<]*<\/title>/, `<title>${esc(EN_TITLE)}</title>`);
en = meta(en, 'name', 'description', EN_DESC);
en = meta(en, 'property', 'og:title', 'WASB Studio | Brand identity, websites and company profiles');
en = meta(en, 'property', 'og:description', EN_DESC);
en = meta(en, 'property', 'og:locale', 'en_US');
en = meta(en, 'property', 'og:locale:alternate', 'ar_SA');
en = meta(en, 'property', 'og:url', SITE + 'en/');
en = meta(en, 'property', 'og:image:alt', 'WASB Studio, the design and brand identity studio of Blue Network');
en = meta(en, 'name', 'twitter:description', EN_DESC);
en = en.split(SITE + 'assets/share-ar.jpg').join(SITE + 'assets/share-en.jpg');
en = en.replace('<link rel="canonical" href="https://wasb.studio/">', '<link rel="canonical" href="https://wasb.studio/en/">');
en = en.replace(/(<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, text, close) => open + esc(t(key, 'en')) + close);
en = en.replace(/(\sdata-i18n-label="([^"]+)"\s+aria-label=")[^"]*"/g, (m, a, key) => a + esc(t(key, 'en')) + '"');
en = en.replace('id="langToggle" aria-label="Switch to English">EN<', 'id="langToggle" aria-label="التبديل إلى العربية">عربي<');
en = put(en, 'works', tilesFor('en'));
en = en.replace('id="sitesAll" href="/sites/"', 'id="sitesAll" href="/en/sites/"');
write('en/index.html', en);

// ---------- share images: each project's cover as a 1200x630 JPEG, cropped around its focus point ----------
// (chat apps show these when a project link is shared; WebP covers are often skipped)
let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) { console.warn('build: sharp is not installed, project pages share their cover as is'); }
const shareImg = new Map();
if (sharp) {
  rmSync(root + 'assets/share', { recursive: true, force: true });
  mkdirSync(root + 'assets/share', { recursive: true });
  for (const p of P) {
    const [w, h] = imgSize(p.cover);
    const [fx, fy] = (p.focus || '50% 50%').split(' ').map(v => (parseFloat(v) || 50) / 100);
    const k = Math.max(1200 / w, 630 / h), sw = Math.ceil(w * k), sh = Math.ceil(h * k);
    const name = `assets/share/${p.id}-${hash(p.cover + '|' + p.focus)}.jpg`;
    await sharp(root + abs(p.cover).slice(1)).resize(sw, sh)
      .extract({ left: Math.round(fx * (sw - 1200)), top: Math.round(fy * (sh - 630)), width: 1200, height: 630 })
      .flatten({ background: '#0E0E0E' }).jpeg({ quality: 82, mozjpeg: true }).toFile(root + name);
    shareImg.set(p.id, name);
  }
}

// ---------- project pages ----------
const symbols = ['wasb-symbol', 'wasb-word', 'wasb-latin', 'i-arrow', 'i-wa'].map(id => {
  const m = ar.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`));
  if (!m) throw new Error('symbol missing: ' + id);
  return m[0];
}).join('\n  ') + `
  <symbol id="i-share" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></g></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></g></symbol>
  <symbol id="i-link" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></g></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z"/></symbol>
  <symbol id="i-in" viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-3.95v-11Z"/></symbol>`;
const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
const pad = n => String(n).padStart(2, '0');
function gallery(p, l) {
  const alt = esc(L(p.name, l) + ' · ' + tags(p, l));
  return `<section class="gal">${galLayout(p.gallery || []).map(g => {
    const [w, h] = imgSize(g.src);
    return `<figure class="gal__it${g.full ? ' is-full' : ''}" style="--r:${g.r.toFixed(4)};--s:${g.s.toFixed(4)}"><img src="${abs(g.src)}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"></figure>`;
  }).join('')}</section>`;
}
const tile = (p, l) => `<a class="tile" href="${workPath(p.id, l)}" style="--focus:${esc(p.focus || '50% 50%')}" aria-label="${esc(L(p.name, l))}: ${esc(t('plate.open', l))}"><img src="${abs(p.cover)}" alt="${esc(L(p.line, l))}" loading="lazy" decoding="async"><span class="tile__cap"><span class="tile__name">${nameHtml(L(p.name, l))}</span><span class="tile__tags">${esc(tags(p, l))}</span></span><span class="tile__go" aria-hidden="true">${arrow}</span></a>`;

// one frame for every inner page: head, bar, footer
function shell(l, { path, title, desc, image, type = 'website', ld, body }) {
  const other = l === 'ar' ? 'en' : 'ar';
  const studio = l === 'ar' ? 'وثب استوديو' : 'WASB Studio';
  const url = SITE + base(l).slice(1) + path, arUrl = SITE + path, enUrl = SITE + 'en/' + path;
  return `<!doctype html>
<html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${esc(studio)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ar" href="${arUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="x-default" href="${arUrl}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0E0E0E">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="وثب استوديو | WASB Studio">
<meta property="og:locale" content="${l === 'ar' ? 'ar_SA' : 'en_US'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)} | ${esc(studio)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">${/\.jpg$/.test(image) ? `
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} | ${esc(studio)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image}">
${ldTag(ld)}
<link rel="icon" type="image/svg+xml" href="/assets/wasb/symbol.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v=${VC}">
</head>
<body class="pg">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  ${symbols}
</defs></svg>
<header class="pg__bar">
  <a class="pg__home" href="${base(l)}" aria-label="${esc(studio)}">
    <svg class="pg__sym" viewBox="0 0 263 358" aria-hidden="true"><use href="#wasb-symbol"/></svg>
    ${l === 'ar' ? '<svg class="pg__word" viewBox="0 0 257.7 90.3" aria-hidden="true"><use href="#wasb-word"/></svg>' : '<svg class="pg__word" viewBox="0 0 263.17 69.84" aria-hidden="true"><use href="#wasb-latin"/></svg>'}
  </a>
  <div class="pg__nav">
    <a class="pg__lang" href="${base(other)}${path}" hreflang="${other}" lang="${other}">${other === 'en' ? 'EN' : 'عربي'}</a>
    <button class="menu-btn" type="button" id="burger" aria-expanded="false" aria-controls="menu" data-open="${esc(t('nav.menu', l))}" data-close="${esc(t('nav.close', l))}"><span class="menu-btn__roll">${esc(t('nav.menu', l))}</span></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav class="menu__links" aria-label="${esc(t('nav.menu', l))}">
    <a href="${base(l)}#works">${esc(t('nav.works', l))}</a>
    <a href="${base(l)}sites/">${esc(t('nav.sites', l))}</a>
    <a href="${base(l)}#approach">${esc(t('nav.approach', l))}</a>
    <a href="${base(l)}#about">${esc(t('nav.about', l))}</a>
    <a href="${base(l)}#contact">${esc(t('cta.start', l))}</a>
  </nav>
</div>
<main>
${body}
</main>
<footer class="foot wrap">
  <span>© <span class="year">${new Date().getFullYear()}</span> ${esc(t('foot.name', l))}</span>
  <a href="${base(l)}#contact">${esc(t('cta.start', l))}</a>
</footer>
<script src="/js/page.js?v=${VP}"></script>
</body>
</html>
`;
}

// the bar under every project: share it, or start a project about it on WhatsApp
function bar(name, url, l) {
  const wa = String(C.whatsapp || '').replace(/\D/g, '');
  const msg = t('page.waMsg', l).replace('{name}', name) + '\n' + url;
  const shareText = `${name} | ${l === 'ar' ? 'وثب استوديو' : 'WASB Studio'}`;
  const enc = encodeURIComponent;
  const ico = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const start = wa ? `https://wa.me/${wa}?text=${enc(msg)}` : `${base(l)}#contact`;
  return `<div class="pbar" id="pbar" data-url="${esc(url)}" data-title="${esc(shareText)}" data-copied="${esc(t('page.copied', l))}">
  <div class="pbar__in">
    <div class="pbar__share">
      <button class="pbar__btn" type="button" id="shareBtn" aria-expanded="false" aria-controls="shareMenu">${ico('i-share')}<span>${esc(t('page.share', l))}</span></button>
      <div class="share" id="shareMenu" hidden>
        <button type="button" data-copy>${ico('i-link')}${esc(t('page.copy', l))}</button>
        <a href="https://wa.me/?text=${enc(shareText + '\n' + url)}" target="_blank" rel="noopener">${ico('i-wa')}${esc(t('contact.whatsapp', l))}</a>
        <a href="https://x.com/intent/post?url=${enc(url)}&amp;text=${enc(shareText)}" target="_blank" rel="noopener">${ico('i-x')}${esc(t('contact.x', l))}</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}" target="_blank" rel="noopener">${ico('i-in')}${esc(t('contact.linkedin', l))}</a>
        <a href="mailto:?subject=${enc(shareText)}&amp;body=${enc(url)}">${ico('i-mail')}${esc(t('contact.email', l))}</a>
      </div>
    </div>
    <span class="pbar__sep" aria-hidden="true"></span>
    <a class="pbar__btn pbar__btn--start" href="${esc(start)}"${wa ? ' target="_blank" rel="noopener"' : ''}><span>${esc(t('cta.start', l))}</span></a>
  </div>
</div>`;
}

// similar work: most shared services first, then the nearest in the list
function similar(p, i) {
  const n = P.length;
  return P.map((q, k) => ({ q, k, score: q.tags.filter(x => p.tags.includes(x)).length, dist: (k - i + n) % n }))
    .filter(x => x.q !== p)
    .sort((a, b) => b.score - a.score || a.dist - b.dist)
    .slice(0, 4).map(x => x.q);
}
const chev = l => `<svg class="pg__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="${l === 'ar' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function page(p, i, l) {
  const other = l === 'ar' ? 'en' : 'ar';
  const n = P.length, next = P[(i + 1) % n];
  const name = L(p.name, l), line = L(p.line, l), about = L(p.about, l);
  const studio = l === 'ar' ? 'وثب استوديو' : 'WASB Studio';
  const desc = [line, tags(p, l)].filter(Boolean).join('. ') + (about ? '. ' + about.replace(/\s+/g, ' ').slice(0, 150) : '');
  const url = SITE + workPath(p.id, l).slice(1);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CreativeWork', '@id': url + '#work', name, alternateName: L(p.name, other), headline: name, description: desc, url, inLanguage: l,
      image: [p.cover, ...gimgs(p)].filter((s, k, a) => a.indexOf(s) === k).slice(0, 12).map(full),
      keywords: tags(p, l), dateCreated: p.year || undefined, creator: { '@type': 'ProfessionalService', '@id': SITE + '#studio', name: 'وثب استوديو', url: SITE } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: studio, item: SITE + base(l).slice(1) },
      { '@type': 'ListItem', position: 2, name: t('nav.works', l), item: SITE + base(l).slice(1) + '#works' },
      { '@type': 'ListItem', position: 3, name, item: url } ] }
  ] };
  const body = `  <article>
    <header class="phead">
      <div class="phead__top">
        <p class="pg__crumb"><a href="${base(l)}#works">${esc(t('nav.works', l))}</a> <span aria-hidden="true">/</span> ${pad(i + 1)}</p>
        <nav class="pg__pn" aria-label="${esc(t('nav.works', l))}">
          <a href="${workPath(next.id, l)}" rel="next">${esc(t('page.next', l))}${chev(l)}</a>
          <span class="pg__sep" aria-hidden="true"></span>
          <a href="${base(l)}#works">${esc(t('page.all', l))}</a>
        </nav>
      </div>
      <div class="phead__main${about ? '' : ' is-single'}">
        <div class="phead__id">
          <h1 class="phead__title">${titleHtml(name)}</h1>
          <p class="phead__line">${esc(line)}</p>
        </div>
        ${about ? `<div class="phead__about"><h2>${esc(t('page.about', l))}</h2><p>${esc(about)}</p></div>` : ''}
      </div>
    </header>
    ${gallery(p, l)}
  </article>
  <section class="similar" aria-labelledby="similarTitle">
    <div class="similar__head"><h2 id="similarTitle">${esc(t('page.similar', l))}</h2><a href="${base(l)}#works">${esc(t('page.all', l))}${chev(l)}</a></div>
    <div class="similar__grid">${similar(p, i).map(q => tile(q, l)).join('')}</div>
  </section>
${bar(name, url, l)}`;
  return shell(l, { path: `work/${p.id}/`, title: name, desc, image: full(shareImg.get(p.id) || p.cover), type: 'article', ld, body });
}

// every website, starred or not
function sitesPage(l) {
  const title = t('sites.title', l), desc = t('sites.note', l);
  const url = SITE + base(l).slice(1) + 'sites/';
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description: desc, url, inLanguage: l,
    about: { '@id': SITE + '#studio' },
    mainEntity: { '@type': 'ItemList', itemListElement: S.map((s, k) => ({ '@type': 'ListItem', position: k + 1, item: { '@type': 'WebSite', name: s.label, url: s.url, creator: { '@id': SITE + '#studio' } } })) } };
  const body = `  <header class="case__head">
    <div class="wrap">
      <div>
        <p class="pg__crumb"><a href="${base(l)}">${esc(t('page.home', l))}</a> <span aria-hidden="true">/</span> ${esc(t('page.sites', l))}</p>
        <h1 class="case__title">${esc(title)}</h1>
        <p class="case__line">${esc(desc)}</p>
      </div>
    </div>
  </header>
  <section class="sgrid wrap">${S.map(s => `<a class="scard" href="${esc(s.url)}" target="_blank" rel="noopener">
      <div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>${esc(s.label)}</span></div><div class="scard__view"><img src="${abs(s.src)}" alt="${esc(t('nav.sites', l) + ' · ' + s.label)}" loading="lazy" decoding="async"></div></div>
      <span class="scard__meta"><b>${esc(s.label)}</b><span>${esc(t('page.visit', l))}${arrow}</span></span>
    </a>`).join('')}</section>`;
  return shell(l, { path: 'sites/', title, desc, image: SITE + `assets/share-${l}.jpg`, ld, body });
}

for (const dir of ['work', 'en/work', 'sites', 'en/sites']) rmSync(root + dir, { recursive: true, force: true });
P.forEach((p, i) => { write(`work/${p.id}/index.html`, page(p, i, 'ar')); write(`en/work/${p.id}/index.html`, page(p, i, 'en')); });
write('sites/index.html', sitesPage('ar')); write('en/sites/index.html', sitesPage('en'));

// ---------- sitemap.xml ----------
const today = new Date().toISOString().slice(0, 10);
const entry = (arPath, enPath, imgs) => [arPath, enPath].map(loc => `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="ar" href="${SITE}${arPath}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${enPath}"/>
${imgs.map(s => `    <image:image><image:loc>${full(s)}</image:loc></image:image>`).join('\n')}
  </url>`).join('\n');
writeFileSync(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entry('', 'en/', P.map(p => p.cover))}
${entry('sites/', 'en/sites/', S.map(x => x.src))}
${P.map(p => entry(`work/${p.id}/`, `en/work/${p.id}/`, [p.cover, ...gimgs(p)].filter((s, k, a) => a.indexOf(s) === k).slice(0, 30))).join('\n')}
</urlset>
`);

// ---------- llms.txt ----------
writeFileSync(root + 'llms.txt', `# وثب استوديو (WASB Studio)

> استوديو تصميم وهوية بصرية في الرياض، المملكة العربية السعودية، وهو الذراع الإبداعي لـ Blue Network. يعمل مع الشركات الناشئة والمتوسطة في جميع القطاعات داخل السعودية.
> WASB Studio is the design and brand identity studio of Blue Network, based in Riyadh, Saudi Arabia, working with startups and SMEs across all sectors in Saudi Arabia.

- العربية: ${SITE}
- English: ${SITE}en/

## الخدمات / Services

${SERVICES.map(s => `- ${s.ar} / ${s.en}: ${s.dAr} ${s.dEn}`).join('\n')}

## أعمال مختارة / Selected work

${P.map(p => `- [${p.name.ar} / ${p.name.en}](${SITE}work/${p.id}/): ${p.line.ar}. ${p.line.en}. (${tags(p, 'ar')} / ${tags(p, 'en')})${p.year ? ' ' + p.year : ''}`).join('\n')}

## مواقع أطلقناها / Websites we launched

${S.map(s => `- [${s.label}](${s.url})`).join('\n')}

## التواصل / Contact

${C.whatsapp ? `- واتساب / WhatsApp: https://wa.me/${C.whatsapp}\n` : ''}${(C.phones || []).length ? `- هاتف / Phone: ${C.phones.map(intl).join('، ')}\n` : ''}${C.email ? `- البريد / Email: ${C.email}\n` : ''}- العنوان / Address: حي الفلاح، الرياض، المملكة العربية السعودية (Al Falah, Riyadh, Saudi Arabia)
- الموقع / Website: ${SITE}
- Blue Network: https://blue-network.sa/
`);
console.log(`build: ok · ${P.length} works · ${S.length} sites (${S.filter(x => x.featured !== false).length} on the home page) · ${P.length * 2} project pages`);
