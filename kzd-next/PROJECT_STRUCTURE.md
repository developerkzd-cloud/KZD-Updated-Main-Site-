# KZD Solutions website: project structure

This repository holds **two separate websites**:

| | Static site (live today) | Next.js site (the rebuild) |
|---|---|---|
| Where | The repository root | [`kzd-next/`](.) |
| Built with | Plain HTML, CSS and JavaScript, plus PHP for forms | Next.js 16 (App Router), React 19, TypeScript, CSS Modules |
| Design | The old design (greyscale + navy) | The new Penpot "Revamped" design (black, white and greys) |
| Hosting | cPanel over FTP (`.htaccess` handles clean URLs) | Not deployed yet |

The two are kept apart on purpose. They share only one file:
`css/kzd-tokens.css` (the old design tokens), which the Next.js app still
imports while pages are moved to its own token file.

---

## 1. Repository root (the static site)

```
KZD-Website-Updates-main/
├── index.html                 Homepage
├── services.html              Services
├── contact.html               Contact (form posts to email-templates/contact-form.php)
├── careers.html, job.html     Careers listing and a single job
├── profile.html               Applicant profile (prototype, data in localStorage)
├── accounting.html            Accounting service page + health check
├── blog.html, article.html    Blog index and article
├── hosting.html, cloud.html, VpsHosting.html, wordpress.html
├── domain-register.html, domain-transfer.html, domain-pricing.html, tld-extensions.html
│
├── css/                       Stylesheets (kzd-*.css per section, kzd-tokens.css = design tokens)
├── js/                        Scripts (kzd-*.js per section, kzd-store.js = localStorage data layer,
│                              kzd-integration.js = FOSSBilling order links)
├── fonts/                     Self-hosted Inter, Inter Tight, JetBrains Mono (.woff2)
├── Assets/                    clients/, icons/, logos/, photos/, products/
├── images/                    Older photos and client screenshots
├── admin/                     Admin prototype (applications, content, employees, jobs, settings)
├── email-templates/           PHP form handlers + PHPMailer
├── sass/                      SCSS source of the original purchased theme
├── revolution/                Slider Revolution plugin (from the original theme)
├── _archive/                  Old "coming soon" pages and experiments, not linked anywhere
│
├── posts.json, careers.json, reviews.json   Content read by the static pages' JavaScript
├── sitemap.xml, Robots.txt, google*.html     SEO and Google Search Console verification
├── .htaccess                  Clean URLs (/contact → contact.html), redirects, PHP version
├── .github/workflows/deploy.yml.disabled    FTP deploy workflow (switched off)
├── .htmlvalidate.json, package.json          `npm run validate` checks the HTML
└── kzd-next/                  The Next.js rebuild (section 2)
```

**Loose files at the root you can probably delete or move:**
- `*.bak-*` backups: `index.html.bak-*`, plus `css/*.bak-*` and `js/*.bak-*`.
- Screenshots from design reviews: `about-*.png`, `hero-*.png`, `nav-*.png` and `mobile-*.png`.
- Unnamed images: `images.jpeg`, `images (1).jpeg` and `images (2).jpeg`.
- Debug and duplicate files:
  - `phpinfo.php`: a debug page that should not be on a live server.
  - `globals.css` and `style.css`: stray copies at the root.

---

## 2. `kzd-next/` (the Next.js site)

```
kzd-next/
├── next.config.ts        Turbopack root (repo root, so ../css can be imported) + AVIF images
├── package.json          dev / build / start / lint / typecheck scripts
├── tsconfig.json         `@/` = src/
├── eslint.config.mjs     Next's lint rules (`npm run lint` allows zero warnings)
├── .env.example          Env vars (Google Maps key, currently unused by the keyless embed)
├── AGENTS.md, CLAUDE.md  Notes for AI coding assistants (written by `next dev`)
├── public/               Static files served as-is (section 2.5)
└── src/
    ├── app/              Routes: one folder per URL (section 2.1)
    ├── components/       Shared UI pieces (section 2.2)
    ├── lib/              Shared logic and data helpers (section 2.3)
    └── data/             JSON content (section 2.4)
```

### 2.1 `src/app/`: pages and routes

Each folder is a URL. `page.tsx` is the page, `*.module.css` is its styling, `content.ts` holds its copy, and `*.tsx` files beside it are the interactive parts.

**Site-wide files**

| File | Purpose |
|---|---|
| `layout.tsx` | Wraps every page: fonts, Nav, Footer, OfflineGate, RevealObserver |
| `globals.css` | Imports both token files; base styles, selection colour, utilities |
| `tokens.css` | **The new design system**: colours, spacing, radius, shadows, motion, type |
| `icon.png` | Favicon |
| `robots.ts` | Generates `/robots.txt` |
| `sitemap.ts` | Generates `/sitemap.xml` |

**Built pages (new design)**

| Route | Folder | Interactive parts |
|---|---|---|
| `/` | `page.tsx`, `page.module.css` | `WhatWeDo.tsx` (services list + preview), `ChipString.tsx` (the R1M cord) |
| `/services` | `services/` | `ServicesTabs.tsx` (Consulting / Development / Telecoms / AI Builder tabs) |
| `/contact` | `contact/` | `ContactForm.tsx`, `MapEmbed.tsx` (satellite map, loads near the screen) |
| `/careers` | `careers/` | `CareersAuthGate.tsx` (sign-in popup when sent from /profile) |
| `/careers/[id]` | `careers/[id]/` | `JobTabs.tsx`, `ShareJob.tsx` |
| `/accounting` | `accounting/` | `AccountingHealthCheck.tsx` (16-point checklist and score) |
| `/profile` | `profile/` | `ProfileApp.tsx` plus tabs and modals (prototype, localStorage) |
| `/offline` | `offline/` | The offline screen the service worker serves when a page can't load |

**Coming-soon pages** (these show placeholder pages; the old pages are in git history)

| Route | Shows |
|---|---|
| `/services/[slug]` | Black coming-soon page for ai-builder, it-support, telecommunications, accounting-compliance |
| `/hosting`, `/domains/*`, `/blog`, `/blog/[slug]` | Black coming-soon page (`ServiceComingSoon`) |
| `/cloud`, `/vps-hosting`, `/wordpress` | Older simple placeholder (`ComingSoon`) |

The domain folders still contain their original search, transfer and pricing components (`DomainSearchForm.tsx`, `TransferForm.tsx`, `PricingSearch.tsx`, `PopularTldGrid.tsx`). The hosting folder still has `PlanCarousel.tsx`, `GetStartedButton.tsx` and `content.ts`. They are ready for when those pages come back.

**API routes** (`src/app/api/`): all three validate input and **only log it on the server**. Email sending isn't connected yet.

| Route | Called by |
|---|---|
| `/api/contact` | Contact form |
| `/api/accounting-contact` | Accounting form |
| `/api/notify` | "Notify me" on coming-soon pages |

**Internal:** `/dev/tokens` previews the design tokens and components. It is hidden from search.

### 2.2 `src/components/`: shared UI

| Folder | What it is | Used by |
|---|---|---|
| `Nav/` | Header: `Nav`, `NavShell` (transparent/dark states), `ServicesDropdown`, `MobileDrawer`, `CurrentLink` | Every page |
| `Footer/` | `Footer`, `FooterColumns` (mobile accordion), `FooterGate` (hides footer on coming-soon pages) | Every page |
| `HomeSections/` | Testimonials and Clients sections + carousels (shared by `/` and `/services`) | Home, Services |
| `SnapCarousel/` | Swipeable carousel base | Testimonials |
| `Reveal/` | `Reveal` (fade-in wrapper markup) + `RevealObserver` (one observer for the whole page) | Most pages |
| `ServiceComingSoon/` | Black coming-soon page + `NotifyForm` | Coming-soon routes |
| `ComingSoon/` | Older simple placeholder | cloud, vps-hosting, wordpress |
| `Offline/` | `OfflineScreen` (the design) + `OfflineGate` (shows it when the connection drops, registers `sw.js`) | Layout, `/offline` |
| `AuthModal/` | Applicant sign-in / sign-up popup (prototype) | Careers |
| `Icon/` | Inline SVG icon set (`glyphs.ts`) | Everywhere |
| `ArrowIcon/`, `Stars/`, `SocialIcons/`, `Eyebrow/`, `CountUp/` | Small building blocks | Various |
| `TldTable/` | Domain price table | Domain pricing |
| `Button/`, `Hero/`, `SectionContainer/`, `GoogleRatingCard/` | Early design-system pieces | Mostly `/dev/tokens` only |
| `ComingSoonProduct/`, `Cover/` | **Not used anywhere at the moment** | n/a |

### 2.3 `src/lib/`: shared logic

| File | Purpose |
|---|---|
| `nav.ts` | Nav items, footer links, contact details (phone, email), socials |
| `services.ts` | The six services (names, copy, icons, coming-soon flags) and `serviceHref()` |
| `comingSoon.ts` | Coming-soon page list and `isComingSoonPath()` (dark nav, no footer) |
| `caseStudies.ts` | Where "Case study" buttons go (blog, by category) |
| `content.ts` | Typed getters for `src/data/*.json` (jobs, posts, reviews, TLDs) |
| `fonts.ts` | Self-hosted fonts via `next/font/local` |
| `kzd-integration.ts` | FOSSBilling order and transfer links (`my.kzdsolutions.co.za`) and the TLD search |
| `kzdStore.ts` | localStorage data layer for the profile/auth prototype |

### 2.4 `src/data/`: content

| File | Holds |
|---|---|
| `careers.json` | Job openings |
| `posts.json` | Blog posts (block-based, CMS-ready) |
| `reviews.json` | Google rating summary and testimonials |
| `tlds.json` | Domain extensions and prices |

### 2.5 `public/`

| Path | Holds |
|---|---|
| `Assets/` | Logos, product images, client logos, hero photos (copied from the root `Assets/`) |
| `images/` | Photos and client website screenshots (`images/clients/`) |
| `fonts/` | The same seven `.woff2` files as the static site |
| `sw.js` | Service worker: caches `/offline` and serves it when a page can't load |
| `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` | Default Next.js starter files, unused |
| `images.jpeg`, `images (1).jpeg`, `images (2).jpeg` | Unnamed images, unused |

---

## 3. How the pieces fit

- **Styling.**
  - **New design:** values come from `src/app/tokens.css`, the colour, spacing and motion tokens with no prefix.
  - **Old design:** tokens prefixed `--kzd-*` come from the root `css/kzd-tokens.css`. They are still used by pages not yet restyled (careers detail, accounting, profile).
  - **Per page and per component:** each page and component has its own CSS Module.
- **Content.**
  - **Short page copy:** lives in a `content.ts` next to the page.
  - **Lists:** jobs, posts, reviews and TLDs live in `src/data/` and are read only through `src/lib/content.ts`.
- **Interactivity.**
  - **Server by default:** pages render on the server.
  - **Client components:** only the interactive parts are client components (files starting with `"use client"`).
- **Offline.**
  - **Losing connection mid-visit:** `OfflineGate` covers the page.
  - **Opening a page with no connection:** `sw.js` serves the cached `/offline` page. The service worker registers in production builds only.
- **SEO.**
  - **Per-page metadata:** every page exports a title, description and canonical URL.
  - **Hidden from search:** `/profile`, `/dev/tokens` and `/offline` are kept out of search.

## 4. Commands (run inside `kzd-next/`)

| Command | Does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run typecheck` | TypeScript check |

## 5. Known gaps

- **Forms only log:** the contact, accounting and notify forms log submissions; email delivery isn't connected yet.
- **Service pages not built:** `/services/website-development` and `/services/software` don't exist yet, so those links open the Development tab on `/services`.
- **Pages still to build:**
  - **Blog:** still a coming-soon page, and the case study buttons point to it.
  - **Hosting and domains:** also still coming-soon pages.
  - **Privacy Policy and Terms of Service:** these pages don't exist yet.
- **Missing link:** the YouTube icon still needs its URL.
