/* وثب | WASB — لوحة التحكم
   Reads and writes content/*.json and assets/ in the site's GitHub repository, as the signed-in member.
   Every save is one commit; the GitHub Action then rebuilds and publishes the site. */
(function () {
  'use strict';
  const OWNER = 'AmrElnadry', REPO = 'wasb-studio', BRANCH = 'main', API = 'https://api.github.com';
  const R = `/repos/${OWNER}/${REPO}`;
  const FILES = { projects: 'content/projects.json', sites: 'content/sites.json', contact: 'content/contact.json', tags: 'content/tags.json', texts: 'content/texts.json' };
  const PART = { projects: 'الأعمال', sites: 'المواقع', contact: 'التواصل', tags: 'الخدمات', texts: 'النصوص' };
  const BLOCKS = {
    full: { name: 'صورة بعرض كامل', hint: 'صورة واحدة بعرض الصفحة.' },
    grid: { name: 'شبكة صور', hint: 'مجموعة صور جنب بعض.' },
    strip: { name: 'شريط صفحات', hint: 'صفحات تتسحب يمين وشمال، مناسبة لصفحات البروفايل ودليل الهوية.' },
    browser: { name: 'موقع داخل متصفح', hint: 'لقطة طويلة لموقع، تتقلّب داخل إطار متصفح.' }
  };
  const DEMO = /[?&]demo\b/.test(location.search);   // local preview: reads the files beside it, never writes

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let token = '', me = null, baseSha = '';
  const data = {}, orig = {};
  const staged = new Map();     // repo path -> { blob, url }  images waiting for the next save
  const shown = new Map();      // repo path -> object URL, for images saved this session but not yet published
  const fresh = new Set();      // projects added in this session: their link can still change
  const dirCache = new Map();
  let tab = 'projects', sel = 0, textQuery = '';

  /* ---------- storage ---------- */
  const store = {
    get() { try { return localStorage.getItem('wasb-admin') || sessionStorage.getItem('wasb-admin') || ''; } catch (e) { return ''; } },
    set(v, keep) { try { (keep ? localStorage : sessionStorage).setItem('wasb-admin', v); } catch (e) {} },
    clear() { try { localStorage.removeItem('wasb-admin'); sessionStorage.removeItem('wasb-admin'); } catch (e) {} }
  };

  /* ---------- GitHub ---------- */
  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: 'Bearer ' + token, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
      cache: 'no-store'
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || ('HTTP ' + res.status)); err.status = res.status; throw err;
    }
    return res.status === 204 ? null : res.json();
  }
  const utf8b64 = s => { const b = new TextEncoder().encode(s); let out = ''; for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(out); };
  const b64utf8 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
  const blobB64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });

  /* ---------- feedback ---------- */
  let toastTimer = 0;
  function toast(msg, err) {
    const el = $('#toast');
    el.textContent = msg; el.classList.toggle('is-err', !!err); el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), err ? 6000 : 3200);
  }
  function status(text, kind, html) {
    const el = $('#status');
    el.className = 'pill' + (kind ? ' is-' + kind : '');
    if (html) el.innerHTML = html; else el.textContent = text || '';
  }
  const changedParts = () => Object.keys(FILES).filter(k => data[k] !== undefined && JSON.stringify(data[k]) !== orig[k]);
  function syncDirty() {
    const parts = changedParts(), n = parts.length + staged.size;
    $('#saveBtn').disabled = !n;
    if (n) status(`تعديلات غير محفوظة: ${parts.map(k => PART[k]).join('، ')}${staged.size ? `${parts.length ? '، ' : ''}${staged.size} صورة جديدة` : ''}`, 'dirty');
    else if ($('#status').classList.contains('is-dirty')) status('');
  }
  window.addEventListener('beforeunload', e => { if (changedParts().length || staged.size) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- sign in ---------- */
  async function signIn(tok, keep) {
    token = tok.trim();
    me = await gh('/user');
    const repo = await gh(R);
    if (!repo.permissions || !repo.permissions.push) { const e = new Error('no-push'); e.status = 403; throw e; }
    store.set(token, keep);
  }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#loginBtn'), err = $('#loginErr');
    btn.disabled = true; btn.textContent = 'جاري الدخول…'; err.textContent = '';
    try { await signIn($('#tokenInput').value, $('#remember').checked); await start(); }
    catch (x) {
      err.textContent = x.status === 401 ? 'المفتاح غير صحيح أو انتهت صلاحيته.' : x.status === 403 || x.status === 404 ? 'الحساب ده مش عنده صلاحية تعديل على مستودع الموقع. اطلب إضافتك كمشارك (Collaborator) الأول.' : 'تعذّر الاتصال بـ GitHub: ' + x.message;
    }
    btn.disabled = false; btn.textContent = 'دخول';
  });
  function signOut() {
    if ((changedParts().length || staged.size) && !confirm('في تعديلات لسه ما اتحفظتش. تخرج برضه؟')) return;
    store.clear(); location.reload();
  }

  /* ---------- load ---------- */
  async function load() {
    $('#view').innerHTML = '<p class="busy">جاري تحميل المحتوى…</p>';
    if (DEMO) {
      for (const [k, f] of Object.entries(FILES)) data[k] = await (await fetch('/' + f, { cache: 'no-store' })).json();
    } else {
      const ref = await gh(`${R}/git/ref/heads/${BRANCH}`);
      baseSha = ref.object.sha;
      await Promise.all(Object.entries(FILES).map(async ([k, f]) => { const r = await gh(`${R}/contents/${f}?ref=${baseSha}`); data[k] = JSON.parse(b64utf8(r.content)); }));
    }
    for (const k of Object.keys(FILES)) orig[k] = JSON.stringify(data[k]);
    staged.clear(); fresh.clear(); dirCache.clear();
    sel = Math.min(sel, Math.max(0, data.projects.length - 1));
    render(); syncDirty();
  }

  async function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#me').innerHTML = DEMO ? '<span>وضع التجربة</span>' : `<img src="${esc(me.avatar_url)}&s=56" alt=""><span>${esc(me.login)}</span><button class="btn btn--ghost btn--sm" type="button" id="out">خروج</button>`;
    const out = $('#out'); if (out) out.addEventListener('click', signOut);
    try { await load(); }
    catch (x) { $('#view').innerHTML = `<p class="empty">تعذّر تحميل المحتوى: ${esc(x.message)}</p>`; }
  }

  /* ---------- images ---------- */
  const imgUrl = p => !p ? '' : staged.has(p) ? staged.get(p).url : shown.has(p) ? shown.get(p) : /^https?:/.test(p) ? p : '/' + p;
  async function listDir(dir) {
    if (dirCache.has(dir)) return dirCache.get(dir);
    let files = [];
    try {
      if (DEMO) {
        const html = await (await fetch(`/assets/${dir}/`)).text();
        files = [...html.matchAll(/href="([^"?/]+\.(?:webp|jpe?g|png|svg|gif))"/gi)].map(m => `assets/${dir}/${decodeURIComponent(m[1])}`);
      } else {
        const list = await gh(`${R}/contents/assets/${encodeURIComponent(dir)}?ref=${BRANCH}`);
        files = list.filter(f => f.type === 'file' && /\.(webp|jpe?g|png|svg|gif|avif)$/i.test(f.name)).map(f => f.path);
      }
    } catch (x) { if (x.status !== 404) throw x; }
    dirCache.set(dir, files);
    return files;
  }
  async function listDirs() {
    if (DEMO) {
      const html = await (await fetch('/assets/')).text();
      return [...html.matchAll(/href="([^"?/]+)\/"/g)].map(m => decodeURIComponent(m[1]));
    }
    const list = await gh(`${R}/contents/assets?ref=${BRANCH}`);
    return list.filter(f => f.type === 'dir').map(f => f.name);
  }
  const slug = s => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'img';
  // photos go up as WebP, at most 2400px wide; SVG files stay as they are
  async function toWebp(file) {
    if (/svg/.test(file.type)) return { blob: file, ext: 'svg' };
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2400 / bmp.width), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', .86));
    if (!blob) throw new Error('تعذّر تحويل الصورة');
    return { blob, ext: 'webp' };
  }
  async function stageFiles(dir, files) {
    const known = new Set([...(await listDir(dir)), ...staged.keys()]);
    const paths = [];
    for (const file of files) {
      if (!/^image\//.test(file.type)) continue;
      if (file.size > 40e6) { toast(`الصورة ${file.name} أكبر من 40MB`, true); continue; }
      const { blob, ext } = await toWebp(file);
      let name = slug(file.name), path = `assets/${dir}/${name}.${ext}`;
      for (let n = 2; known.has(path); n++) path = `assets/${dir}/${name}-${n}.${ext}`;
      known.add(path);
      staged.set(path, { blob, url: URL.createObjectURL(blob) });
      dirCache.set(dir, [...(dirCache.get(dir) || []), path]);
      paths.push(path);
    }
    syncDirty();
    return paths;
  }

  /* ---------- image picker ---------- */
  let pick = null;   // { multi, dir, chosen: [], done }
  function openPicker({ dir, multi, title, hint }) {
    return new Promise(async done => {
      pick = { multi, dir, chosen: [], done };
      $('#pickerTitle').textContent = title || (multi ? 'اختيار صور' : 'اختيار صورة');
      $('#pickerHint').textContent = hint || '';
      $('#pickerOk').textContent = multi ? 'إضافة المحدد' : 'اختيار';
      const sel = $('#pickerDir');
      let dirs = [];
      try { dirs = await listDirs(); } catch (x) {}
      if (!dirs.includes(dir)) dirs.unshift(dir);
      sel.innerHTML = dirs.map(d => `<option value="${esc(d)}"${d === dir ? ' selected' : ''}>${esc(d)}${d === dir ? ' (هذا المشروع)' : ''}</option>`).join('');
      $('#picker').hidden = false;
      drawPicker();
    });
  }
  async function drawPicker() {
    const grid = $('#pickerGrid');
    grid.innerHTML = '<p class="picker__empty">جاري التحميل…</p>';
    let files = [];
    try { files = await listDir(pick.dir); } catch (x) { grid.innerHTML = `<p class="picker__empty">${esc(x.message)}</p>`; return; }
    grid.innerHTML = files.length ? files.slice().reverse().map(p => {
      const n = pick.chosen.indexOf(p);
      return `<button type="button" class="pick${n >= 0 ? ' is-on' : ''}" data-p="${esc(p)}" data-n="${n + 1}"><img src="${esc(imgUrl(p))}" alt="" loading="lazy"><span>${esc(p.split('/').pop())}</span></button>`;
    }).join('') : '<p class="picker__empty">المجلد ده فاضي. ارفع صور من جهازك.</p>';
    $('#pickerCount').textContent = pick.multi ? (pick.chosen.length ? `تم اختيار ${pick.chosen.length}` : 'اختار صورة أو أكتر، بالترتيب اللي يظهر بيه') : '';
  }
  function closePicker(result) { $('#picker').hidden = true; const p = pick; pick = null; if (p) p.done(result || []); }
  $('#pickerGrid').addEventListener('click', e => {
    const b = e.target.closest('.pick'); if (!b || !pick) return;
    const p = b.dataset.p;
    if (!pick.multi) return closePicker([p]);
    const i = pick.chosen.indexOf(p);
    if (i >= 0) pick.chosen.splice(i, 1); else pick.chosen.push(p);
    drawPicker();
  });
  $('#pickerDir').addEventListener('change', e => { pick.dir = e.target.value; drawPicker(); });
  $('#pickerFile').addEventListener('change', async e => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length || !pick) return;
    $('#pickerGrid').insertAdjacentHTML('afterbegin', '<p class="picker__empty">جاري تجهيز الصور…</p>');
    try {
      const paths = await stageFiles(pick.dir, files);
      if (!pick.multi && paths.length) return closePicker([paths[0]]);
      pick.chosen.push(...paths);
    } catch (x) { toast(x.message, true); }
    drawPicker();
  });
  $('#pickerOk').addEventListener('click', () => closePicker(pick && pick.chosen));
  $('#picker').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.closest('[data-close]')) closePicker([]); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pick) closePicker([]); });

  /* ---------- binding: inputs carry the JSON path they edit ---------- */
  const bind = path => `data-b="${esc(JSON.stringify(path))}"`;
  const getAt = path => path.reduce((o, k) => (o == null ? o : o[k]), data);
  function setAt(path, v) {
    let o = data;
    for (let i = 0; i < path.length - 1; i++) { if (o[path[i]] == null) o[path[i]] = typeof path[i + 1] === 'number' ? [] : {}; o = o[path[i]]; }
    o[path[path.length - 1]] = v;
  }
  const input = (label, path, { ltr, area, rows, ph, help } = {}) => {
    const v = getAt(path) ?? '';
    const a = `${bind(path)}${ltr ? ' dir="ltr"' : ''}${ph ? ` placeholder="${esc(ph)}"` : ''}`;
    return `<label class="field"><span>${esc(label)}</span>${area ? `<textarea ${a} rows="${rows || 2}">${esc(v)}</textarea>` : `<input ${a} value="${esc(v)}">`}${help ? `<small>${esc(help)}</small>` : ''}</label>`;
  };
  const pair = (label, path, opts = {}) => `<div class="row2">${input(label + ' (عربي)', [...path, 'ar'], opts)}${input(label + ' (English)', [...path, 'en'], { ...opts, ltr: true })}</div>`;
  $('#view').addEventListener('input', e => {
    const el = e.target.closest('[data-b]'); if (!el) return;
    const path = JSON.parse(el.dataset.b);
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.kind === 'lines') v = v.split('\n').map(s => s.trim()).filter(Boolean);
    if (el.dataset.kind === 'num') v = Number(v);
    setAt(path, v);
    if (path[0] === 'projects' && (path[2] === 'name' || path[2] === 'id')) drawList();
    syncDirty();
  });

  /* ---------- tabs ---------- */
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { tab = b.dataset.tab; render(); } });
  function render() {
    $$('#tabs button').forEach(b => b.classList.toggle('is-on', b.dataset.tab === tab));
    ({ projects: renderProjects, sites: renderSites, contact: renderContact, texts: renderTexts })[tab]();
  }

  /* ---------- projects ---------- */
  function drawList() {
    const box = $('#plist'); if (!box) return;
    box.innerHTML = data.projects.map((p, i) => `<div class="pitem${i === sel ? ' is-on' : ''}" draggable="true" data-i="${i}">
        <img src="${esc(imgUrl(p.cover))}" alt="" loading="lazy">
        <div><b>${esc(p.name.ar || p.name.en || 'مشروع جديد')}</b><small>${esc(p.id)}</small></div>
        <span class="grip" title="اسحب لتغيير الترتيب" aria-hidden="true">⋮⋮</span>
      </div>`).join('');
  }
  function renderProjects() {
    const p = data.projects[sel];
    $('#view').innerHTML = `<div class="split">
      <aside class="plist">
        <div class="page-head" style="margin:0"><h1>الأعمال</h1><button class="btn btn--sm" type="button" data-act="add-project">＋ مشروع</button></div>
        <p class="panel__note" style="margin:0">اسحب المشاريع لتغيير ترتيبها في الموقع.</p>
        <div class="plist__items" id="plist"></div>
      </aside>
      <section id="editor">${p ? editor(p) : '<p class="empty">مفيش مشاريع لسه.</p>'}</section>
    </div>`;
    drawList();
  }
  function editor(p) {
    const P = ['projects', sel];
    const isNew = fresh.has(p);
    return `
      <div class="page-head">
        <div><h1>${esc(p.name.ar || 'مشروع جديد')}</h1><p dir="ltr" style="text-align:end">wasb.studio/work/${esc(p.id)}/</p></div>
        <div class="acts">
          ${isNew ? '' : `<a class="btn btn--sm" href="/work/${esc(p.id)}/" target="_blank" rel="noopener">عرض الصفحة ↗</a>`}
          <button class="btn btn--sm btn--danger" type="button" data-act="del-project">حذف المشروع</button>
        </div>
      </div>

      <div class="panel stack">
        <h2>البيانات الأساسية</h2>
        ${pair('اسم المشروع / العميل', [...P, 'name'])}
        ${pair('سطر تعريفي', [...P, 'line'], { area: true, help: 'يظهر تحت الاسم وفي نتائج البحث.' })}
        ${pair('نبذة عن المشروع', [...P, 'about'], { area: true, rows: 4, help: 'اختياري. لو فاضية مش هتظهر في الصفحة.' })}
        <div class="row3">
          ${input('السنة', [...P, 'year'], { ltr: true, ph: '2025' })}
          ${isNew ? input('الرابط المختصر', [...P, 'id'], { ltr: true, help: 'حروف إنجليزي صغيرة وأرقام و - فقط. ما يتغيرش بعد الحفظ.' }) : `<label class="field"><span>الرابط المختصر</span><input value="${esc(p.id)}" dir="ltr" disabled></label>`}
        </div>
      </div>

      <div class="panel">
        <h2>الخدمات في المشروع</h2>
        <div class="chips">${Object.entries(data.tags).map(([k, v]) => `<label class="chip"><input type="checkbox" data-act="tag" value="${esc(k)}"${p.tags.includes(k) ? ' checked' : ''}><span>${esc(v.ar)}</span></label>`).join('')}</div>
        <p class="panel__note" style="margin:12px 0 0">الهوية والشعار والتطبيقات واللوحات بتظهر تحت فلتر «هوية بصرية»، والمواقع تحت «مواقع»، والبروفايل تحت «بروفايلات».</p>
      </div>

      <div class="panel">
        <div class="panel__head"><h2>صورة الغلاف</h2><button class="btn btn--sm" type="button" data-act="cover">${p.cover ? 'تغيير الصورة' : 'اختيار صورة'}</button></div>
        ${p.cover ? `<div class="cover">
          <div class="cover__img" data-act="focus"><img src="${esc(imgUrl(p.cover))}" alt=""><span class="cover__dot" style="left:${esc((p.focus || '50% 50%').split(' ')[0])};top:${esc((p.focus || '50% 50%').split(' ')[1])}"></span></div>
          <div class="cover__side"><div class="cover__crop"><img src="${esc(imgUrl(p.cover))}" alt="" style="object-position:${esc(p.focus || '50% 50%')}"></div>
          <p>اضغط على الصورة الكبيرة لتحديد أهم نقطة فيها، علشان القص في صفحة الأعمال ما يقطعهاش. المعاينة الصغيرة بتوضح الشكل.</p></div>
        </div>` : '<p class="panel__note" style="margin:0">لازم يكون للمشروع صورة غلاف.</p>'}
      </div>

      <div class="panel">
        <h2>محتوى صفحة المشروع</h2>
        <p class="panel__note">الأقسام بتظهر في الصفحة بالترتيب ده. اسحب الصور لتغيير ترتيبها جوه القسم.</p>
        <div class="blocks">${p.blocks.map((b, k) => blockCard(b, k, p)).join('')}
          <div class="add-blk"><span>إضافة قسم:</span>${Object.entries(BLOCKS).map(([k, v]) => `<button class="btn btn--sm" type="button" data-act="add-block" data-type="${k}" title="${esc(v.hint)}">${esc(v.name)}</button>`).join('')}</div>
        </div>
      </div>`;
  }
  function blockCard(b, k, p) {
    const P = ['projects', sel, 'blocks', k];
    const many = b.type === 'grid' || b.type === 'strip';
    const imgs = many ? (b.items || []) : (b.src ? [b.src] : []);
    const wide = b.type !== 'grid';
    return `<div class="blk" data-k="${k}">
      <div class="blk__head">
        <span class="blk__n">${String(k + 1).padStart(2, '0')}</span><span class="blk__type">${esc(BLOCKS[b.type].name)}</span>
        <div class="blk__tools">
          <button class="icon-btn" type="button" data-act="blk-up" title="لأعلى" ${k === 0 ? 'disabled' : ''}>↑</button>
          <button class="icon-btn" type="button" data-act="blk-down" title="لأسفل" ${k === p.blocks.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="icon-btn is-del" type="button" data-act="blk-del" title="حذف القسم">✕</button>
        </div>
      </div>
      ${pair('عنوان القسم', [...P, 'title'], { ph: 'اختياري' })}
      ${b.type === 'grid' ? `<div class="blk__opts">
        <label class="field"><span>عدد الأعمدة</span><select ${bind([...P, 'cols'])} data-kind="num">${[1, 2, 3, 4].map(n => `<option${(b.cols || 2) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" data-act="fit"${b.fit === 'contain' ? ' checked' : ''}> <span>اعرض الصور كاملة على خلفية بيضاء (من غير قص)</span></label>
      </div>` : ''}
      ${b.type === 'browser' ? `<div class="row2">${input('اسم الموقع في شريط المتصفح', [...P, 'label'], { ltr: true, ph: 'example.com' })}${input('رابط الموقع', [...P, 'url'], { ltr: true, ph: 'https://' })}</div>` : ''}
      <div class="thumbs" data-k="${k}">
        ${imgs.map((s, j) => `<div class="thumb${wide && !many ? ' is-wide' : ''}" draggable="${many}" data-j="${j}"><img src="${esc(imgUrl(s))}" alt="" loading="lazy">${staged.has(s) ? '<span class="new">جديدة</span>' : ''}<button class="x" type="button" data-act="img-del" title="إزالة">✕</button></div>`).join('')}
        <button class="thumb thumb--add${wide && !many ? ' is-wide' : ''}" type="button" data-act="img-add">${many ? '＋ إضافة صور' : imgs.length ? 'تغيير الصورة' : '＋ اختيار صورة'}</button>
      </div>
    </div>`;
  }

  const project = () => data.projects[sel];
  const projDir = p => p.id;
  $('#view').addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    if (tab === 'projects') {
      const p = project(), blkEl = el.closest('.blk'), k = blkEl ? Number(blkEl.dataset.k) : -1, b = k >= 0 ? p.blocks[k] : null;
      if (act === 'add-project') {
        let n = data.projects.length + 1, id = 'project-' + n;
        while (data.projects.some(q => q.id === id)) id = 'project-' + (++n);
        const q = { id, name: { ar: '', en: '' }, line: { ar: '', en: '' }, year: '', about: { ar: '', en: '' }, tags: [], cover: '', focus: '50% 50%', blocks: [] };
        data.projects.push(q); fresh.add(q); sel = data.projects.length - 1; renderProjects(); syncDirty();
        $('#editor [data-b]').focus();
        return;
      }
      if (act === 'del-project') {
        if (!confirm(`حذف «${p.name.ar || p.id}» من الموقع؟ الصور هتفضل محفوظة في المستودع.`)) return;
        data.projects.splice(sel, 1); fresh.delete(p); sel = Math.max(0, sel - 1); renderProjects(); syncDirty(); return;
      }
      if (act === 'cover') {
        const [path] = await openPicker({ dir: projDir(p), multi: false, title: 'صورة الغلاف', hint: 'الصورة اللي بتظهر في صفحة الأعمال وفي مشاركة الرابط.' });
        if (path) { p.cover = path; p.focus = '50% 50%'; renderProjects(); syncDirty(); }
        return;
      }
      if (act === 'focus') {
        const r = el.getBoundingClientRect();
        const x = Math.round(((e.clientX - r.left) / r.width) * 100), y = Math.round(((e.clientY - r.top) / r.height) * 100);
        p.focus = `${x}% ${y}%`;
        $('.cover__dot', el).style.left = x + '%'; $('.cover__dot', el).style.top = y + '%';
        $('.cover__crop img').style.objectPosition = p.focus;
        syncDirty(); return;
      }
      if (act === 'add-block') {
        const type = el.dataset.type;
        const nb = type === 'grid' ? { type, cols: 2, items: [] } : type === 'strip' ? { type, items: [] } : type === 'browser' ? { type, src: '', label: '', url: '' } : { type, src: '' };
        p.blocks.push(nb); renderProjects(); syncDirty();
        const many = type === 'grid' || type === 'strip';
        const paths = await openPicker({ dir: projDir(p), multi: many, title: BLOCKS[type].name, hint: BLOCKS[type].hint });
        if (paths.length) { if (many) nb.items = paths; else nb.src = paths[0]; renderProjects(); syncDirty(); }
        return;
      }
      if (act === 'blk-up' || act === 'blk-down') {
        const to = act === 'blk-up' ? k - 1 : k + 1;
        [p.blocks[k], p.blocks[to]] = [p.blocks[to], p.blocks[k]]; renderProjects(); syncDirty(); return;
      }
      if (act === 'blk-del') { if (!confirm('حذف القسم ده من الصفحة؟')) return; p.blocks.splice(k, 1); renderProjects(); syncDirty(); return; }
      if (act === 'img-del') {
        const j = Number(el.closest('.thumb').dataset.j);
        if (b.items) b.items.splice(j, 1); else b.src = '';
        renderProjects(); syncDirty(); return;
      }
      if (act === 'img-add') {
        const many = !!b.items;
        const paths = await openPicker({ dir: projDir(p), multi: many, title: BLOCKS[b.type].name, hint: BLOCKS[b.type].hint });
        if (paths.length) { if (many) b.items.push(...paths); else b.src = paths[0]; renderProjects(); syncDirty(); }
        return;
      }
    }
    if (tab === 'sites') {
      const card = el.closest('[data-i]'), i = card ? Number(card.dataset.i) : -1;
      if (act === 'add-site') { data.sites.push({ id: 'site-' + Date.now().toString(36), label: '', url: 'https://', src: '' }); renderSites(); syncDirty(); return; }
      if (act === 'site-up' || act === 'site-down') { const to = act === 'site-up' ? i - 1 : i + 1; [data.sites[i], data.sites[to]] = [data.sites[to], data.sites[i]]; renderSites(); syncDirty(); return; }
      if (act === 'site-del') { if (!confirm(`حذف «${data.sites[i].label || 'الموقع'}» من العرض؟`)) return; data.sites.splice(i, 1); renderSites(); syncDirty(); return; }
      if (act === 'site-img') {
        const [path] = await openPicker({ dir: 'web', multi: false, title: 'لقطة الموقع', hint: 'لقطة طويلة للصفحة الرئيسية بعرض 1440px تقريباً. بتتقلّب جوه الكارت في عرض المواقع.' });
        if (path) { data.sites[i].src = path; renderSites(); syncDirty(); }
        return;
      }
    }
  });
  $('#view').addEventListener('change', e => {
    const el = e.target;
    if (tab !== 'projects') return;
    const p = project();
    if (el.dataset.act === 'tag') { p.tags = $$('[data-act="tag"]').filter(c => c.checked).map(c => c.value); syncDirty(); }
    if (el.dataset.act === 'fit') { const b = p.blocks[Number(el.closest('.blk').dataset.k)]; if (el.checked) b.fit = 'contain'; else delete b.fit; syncDirty(); }
  });
  // project list: select and drag to reorder
  let drag = null;
  $('#view').addEventListener('click', e => {
    const it = e.target.closest('.pitem'); if (!it) return;
    sel = Number(it.dataset.i); renderProjects(); scrollTo({ top: 0 });
  });
  $('#view').addEventListener('dragstart', e => {
    const it = e.target.closest('.pitem, .thumb[draggable="true"]'); if (!it) return;
    drag = it.classList.contains('pitem') ? { list: true, from: Number(it.dataset.i) } : { k: Number(it.closest('.thumbs').dataset.k), from: Number(it.dataset.j) };
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '');
  });
  $('#view').addEventListener('dragover', e => {
    if (!drag) return;
    const it = drag.list ? e.target.closest('.pitem') : e.target.closest(`.thumbs[data-k="${drag.k}"] .thumb[draggable="true"]`);
    $$('.is-drop').forEach(x => x.classList.remove('is-drop'));
    if (!it) return;
    e.preventDefault(); it.classList.add('is-drop');
  });
  $('#view').addEventListener('drop', e => {
    if (!drag) return;
    const it = drag.list ? e.target.closest('.pitem') : e.target.closest(`.thumbs[data-k="${drag.k}"] .thumb[draggable="true"]`);
    if (!it) return;
    e.preventDefault();
    const to = Number(drag.list ? it.dataset.i : it.dataset.j);
    if (drag.list) {
      const cur = data.projects[sel], [m] = data.projects.splice(drag.from, 1);
      data.projects.splice(to, 0, m); sel = data.projects.indexOf(cur);
    } else {
      const arr = project().blocks[drag.k].items, [m] = arr.splice(drag.from, 1);
      arr.splice(to, 0, m);
    }
    drag = null; renderProjects(); syncDirty();
  });
  $('#view').addEventListener('dragend', () => { drag = null; $$('.is-drop').forEach(x => x.classList.remove('is-drop')); });

  /* ---------- sites ---------- */
  function renderSites() {
    $('#view').innerHTML = `<div class="page-head"><div><h1>المواقع</h1><p>المواقع اللي بتتعرض في قسم «من التصميم إلى الإطلاق» بالترتيب ده.</p></div><button class="btn btn--sm" type="button" data-act="add-site">＋ موقع</button></div>
      <div class="sites">${data.sites.map((s, i) => `<div class="panel site" data-i="${i}">
        <div class="site__shot">${s.src ? `<img src="${esc(imgUrl(s.src))}" alt="" loading="lazy">` : ''}<button class="btn btn--sm" type="button" data-act="site-img">${s.src ? 'تغيير اللقطة' : 'اختيار لقطة'}</button></div>
        ${input('الاسم الظاهر', ['sites', i, 'label'], { ltr: true, ph: 'example.com' })}
        ${input('الرابط', ['sites', i, 'url'], { ltr: true, ph: 'https://' })}
        <div class="site__tools">
          <button class="icon-btn" type="button" data-act="site-up" title="قبل" ${i === 0 ? 'disabled' : ''}>→</button>
          <button class="icon-btn" type="button" data-act="site-down" title="بعد" ${i === data.sites.length - 1 ? 'disabled' : ''}>←</button>
          <button class="icon-btn is-del" type="button" data-act="site-del" title="حذف">✕</button>
        </div>
      </div>`).join('')}</div>`;
  }

  /* ---------- contact ---------- */
  function renderContact() {
    const c = data.contact;
    $('#view').innerHTML = `<div class="page-head"><div><h1>التواصل</h1><p>أي خانة فاضية مش هتظهر في الموقع.</p></div></div>
      <div class="panel stack" style="max-width:860px">
        <div class="row2">
          ${input('رقم واتساب', ['contact', 'whatsapp'], { ltr: true, help: 'أرقام فقط مع مفتاح الدولة، مثلاً 9665XXXXXXXX' })}
          ${input('البريد الإلكتروني', ['contact', 'email'], { ltr: true })}
        </div>
        <label class="field"><span>أرقام الموبايل</span><textarea ${bind(['contact', 'phones'])} data-kind="lines" dir="ltr" rows="3">${esc((c.phones || []).join('\n'))}</textarea><small>رقم في كل سطر، بالشكل المحلي 05XXXXXXXX. بيظهر في الموقع بصيغة ‎+966.</small></label>
        <div class="row2">
          ${input('إنستغرام', ['contact', 'instagram'], { ltr: true, ph: 'https://instagram.com/…' })}
          ${input('بيهانس', ['contact', 'behance'], { ltr: true, ph: 'https://behance.net/…' })}
          ${input('لينكدإن', ['contact', 'linkedin'], { ltr: true, ph: 'https://linkedin.com/company/…' })}
          ${input('إكس', ['contact', 'x'], { ltr: true, ph: 'https://x.com/…' })}
        </div>
      </div>
      <div class="panel stack" style="max-width:860px">
        <h2>العنوان</h2>
        ${input('العنوان (عربي)', ['texts', 'ar', 'contact.address'])}
        ${input('العنوان (English)', ['texts', 'en', 'contact.address'], { ltr: true })}
      </div>`;
  }

  /* ---------- texts ---------- */
  const GROUPS = [['hero.', 'الواجهة'], ['about.', 'عن وثب'], ['works.', 'الأعمال'], ['filter.', 'الأعمال'], ['sites.', 'المواقع'], ['pano.', 'المواقع'], ['svc.', 'الخدمات'], ['door.', 'الخدمات'], ['services.', 'الخدمات'], ['approach.', 'المنهجية'], ['step.', 'المنهجية'], ['game.', 'المنهجية'], ['contact.', 'التواصل'], ['page.', 'صفحة المشروع'], ['case.', 'صفحة المشروع'], ['plate.', 'صفحة المشروع'], ['nav.', 'القائمة'], ['cta.', 'القائمة']];
  const groupOf = k => (GROUPS.find(([p]) => k.startsWith(p)) || [0, 'عام'])[1];
  function renderTexts() {
    $('#view').innerHTML = `<div class="page-head"><div><h1>النصوص</h1><p>كل الكلام الثابت في الموقع باللغتين.</p></div><input class="search" id="tq" type="search" placeholder="ابحث في النصوص…" value="${esc(textQuery)}"></div>
      <div class="panel texts" id="tlist"></div>`;
    drawTexts();
    $('#tq').addEventListener('input', e => { textQuery = e.target.value; drawTexts(); });
  }
  function drawTexts() {
    const q = textQuery.trim().toLowerCase();
    const keys = Object.keys(data.texts.ar).filter(k => !q || k.includes(q) || String(data.texts.ar[k]).toLowerCase().includes(q) || String(data.texts.en[k] || '').toLowerCase().includes(q));
    const order = [...new Set(GROUPS.map(g => g[1]).concat('عام'))];
    keys.sort((a, b) => order.indexOf(groupOf(a)) - order.indexOf(groupOf(b)));
    let last = '';
    $('#tlist').innerHTML = keys.map(k => {
      const g = groupOf(k), head = g !== last ? `<h3>${esc(g)}</h3>` : ''; last = g;
      const long = String(data.texts.ar[k]).length > 60;
      return head + `<div class="trow"><code>${esc(k)}</code>
        <label class="field"><textarea ${bind(['texts', 'ar', k])} rows="${long ? 3 : 1}" aria-label="${esc(k)} عربي">${esc(data.texts.ar[k])}</textarea></label>
        <label class="field"><textarea ${bind(['texts', 'en', k])} rows="${long ? 3 : 1}" dir="ltr" aria-label="${esc(k)} English">${esc(data.texts.en[k] || '')}</textarea></label></div>`;
    }).join('') || '<p class="empty">مفيش نتائج.</p>';
  }

  /* ---------- checks before saving ---------- */
  function problems() {
    const out = [], ids = new Set();
    data.projects.forEach((p, i) => {
      const n = p.name.ar || p.id || `#${i + 1}`;
      if (!/^[a-z0-9][a-z0-9-]*$/.test(p.id)) out.push(`«${n}»: الرابط المختصر لازم يكون حروف إنجليزي صغيرة وأرقام و - فقط.`);
      if (ids.has(p.id)) out.push(`«${n}»: الرابط المختصر مستخدم في مشروع تاني.`);
      ids.add(p.id);
      if (!p.name.ar.trim()) out.push(`مشروع #${i + 1}: الاسم بالعربي ناقص.`);
      if (!p.cover) out.push(`«${n}»: صورة الغلاف ناقصة.`);
      p.blocks.forEach((b, k) => { if ((b.items && !b.items.length) || (!b.items && !b.src)) out.push(`«${n}»: القسم ${k + 1} (${BLOCKS[b.type].name}) من غير صور.`); });
    });
    data.sites.forEach((s, i) => { if (!s.label || !/^https?:\/\/.+/.test(s.url) || !s.src) out.push(`موقع #${i + 1}: الاسم أو الرابط أو اللقطة ناقصة.`); });
    return out;
  }
  // empty optional titles are dropped so the files stay tidy
  function tidy(projects) {
    projects.forEach(p => p.blocks.forEach(b => { if (b.title && !b.title.ar && !b.title.en) delete b.title; if (b.type === 'browser' && !b.url) delete b.url; }));
  }

  /* ---------- save: one commit ---------- */
  let saving = false;
  async function save() {
    if (saving) return;
    const issues = problems();
    if (issues.length) { toast(issues[0], true); return; }
    tidy(data.projects);
    const parts = changedParts();
    // only images still used somewhere are uploaded
    const used = JSON.stringify([data.projects, data.sites]);
    const imgs = [...staged.keys()].filter(p => used.includes(JSON.stringify(p)));
    if (!parts.length && !imgs.length) { staged.clear(); syncDirty(); return; }
    const message = `لوحة التحكم: ${parts.map(k => PART[k]).join('، ')}${imgs.length ? `${parts.length ? ' + ' : ''}${imgs.length} صورة` : ''}`;
    if (DEMO) {
      console.log('[demo] commit:', message, parts.map(k => FILES[k]), imgs);
      toast('وضع التجربة: التعديلات ما اتحفظتش. ' + message);
      return;
    }
    saving = true; $('#saveBtn').disabled = true;
    status('جاري الحفظ…', 'busy');
    try {
      const ref = await gh(`${R}/git/ref/heads/${BRANCH}`);
      const head = ref.object.sha;
      if (head !== baseSha) {
        // someone saved since this page loaded: stop if they touched the same part
        const cmp = await gh(`${R}/compare/${baseSha}...${head}`);
        const touched = (cmp.files || []).map(f => f.filename);
        const clash = parts.filter(k => touched.includes(FILES[k]));
        if (clash.length && !confirm(`حد من الفريق حفظ تعديلات على «${clash.map(k => PART[k]).join('، ')}» بعد ما فتحت اللوحة.\n\nلو كمّلت، تعديلاتك هتحل محل تعديلاته في الجزء ده. الأفضل تنسخ تعديلاتك وتعيد تحميل الصفحة.\n\nتكمّل الحفظ؟`)) {
          status('اتلغى الحفظ', 'err'); saving = false; syncDirty(); return;
        }
      }
      const commit = await gh(`${R}/git/commits/${head}`);
      const tree = [];
      for (const k of parts) tree.push({ path: FILES[k], mode: '100644', type: 'blob', content: JSON.stringify(data[k], null, 2) + '\n' });
      let n = 0;
      for (const p of imgs) {
        status(`جاري رفع الصور ${++n}/${imgs.length}…`, 'busy');
        const blob = await gh(`${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: await blobB64(staged.get(p).blob), encoding: 'base64' }) });
        tree.push({ path: p, mode: '100644', type: 'blob', sha: blob.sha });
      }
      status('جاري الحفظ…', 'busy');
      const t = await gh(`${R}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
      const c = await gh(`${R}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: t.sha, parents: [head] }) });
      await gh(`${R}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) });
      baseSha = c.sha;
      for (const k of parts) orig[k] = JSON.stringify(data[k]);
      for (const [p, s] of staged) { if (imgs.includes(p)) shown.set(p, s.url); }
      staged.clear(); fresh.clear();
      render(); syncDirty();
      toast('اتحفظ. الموقع هيتحدّث خلال دقيقة أو اتنين.');
      watchDeploy(c.sha);
    } catch (x) {
      status('فشل الحفظ', 'err');
      toast(x.status === 409 || x.status === 422 ? 'حصل تعارض مع تعديل تاني. اضغط حفظ تاني.' : 'فشل الحفظ: ' + x.message, true);
      syncDirty();
    }
    saving = false;
    if (changedParts().length || staged.size) $('#saveBtn').disabled = false;
  }
  $('#saveBtn').addEventListener('click', save);
  document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (!$('#saveBtn').disabled) save(); } });

  async function watchDeploy(sha) {
    status('جاري النشر على الموقع…', 'busy');
    for (let i = 0; i < 80; i++) {
      await sleep(6000);
      if (changedParts().length || staged.size) return;   // new edits take over the status line
      let run;
      try { run = ((await gh(`${R}/actions/runs?head_sha=${sha}&per_page=1`)).workflow_runs || [])[0]; } catch (x) { continue; }
      if (!run || run.status !== 'completed') continue;
      if (run.conclusion === 'success') status('', 'ok', 'اتنشر على الموقع · <a href="/" target="_blank" rel="noopener">فتح ↗</a>');
      else status('', 'err', `النشر فشل · <a href="${esc(run.html_url)}" target="_blank" rel="noopener">التفاصيل ↗</a>`);
      return;
    }
    status('النشر بياخد وقت أطول من المعتاد', 'busy');
  }

  /* ---------- boot ---------- */
  (async () => {
    if (DEMO) return start();
    const saved = store.get();
    if (saved) {
      try { await signIn(saved, !!localStorage.getItem('wasb-admin')); return start(); }
      catch (x) { if (x.status === 401) store.clear(); }
    }
    $('#login').hidden = false;
    $('#tokenInput').focus();
  })();
})();
