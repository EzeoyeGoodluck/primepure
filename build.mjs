// Builds the site: combines src/partials + src/pages into public/*.html
// Run with:  node build.mjs   (nothing to install)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const partials = {};
for (const f of fs.readdirSync(path.join(root, 'src/partials'))) partials[path.basename(f, '.html')] = read(`src/partials/${f}`);

// Values every page can use as {{name}}. Images are {{img_<key>}}.
const globals = {
  name: esc(cfg.name), url: cfg.url,
  phone: cfg.phone, phoneTel: cfg.phoneTel, telHref: `tel:${cfg.phoneTel}`,
  email: cfg.email, emailHref: `mailto:${cfg.email}`, formsubmitAddress: cfg.formsubmitAddress,
  areaChips: cfg.areas.map((a) => `<span class="chip">${esc(a)}</span>`).join(''),
  serviceLinks: cfg.services.map((s) => `<li><a href="/services#${s[0]}">${esc(s[1])}</a></li>`).join(''),
  serviceOptions: cfg.serviceOptions.map((s) => `<option>${esc(s)}</option>`).join(''),
};
for (const [k, v] of Object.entries(cfg.images)) globals[`img_${k}`] = v;

function parsePage(src) {
  const m = src.match(/^<!--([\s\S]*?)-->\s*/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function render(tpl, vars, depth = 0) {
  if (depth > 6) throw new Error('Partial nesting too deep');
  return tpl
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => { if (!(n in partials)) throw new Error(`Missing partial: ${n}`); return render(partials[n], vars, depth + 1); })
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => { if (!(k in vars)) throw new Error(`Unknown placeholder {{${k}}}`); return vars[k]; });
}

const pages = fs.readdirSync(path.join(root, 'src/pages')).filter((f) => f.endsWith('.html'));
const sitemap = [];

for (const file of pages) {
  const { meta, body } = parsePage(read(`src/pages/${file}`));
  const slug = path.basename(file, '.html');
  const urlPath = slug === 'index' ? '/' : `/${slug}`;
  const navItems = cfg.nav
    .map(([k, label, href]) => `<li><a href="${href}"${k === slug ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`)
    .join('');
  const logo = globals.img_logo;
  const vars = {
    ...globals,
    title: esc(meta.title || cfg.name),
    description: esc(meta.description || ''),
    canonical: cfg.url + urlPath,
    ogImage: logo.startsWith('/') ? cfg.url + logo : logo,
    navItems,
  };
  vars.content = render(body, vars);
  fs.writeFileSync(path.join(root, 'public', `${slug}.html`), render(partials.layout, vars));
  if (slug !== '404') sitemap.push(vars.canonical);
  console.log(`  built ${slug}.html  →  ${urlPath}`);
}

fs.writeFileSync(path.join(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.url}/sitemap.xml\n`);
console.log(`Done — ${pages.length} pages built into public/`);
