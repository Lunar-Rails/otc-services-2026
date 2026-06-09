# OTC Services — Website 2026

Marketing website for [OTC Services DMCC](https://otcservices.io), a DMCC-licensed SaaS provider and white glove OTC services company based in Dubai.

---

## Tech stack

- **HTML5** — plain multi-page site, no framework or SSG
- **Vanilla CSS** — single shared stylesheet (`css/main.css`)
- **Vanilla JS** — no bundler, no dependencies
- **Fonts** — Instrument Sans + Inter via Google Fonts
- **Hosting** — static, deployable to Vercel, GitHub Pages, or any CDN

---

## Getting started

No install step required.

```bash
# Clone
git clone https://github.com/your-org/otc-services-website-2026.git
cd otc-services-website-2026

# Serve locally
python3 -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## Project structure

```
/
├── index.html                   # Homepage
├── company.html                 # Company + team dome gallery
├── analytics.html               # Analytics Technology
├── lightning.html               # Lightning Technology
├── careers.html                 # Careers
├── contact.html                 # Contact
├── faq.html                     # FAQ
├── blog.html                    # Blog index
├── privacy.html                 # Privacy Policy
├── terms.html                   # Terms of Use
├── css/
│   ├── main.css                 # Shared design system + page styles
│   └── DomeGallery.css          # Company page dome component styles
├── js/
│   ├── main.js                  # Nav, mobile menu, scroll behaviour
│   ├── galaxy.js                # Canvas particle animation (homepage)
│   └── DomeGallery.js           # Interactive 3D dome gallery (company page)
└── assets/
    ├── logo-white.svg
    ├── logo-dark.svg
    ├── team/                    # Staff headshots (.webp)
    ├── team-work.webp
    └── partners/
```

---

## Pages

| File | Title |
|---|---|
| `index.html` | Home |
| `company.html` | Company |
| `analytics.html` | Analytics Technology |
| `lightning.html` | Lightning Technology |
| `careers.html` | Careers |
| `contact.html` | Contact |
| `faq.html` | FAQ |
| `blog.html` | Blog |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms of Use |

---

## Adding team members

1. Drop a `.webp` headshot into `assets/team/`
2. Add an entry to the `images` array in the `DomeGallery` init script at the bottom of `company.html`:

```js
{ src: 'assets/team/FirstName.webp', alt: 'Full Name' }
```

Also add the person to the team roster in the `#main-content` section of `company.html`.

---

## Deployment

### Vercel

```bash
npx vercel
```

Or connect the GitHub repo in the Vercel dashboard. No build command or output directory needed — set both to empty / root.

### GitHub Pages

Push to `main`. In repository Settings, set Pages source to `/ (root)` on `main`.

### Any static host

Upload the repository root. No build step required.

---

## Environment variables

None. This is a fully static site with no server-side logic.

---

## Pre-launch checklist

- [ ] Add favicon to all pages (`<link rel="icon" href="assets/favicon.ico">`)
- [ ] Add `Alberto.webp` to `assets/team/` (entry already in dome gallery)
- [ ] Verify all LinkedIn profile URLs in the team roster
- [ ] Confirm DMCC licence number in footer (`DMCC-400801`)
- [ ] Add Open Graph and Twitter card meta tags to each page
- [ ] Wire up a real form submission endpoint in `contact.html`
- [ ] Configure custom domain and SSL on hosting provider
- [ ] Test on mobile (nav, dome gallery, stats bar)
