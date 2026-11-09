// Copies every image from the old GoHighLevel site into this project, so the new
// site no longer depends on the old hosting. Run ONCE, before cancelling GoHighLevel:
//
//   node download-images.mjs
//
// It saves the files to public/assets/img/, points site.config.json at them,
// and rebuilds the pages. Then commit and push as usual.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const cfgPath = path.join(root, 'site.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const outDir = path.join(root, 'public/assets/img');
fs.mkdirSync(outDir, { recursive: true });

let changed = 0;
for (const [key, url] of Object.entries(cfg.images)) {
  if (!/^https?:\/\//.test(url)) { console.log(`  ${key}: already local`); continue; }
  const ext = (path.extname(new URL(url).pathname) || '.jpg').toLowerCase();
  const file = `${key}${ext}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(path.join(outDir, file), Buffer.from(await res.arrayBuffer()));
    cfg.images[key] = `/assets/img/${file}`;
    changed++;
    console.log(`  ${key}: saved ${file}`);
  } catch (err) {
    console.log(`  ${key}: FAILED (${err.message}) — kept the old link`);
  }
}

fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
console.log(`\n${changed} images saved. Rebuilding…`);
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { stdio: 'inherit' });
