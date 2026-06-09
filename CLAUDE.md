# OTC Services Website — CLAUDE.md

## Project context

Marketing and company website for **OTC Services DMCC**, a DMCC-licensed SaaS provider and white glove OTC services company based in Dubai. The site covers the company's product lines (Analytics Technology, Lightning Network Technology), the team, careers, and legal pages.

Entity: OTC Services DMCC (part of the Bcomm group)
Audience: Institutional clients, financial institutions, digital asset operators, prospective hires

---

## Tech stack

| Layer | Choice |
|---|---|
| Pages | Plain HTML5 (no framework, no SSG) |
| Styling | Vanilla CSS — single shared stylesheet `css/main.css` |
| Scripts | Vanilla JS — `js/main.js` (nav, interactions), `js/galaxy.js` (homepage hero), `js/DomeGallery.js` (company page dome) |
| Fonts | Google Fonts — Instrument Sans, Inter (loaded via `@import` in main.css) |
| Hosting | Static — deployable to Vercel, GitHub Pages, or any CDN |
| Build | None — no bundler, no transpiler, no package.json |

---

## File structure

```
/
├── index.html              # Homepage
├── company.html            # Company + team dome gallery
├── analytics.html          # Analytics Technology product page
├── lightning.html          # Lightning Technology product page
├── careers.html            # Careers
├── contact.html            # Contact form
├── faq.html                # FAQ
├── blog.html               # Blog index
├── post-trump-fed-crypto.html  # Example blog post
├── privacy.html            # Privacy Policy
├── terms.html              # Terms of Use
├── css/
│   ├── main.css            # Shared design system + all page styles
│   └── DomeGallery.css     # Styles for the company page dome component
├── js/
│   ├── main.js             # Nav dropdowns, mobile menu, scroll behaviour
│   ├── galaxy.js           # Canvas particle animation (homepage hero)
│   └── DomeGallery.js      # Vanilla JS dome gallery (company page)
└── assets/
    ├── logo-white.svg
    ├── logo-dark.svg
    ├── OTCS Icon.svg
    ├── team-work.webp      # Team meeting photo (company page)
    ├── team-22.webp        # Team photo (CTA section)
    ├── team/               # Individual staff headshots (.webp)
    ├── team-gallery/       # Gallery images
    └── partners/           # Partner logos
```

---

## Design system tokens

All tokens are CSS custom properties on `:root` in `main.css`.

### Colours

| Token | Value | Usage |
|---|---|---|
| `--color-navy` | `#28266B` | Primary brand, nav, page heroes |
| `--color-midnight` | `#141336` | Dark hero backgrounds (e.g. dome gallery) |
| `--color-cyan` | `#20CFEA` | Accent, gradient start |
| `--color-purple` | `#6D18C9` | Accent, gradient end |
| `--color-blue` | `#497CDD` | Buttons, links |
| `--color-text` | `#2E3448` | Body text |
| `--color-text-secondary` | `#687086` | Secondary body text |
| `--color-bg` | `#F8FAFF` | Default page background |
| `--color-dark-text` | `#F8FAFF` | Text on dark backgrounds |

### Typography

| Token | Value |
|---|---|
| `--font-primary` | `'Instrument Sans', sans-serif` |
| `--font-alt` | `'Inter', sans-serif` |
| `--text-display` | `80px` |
| `--text-h1` | `64px` |
| `--text-h2` | `48px` |

---

## Key component patterns

### Page hero (dark)
```html
<section class="page-hero" id="page-hero-section">
  <div class="container">
    <div class="page-hero-content">
      <span class="overline">Page name</span>
      <h1>Headline</h1>
      <p>Sub-copy</p>
    </div>
  </div>
</section>
```

### Page hero with dome gallery (company.html)
```html
<section class="page-hero page-hero--gallery" id="page-hero-section">
  <div id="dome-gallery-mount"></div>
</section>
<!-- initialised at bottom of body via DomeGallery.js -->
```

### DomeGallery init options
```js
new DomeGallery(mountEl, {
  images: [{ src: 'assets/team/Name.webp', alt: 'Name' }],
  overlayBlurColor: '#141336',  // match section background
  grayscale: true,
  autoSpin: true,
  autoSpinSpeed: 0.03,          // degrees per frame (~60fps)
  clickable: false,
  fit: 0.55,
  minRadius: 500
});
```

### Stats bar
```html
<section class="stats-bar">
  <div class="container">
    <div class="stats-grid" style="grid-template-columns: repeat(N, 1fr);">
      <div class="stat-item">
        <div class="stat-number">Value</div>
        <div class="stat-label">Label</div>
      </div>
    </div>
  </div>
</section>
```
Override `grid-template-columns` inline whenever the number of stats differs from 4.

---

## Brand voice and copy rules

- Professional, direct, confident. No hype, no buzzwords.
- No em dashes anywhere. Use periods, commas, or restructure the sentence.
- Compliance and credibility are always acknowledged — never buried.
- Refer to the company as **OTC Services** or **OTC Services DMCC** (not "we" in headings).
- OTC Services is a **technology and services company**, not a trading company.

---

## Team headshots

Staff `.webp` files live in `assets/team/`. The `DomeGallery` images array in `company.html` maps each file to a name. Add new staff by dropping a `.webp` into that folder and adding an entry to the array.

---

## Development

```bash
# Serve locally (Python)
python3 -m http.server 8080

# Serve locally (Node)
npx serve .
```

No install step. No build step. Edit HTML/CSS/JS directly and reload the browser.

---

## Pre-launch checklist

- [ ] Replace favicon placeholder in all `<head>` blocks
- [ ] Add `Alberto.webp` to `assets/team/` (already referenced in dome gallery)
- [ ] Confirm all LinkedIn URLs in the team roster are correct
- [ ] Verify DMCC licence number `DMCC-400801` in footer is current
- [ ] Update headcount stat if team grows beyond 100
- [ ] Add Open Graph / Twitter card meta tags to each page
- [ ] Set up a real form endpoint for `contact.html`
- [ ] Configure custom domain and SSL on hosting provider
