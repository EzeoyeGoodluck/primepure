// Builds the site into public/. Nothing to install — run with: node build.mjs
//
//   src/data/*.json      the content (services, towns, town+service intros)
//   src/pages/*.html     one-off pages
//   src/templates/*.html page shapes that get filled from the data
//   src/partials/*.html  layout, quote form, closing call-to-action
//
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cfg = json('site.config.json');
const services = json('src/data/services.json');
const towns = json('src/data/towns.json');
const pairs = json('src/data/pairs.json');

const svcBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
const townBySlug = Object.fromEntries(towns.map((t) => [t.slug, t]));
const primaryTowns = towns.filter((t) => t.primary);

/* ---------- icons ---------- */
const stroke = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

const icons = {
  check: stroke('<path d="M20 6L9 17l-5-5"/>'),
  arrow: stroke('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  phone: stroke('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z"/>'),
  mail: stroke('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),
  pin: stroke('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  clock: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  shield: stroke('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  shieldCheck: stroke('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  user: stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  building: stroke('<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>'),
  leaf: stroke('<path d="M12 3c4 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z"/>'),
  camera: stroke('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/><circle cx="7" cy="11" r="1.6"/><circle cx="17" cy="11" r="1.6"/>'),
};
const star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';

/* ---------- partials ---------- */
const partials = {};
for (const f of fs.readdirSync(path.join(root, 'src/partials'))) {
  partials[path.basename(f, '.html')] = read(`src/partials/${f}`);
}

/* ---------- html builders ---------- */
const tick = `${icons.check}`;

function serviceCard(svc, hrefPrefix = '/services') {
  const bullets = svc.bullets.map((b) => `<li>${tick}${esc(b)}</li>`).join('');
  return `<article class="card">
  <span class="label">${esc(svc.label)}</span>
  <h3>${esc(svc.nav)}</h3>
  <p>${esc(svc.summary)}</p>
  <ul class="checks">${bullets}</ul>
  <div class="foot"><a class="textlink" href="${hrefPrefix}/${svc.slug}">View details ${icons.arrow}</a></div>
</article>`;
}

function townServiceCard(svc, town) {
  const href = town.primary ? `/areas/${town.slug}/${svc.slug}` : `/services/${svc.slug}`;
  return `<article class="card">
  <span class="label">${esc(svc.label)}</span>
  <h3>${esc(svc.name)} in ${esc(town.name)}</h3>
  <p>${esc(svc.summary)}</p>
  <div class="foot"><a class="textlink" href="${href}">View this service ${icons.arrow}</a></div>
</article>`;
}

function townTile(town) {
  const sub = town.primary && town.slug === 'walsall' ? 'Head office &middot; 6 services' : '6 services';
  return `<a class="tile" href="/areas/${town.slug}">
  <span><b>${esc(town.name)}</b><span>${sub}</span></span>
  ${icons.arrow}
</a>`;
}

function checklistCols(svc) {
  return svc.checklist
    .map((g) => `<div class="cl"><h3>${esc(g.group)}</h3><ul>${g.items.map((i) => `<li>${tick}${esc(i)}</li>`).join('')}</ul></div>`)
    .join('');
}

function processList(svc) {
  return svc.process
    .map((p, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><span><b>${esc(p.title)}</b><span>${esc(p.text)}</span></span></li>`)
    .join('');
}

function faqList(items) {
  return items.map((f) => `<div class="item"><dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd></div>`).join('');
}

function chipLinks(list) {
  return list.map((c) => `<li><a href="${c.href}">${esc(c.label)}</a></li>`).join('');
}

function chipPlain(list) {
  return list.map((c) => `<li><span>${esc(c)}</span></li>`).join('');
}

function reviewCards(townName) {
  const slots = [
    `[REVIEW FROM A ${townName.toUpperCase()} CUSTOMER]`,
    `[REVIEW — ideally one that names the neighbourhood]`,
    `[REVIEW — a landlord or agent carries the most weight]`,
  ];
  return slots
    .map((s) => `<blockquote class="quote"><div class="stars">${star.repeat(5)}</div><p>${esc(s)}</p><footer>[NAME] &middot; [AREA] &middot; [SERVICE]</footer></blockquote>`)
    .join('');
}

function heroMedia(svc, imgs) {
  if (svc.image) {
    return `<img src="${imgs[svc.image]}" alt="${esc(svc.name)} by the PrimePure team" width="1100" height="760">
  <div class="float-card float-card--navy">${icons.shieldCheck}<p>72-hour re-clean guarantee</p><p class="by">Anything we cleaned that is not right, we come back and re-do. No charge, no argument.</p></div>`;
  }
  return `<div class="facts">
  <h3>What you get either way</h3>
  <dl>
    <div class="row"><dt>Insurance</dt><dd>&pound;5m public liability</dd></div>
    <div class="row"><dt>Staff</dt><dd>DBS-checked, COSHH-trained</dd></div>
    <div class="row"><dt>Guarantee</dt><dd>72-hour re-clean</dd></div>
    <div class="row"><dt>Reply time</dt><dd>Within the hour</dd></div>
  </dl>
  <a class="btn btn--gold btn--block" href="/quote">Request a quote</a>
</div>`;
}

/* ---------- schema ---------- */
const base = {
  '@type': 'HouseCleaningService',
  '@id': `${cfg.url}/#business`,
  name: cfg.name,
  url: cfg.url,
  telephone: cfg.phoneTel,
  email: cfg.email,
  image: `${cfg.url}${cfg.images.logo}`,
  address: { '@type': 'PostalAddress', streetAddress: 'No. 2 Dudley Street', addressLocality: 'Walsall', postalCode: 'WS1 3NL', addressCountry: 'GB' },
  areaServed: towns.map((t) => ({ '@type': 'City', name: t.name })),
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '07:30',
    closes: '19:00',
  },
};

function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: cfg.url + t.url })),
  };
}

function faqSchema(items) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

function schemaFor(parts) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [base, ...parts] });
}

/* ---------- rendering ---------- */
const navLinks = [
  ['Services', '/services'],
  ['Areas we cover', '/areas'],
  ['About', '/about'],
  ['Contact', '/contact'],
];

const globals = {
  name: esc(cfg.name),
  url: cfg.url,
  phone: cfg.phone,
  phoneTel: cfg.phoneTel,
  telHref: `tel:${cfg.phoneTel}`,
  email: cfg.email,
  emailHref: `mailto:${cfg.email}`,
  formsubmitAddress: cfg.formsubmitAddress,
  formSubject: 'Quote request',
  stars: star.repeat(5),
  starsLarge: star.repeat(5),
  serviceOptions: services.map((s) => `<option>${esc(s.nav)}</option>`).join(''),
  serviceCards: services.map((s) => serviceCard(s)).join(''),
  townTiles: towns.map(townTile).join(''),
  footerServices: services.map((s) => `<li><a href="/services/${s.slug}">${esc(s.nav)}</a></li>`).join(''),
  footerAreas: towns.slice(0, 5).map((t) => `<li><a href="/areas/${t.slug}">${esc(t.name)}</a></li>`).join('') + '<li><a href="/areas">All nine towns</a></li>',
};
for (const [k, v] of Object.entries(cfg.images)) globals[`img_${k}`] = v;
for (const [k, v] of Object.entries(icons)) globals[`ic_${k}`] = v;

function render(tpl, vars, depth = 0) {
  if (depth > 6) throw new Error('Partial nesting too deep');
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => {
      if (!(n in partials)) throw new Error(`Missing partial: ${n}`);
      return render(partials[n], vars, depth + 1);
    })
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
      if (!(k in vars)) throw new Error(`Unknown placeholder {{${k}}}`);
      return vars[k];
    });
}

function frontMatter(src) {
  const m = src.match(/^<!--([\s\S]*?)-->\s*/);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

const sitemap = [];

function emit({ out, url, title, description, body, vars = {}, schema, indexed = true }) {
  const navItems = navLinks
    .map(([label, href]) => {
      const current = href === '/' ? url === '/' : url === href || url.startsWith(href + '/');
      return `<li><a href="${href}"${current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
    })
    .join('');
  const logo = globals.img_logo;
  const all = {
    ...globals,
    ...vars,
    title: esc(title),
    description: esc(description),
    canonical: cfg.url + url,
    ogImage: cfg.url + logo,
    navItems,
    schema: schema || schemaFor([]),
  };
  all.content = render(body, all);
  const html = render(partials.layout, all);
  const dest = path.join(root, 'public', out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  if (indexed) sitemap.push(cfg.url + url);
  return url;
}

/* ---------- wipe previously generated html ---------- */
function wipeHtml(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue;
      wipeHtml(p);
      if (fs.readdirSync(p).length === 0) fs.rmdirSync(p);
    } else if (entry.name.endsWith('.html')) {
      fs.unlinkSync(p);
    }
  }
}
wipeHtml(path.join(root, 'public'));

/* ---------- one-off pages ---------- */
const oneOffs = [
  ['index.html', '/', 'index.html'],
  ['about.html', '/about', 'about.html'],
  ['contact.html', '/contact', 'contact.html'],
  ['quote.html', '/quote', 'quote.html'],
];
for (const [src, url, out] of oneOffs) {
  const { meta, body } = frontMatter(read(`src/pages/${src}`));
  emit({ out, url, title: meta.title, description: meta.description, body, schema: schemaFor(url === '/' ? [] : [breadcrumbs([{ name: 'Home', url: '/' }, { name: meta.title.split('|')[0].trim(), url }])]) });
}
{
  const { meta, body } = frontMatter(read('src/pages/404.html'));
  emit({ out: '404.html', url: '/404', title: meta.title, description: meta.description, body, indexed: false });
}

/* ---------- services index ---------- */
emit({
  out: 'services/index.html',
  url: '/services',
  title: 'Cleaning Services in Walsall & the West Midlands | PrimePure',
  description: 'Home cleaning, end of tenancy, carpet extraction, decluttering, office contracts and after builders cleans. Published checklists and a 72-hour re-clean guarantee.',
  body: read('src/templates/services-index.html'),
  schema: schemaFor([breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }])]),
});

/* ---------- areas index ---------- */
emit({
  out: 'areas/index.html',
  url: '/areas',
  title: 'Areas We Cover | PrimePure Cleaning, Walsall',
  description: 'Cleaning across Walsall, Birmingham, Wolverhampton, West Bromwich, Sutton Coldfield, Solihull, Dudley, Cannock and Lichfield.',
  body: read('src/templates/areas-index.html'),
  schema: schemaFor([breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Areas we cover', url: '/areas' }])]),
});

/* ---------- service pages ---------- */
const serviceTpl = read('src/templates/service.html');
for (const svc of services) {
  const url = `/services/${svc.slug}`;
  emit({
    out: `services/${svc.slug}/index.html`,
    url,
    title: `${svc.name} in Walsall & the West Midlands | PrimePure`,
    description: `${svc.summary} ${svc.name} across Walsall, Birmingham, Wolverhampton and six more towns. DBS-checked, £5m insured, 72-hour re-clean guarantee.`,
    body: serviceTpl,
    vars: {
      svcName: esc(svc.name),
      svcLabel: esc(svc.label),
      svcIntro: esc(svc.intro),
      svcHeroMedia: heroMedia(svc, cfg.images),
      svcChecklist: checklistCols(svc),
      svcProcess: processList(svc),
      svcFaq: faqList(svc.faq),
      svcNotIncluded: esc(svc.notIncluded),
      svcTownChips: chipLinks(
        towns.map((t) => ({
          label: t.name,
          href: t.primary ? `/areas/${t.slug}/${svc.slug}` : `/areas/${t.slug}`,
        }))
      ),
      formSubject: `Quote request — ${svc.name}`,
    },
    schema: schemaFor([
      breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: svc.name, url }]),
      faqSchema(svc.faq),
    ]),
  });
}

/* ---------- town pages ---------- */
const townTpl = read('src/templates/town.html');
for (const town of towns) {
  const url = `/areas/${town.slug}`;
  const nearby = towns.filter((t) => t.slug !== town.slug).slice(0, 5);
  emit({
    out: `areas/${town.slug}/index.html`,
    url,
    title: `Cleaning Services in ${town.name} | PrimePure`,
    description: `Home, tenancy, carpet and office cleaning across ${town.name} (${town.postcodes}). DBS-checked, £5m insured, no travel charge.`,
    body: townTpl,
    vars: {
      townName: esc(town.name),
      townUpper: esc(town.name.toUpperCase()),
      townSlug: town.slug,
      townPostcodes: esc(town.postcodes),
      townIntro: esc(town.intro),
      townHousing: esc(town.housing),
      townTravel: esc(town.travel),
      townAreaChips: chipPlain(town.areas),
      townServiceCards: services.map((s) => townServiceCard(s, town)).join(''),
      townReviews: reviewCards(town.name),
      townFaq: faqList(town.faq),
      townNearby: chipLinks(nearby.map((t) => ({ label: t.name, href: `/areas/${t.slug}` }))),
      formSubject: `Quote request — ${town.name}`,
    },
    schema: schemaFor([
      breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Areas we cover', url: '/areas' }, { name: town.name, url }]),
      faqSchema(town.faq),
    ]),
  });
}

/* ---------- town + service pages ---------- */
const pairTpl = read('src/templates/pair.html');
for (const town of primaryTowns) {
  for (const svc of services) {
    const intro = pairs[town.slug] && pairs[town.slug][svc.slug];
    if (!intro) continue;
    const url = `/areas/${town.slug}/${svc.slug}`;
    const siblings = services.filter((s) => s.slug !== svc.slug).map((s) => ({ label: s.name, href: `/areas/${town.slug}/${s.slug}` }));
    const nearby = towns
      .filter((t) => t.slug !== town.slug)
      .slice(0, 5)
      .map((t) => ({ label: t.name, href: t.primary ? `/areas/${t.slug}/${svc.slug}` : `/areas/${t.slug}` }));
    emit({
      out: `areas/${town.slug}/${svc.slug}/index.html`,
      url,
      title: `${svc.name} in ${town.name} | PrimePure`,
      description: `${svc.name} across ${town.name} (${town.postcodes}). Published checklist, DBS-checked staff, £5m insured and a 72-hour re-clean guarantee.`,
      body: pairTpl,
      vars: {
        svcName: esc(svc.name),
        svcLower: esc(svc.name.toLowerCase()),
        svcLabel: esc(svc.label),
        svcIntro: esc(svc.intro),
        svcHeroMedia: heroMedia(svc, cfg.images),
        svcChecklist: checklistCols(svc),
        svcProcess: processList(svc),
        svcFaq: faqList(svc.faq),
        svcNotIncluded: esc(svc.notIncluded),
        townName: esc(town.name),
        townSlug: town.slug,
        townPostcodes: esc(town.postcodes),
        townHousing: esc(town.housing),
        townTravel: esc(town.travel),
        townAreaChips: chipPlain(town.areas),
        pairIntro: esc(intro),
        pairSiblings: chipLinks(siblings),
        pairNearby: chipLinks(nearby),
        formSubject: `Quote request — ${svc.name}, ${town.name}`,
      },
      schema: schemaFor([
        breadcrumbs([
          { name: 'Home', url: '/' },
          { name: 'Areas', url: '/areas' },
          { name: town.name, url: `/areas/${town.slug}` },
          { name: svc.name, url },
        ]),
        faqSchema(svc.faq),
      ]),
    });
  }
}

/* ---------- sitemap + robots ---------- */
fs.writeFileSync(
  path.join(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.url}/sitemap.xml\n`);

console.log(`Built ${sitemap.length} indexed pages into public/`);
console.log(`  ${services.length} service pages, ${towns.length} town pages, ${primaryTowns.length * services.length} town+service pages`);
