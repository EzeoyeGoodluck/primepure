# PrimePure Cleaning Solutions — website

The PrimePure site, moved off GoHighLevel (vibepreview) into plain HTML/CSS/JS. Nothing to install.
Same pages and addresses (`/`, `/services`, `/about`, `/contact`, `/quote`), same text, same colours (blue `#0051D5`, gold, navy footer).

## Folder layout

```
site.config.json     ← domain, phone, email, form inbox, services, coverage areas, image links
src/pages/           ← one file per page (the content)
src/partials/        ← shared bits: header/footer layout, quote form fields, call-to-action band, icons
public/              ← the finished site (generated — don't edit its .html files directly)
public/assets/       ← styles.css (colours at the top), main.js
build.mjs            ← stitches pages + partials into public/
download-images.mjs  ← copies the logo and photos off GoHighLevel (run once — see below)
vercel.json          ← Vercel settings
```

## 1. Copy the images off GoHighLevel — do this BEFORE cancelling GoHighLevel
The logo and photos still load from GoHighLevel's file storage. Run once, in this folder:

```bash
node download-images.mjs
```

## 2. Put it on GitHub and Vercel
```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```
On vercel.com → **Add New → Project** → import the repo → Framework Preset **Other** → **Deploy**.
Then **Settings → Domains** → add your domain (set to `primepurecleaning.co.uk` in `site.config.json`; change it there if it's different).

## 3. Activate the forms (once)
Both the **quote form** (homepage and /quote) and the **contact form** email enquiries to **hello@primepurecleaning.co.uk** through FormSubmit (free, no account).
1. Once the site is live, send one test quote.
2. FormSubmit emails hello@primepurecleaning.co.uk an **activation link**. Click it (check spam).
3. Every enquiry after that arrives as an email with all the form details. Pressing **Reply** answers the customer.

To use a different inbox, change `formsubmitAddress` in `site.config.json`.

## Extras
- "Request Quote for This" buttons open the quote form with that service already selected.
- SEO titles and descriptions per page, cleaning-business schema for Google, `sitemap.xml`, `robots.txt`, 404 page, mobile menu, and a sticky "Call now / Free Quote" bar on phones.
