# Handoff: KZD website + FOSSBilling merge

Written for whoever picks this project up next. Last updated 2026-10-22.

**Read the "Before you push to GitHub" section before running any `git push`.**
Nothing from this round of work has been committed or pushed yet; the owner
asked that nothing be committed until they say the round of updates is done.

---

## 1. What this repo is

| Part | Folder | What it does | Local URL |
|---|---|---|---|
| Marketing site | `kzd-next/` (Next.js 16, React 19, CSS Modules) | kzdsolutions.co.za: home, services, hosting, domains, AI builder pages | http://localhost:3000 |
| Billing portal | `fossbilling/` (PHP 8.3, FOSSBilling, `kzd` theme). **A nested git repo with its own `.git`.** | my.kzdsolutions.co.za: login, signup, order, checkout, client dashboard, invoices | http://localhost:8080 |
| AI website builder | separate folder `C:\Users\hands\Downloads\kzd-ai-website-builder-app` (Vite + Express). Its built files are also copied to `fossbilling/build/`. | Generates sites from a prompt. kzd-next serves it at `/build` through a rewrite | http://localhost:3001/build |
| Old static site | repo root (`index.html`, `css/`, `js/`) | Superseded by kzd-next. Ignore it, but `kzd-next/src/app/globals.css` still imports `css/kzd-tokens.css` | n/a |

The upgraded design lives in `kzd-next/src/components/KzdHome/`. It's a port of
the FOSSBilling homepage design (`fossbilling/themes/kzd/html_custom/mod_index_dashboard.html.twig`)
and is used by `/services/ai-builder`, `/hosting` and every `/domains/*` page.

### How the two sites talk to each other
- `kzd-next/src/lib/kzd-integration.ts` reads `FOSSBILLING_ORIGIN` from the env
  `NEXT_PUBLIC_FOSSBILLING_ORIGIN`. Every Login, Register, Order, domain search
  and "Get started" link uses it.
- `kzd-next/next.config.ts` rewrites `/build/*` to `BUILDER_ORIGIN` (the builder)
  and redirects `/order` to FOSSBilling (the builder's Publish button uses a relative `/order`).
- FOSSBilling sends people back to the marketing site through the theme setting
  **`kzd_site_url`** (Admin, Appearance, kzd theme settings, "KZD Solutions website URL").
  Every logo, "Back to homepage" and breadcrumb "Home" link uses it.
  Locally it is `http://localhost:3000`; set it to `https://kzdsolutions.co.za` on live.
  The saved value is in the DB table `extension_meta` (row with `rel_type='settings'`, `rel_id='kzd'`).

---

## 2. Running it locally (Windows)

Nothing auto-starts. Start all four:

```
# 1. MySQL 8.4.3, using the existing Laragon data dir C:\laragon\data\mysql (DB fossbilling_v085)
C:\kzdtools\mysql\bin\mysqld.exe --defaults-file=C:\kzdtools\my.ini

# 2. FOSSBilling on :8080 (run from the fossbilling folder)
cd C:\kzdsite\KZD-Website-Updates-main\fossbilling
C:\kzdtools\php\php.exe -c C:\kzdtools\php\php.ini -S localhost:8080 router.php

# 3. AI builder on :3001
cd C:\Users\hands\Downloads\kzd-ai-website-builder-app\server
node index.js

# 4. Marketing site on :3000
cd C:\kzdsite\KZD-Website-Updates-main\kzd-next
npm run dev
```

Notes:
- PHP's built-in server handles one request at a time, so portal pages can take about 10 seconds locally. That's expected.
- PHP's CA bundle is `C:\kzdtools\ssl\cacert.pem` (copied from Git for Windows). Without it every HTTPS call (HostAfrica, Paystack, Google) fails.
- After editing any `.twig` file, clear `fossbilling/data/cache/*` or the old template keeps rendering.
- CSS/JS in the theme are cache-busted with `?v=` in `themes/kzd/html/layout_default.html.twig` and `layout_public.html.twig`. Bump it when you change those files.

### Local-only switches (must NOT go to production)
| Where | Setting | Why |
|---|---|---|
| `fossbilling/config.php` | `'kzd_simulate_domain_lookup' => true` | Domain search answers without HostAfrica (their API rejects IPs not on the reseller whitelist). Brands like google/amazon and names of 1 or 2 letters come back taken, everything else available. **Remove on live.** |
| `fossbilling/config.php` | `'url' => 'localhost:8080/'`, `path_data`/`cache` pointing at `C:/kzdsite/...` | Local paths. Live needs its own config. |
| `kzd-next/.env.local` | `NEXT_PUBLIC_FOSSBILLING_ORIGIN=http://localhost:8080`, `BUILDER_ORIGIN=http://localhost:3001` | Without the file, production defaults (`https://my.kzdsolutions.co.za`) are used. |
| DB `extension_meta` kzd settings | `kzd_site_url = http://localhost:3000` | Change to `https://kzdsolutions.co.za` on live. |

---

## 3. Before you push to GitHub (read this)

Secrets that exist on this machine, and where they are:

| Secret | Location | Protected by |
|---|---|---|
| DB password, encryption salt, all FOSSBilling settings | `fossbilling/config.php` | `fossbilling/.gitignore` (`/config.php`) |
| Groq + Pexels API keys (AI builder) | `kzd-ai-website-builder-app/server/.env` | That app's `.gitignore`. This folder is NOT inside this repo; keep it that way or keep `.env` ignored |
| HostAfrica reseller API key, Paystack keys, Google OAuth secret, SMTP password | FOSSBilling **database** (`fossbilling_v085`) | Never export the DB into the repo. No `.sql` dumps in git |
| Local env | `kzd-next/.env.local` | `kzd-next/.gitignore` (`.env*`) |
| Logs (can contain emails, IPs, stack traces) | `fossbilling/data/log/*` | `fossbilling/.gitignore` |

Checklist before every push:
1. `git status` in **both** the repo root and `fossbilling/` (it is a separate repo). Read the file list.
2. Confirm none of these show up: `config.php`, any `.env*` other than `.env.example`, `*.sql`, `data/log`, `data/cache`, `data/uploads`, `*.pem`, `*.key`.
3. Grep what you are about to commit:
   `git diff --cached | grep -nE "gsk_|sk_live_|sk_test_|pk_live_|GOCSPX-|BEGIN .*PRIVATE KEY|password\s*=>"`
   Anything found: unstage it.
4. Never use `git add -A` or `git add .` blindly in `fossbilling/`. Add paths explicitly.
5. If a secret is ever pushed: rotate it first (HostAfrica, Paystack, Groq, Pexels, Google), then clean history. Deleting the file in a new commit does not remove it from history.
6. Known existing item: `contact.html` (old static site) contains a Google Maps browser key `AIzaSyCA56...`. It is a public embed key, but restrict it to `kzdsolutions.co.za` under HTTP referrers in Google Cloud Console.
7. The owner's rule: do not commit or push until the owner says the round of updates is finished.

---

## 4. What was done this round

- **Design merge:** `/services/ai-builder`, `/hosting`, `/domains/register|transfer|pricing|tld-extensions` now use the FOSSBilling homepage design (`components/KzdHome/`). Old navy page files were deleted.
- **AI builder** integrated at `/build` (rewrite) and verified generating a full site from the hero prompt.
- **FOSSBilling bugs fixed** (in all three local copies: this repo, `C:\laragon\www\fossbilling`, `C:\Users\hands\Downloads\fossbilling\fossbilling`):
  - Login/signup crashed: template called `guest.google_oauth_enabled()`; now `guest.client_google_oauth_enabled()`.
  - `FOSSBilling\Security\GoogleOAuth` was missing from `vendor/composer/autoload_static.php` and `autoload_classmap.php`; added. **If you ever run `composer dump-autoload` this is regenerated correctly anyway.**
  - Session cookie `SameSite=Strict` logged clients out when they came back from Paystack; now `Lax` (`library/FOSSBilling/Session.php`).
  - "Continue with Google" is always shown (no keys yet: clicking it says sign-in with Google is not available).
  - Domain search shows "Unavailable" + other endings when the registrar lookup fails, instead of the raw server error.
  - Auth pages: removed the big empty space above the form.
  - Every logo / Back to homepage / breadcrumb Home goes to the marketing site (`kzd_site_url`).
  - Dashboard nav link goes to the dashboard when logged in, to login when not.
  - Portal Register button text centred.
  - Client dashboard: `mod_index_dashboard.html.twig` loaded ~1,550 lines of public-homepage CSS for logged-in clients too (it restyled "New Order"). That `<style>` block is now guest-only (`{% if not client %}`). New dashboard polish block at the end of `kzd-overrides.css` (uniform 44px pill buttons, white card headers, spacing under the header). **Not visually verified while logged in** (no test account was used). Check it in a browser after logging in.
  - Homepage font: Hanken Grotesk replaced by Inter Tight in the FOSSBilling homepage template, matching kzd-next.
- **Copy rule:** no em or en dashes in any visitor-facing text (owner's rule). Use full stops, commas, colons, or "to".

---

### Health check at handoff (2026-10-22)
- All four services up: marketing :3000, builder :3001 (also via :3000/build), FOSSBilling :8080, MySQL.
- `kzd-next`: `tsc --noEmit` clean, `eslint src` clean.
- Link crawl of 140 pages across both sites (logged out): no 404/500. Every route referenced by the portal templates answers 200 or redirects to login. (`invoice/banklink` and `support/ticket` only 404 without the id the templates always append.)
- Logged-in pages (dashboard, invoices, services) were NOT crawled; no test account was used.

## 5. Still to do (pick up here)

See the "Open items" list at the bottom of this file; it is kept current.

## Open items

- [ ] **HostAfrica IP whitelist.** Real domain search needs the server's public IP added in HostAfrica (Domains Reseller, API settings). Local PC IP was `197.184.89.29`. Then remove `kzd_simulate_domain_lookup` from `config.php`.
- [ ] **Google sign-in keys.** Create an OAuth client (Google Cloud, Credentials, Web application). Redirect URIs: `http://localhost:8080/client/google-callback` and `https://my.kzdsolutions.co.za/client/google-callback`. Paste ID + secret in FOSSBilling System Settings.
- [ ] **Domain registration after payment** still calls HostAfrica (blocked locally). Not simulated.
- [ ] **Session length:** portal logins last max 2 hours (`security.session_lifespan` in config.php) and end when the browser fully closes. Owner asked for logins to be remembered; decide whether to raise this.
- [ ] **Marketing site header** shows Login/Register even when logged into the portal (separate origins). Needs a small cross-site "who am I" endpoint if wanted.
- [ ] **Guests opening the portal root `/`** see FOSSBilling's own public homepage (a duplicate of the marketing design). Consider redirecting guests to `kzd_site_url` or `/login`.
- [ ] **Deploy:** live my.kzdsolutions.co.za still runs the old FOSSBilling. Deploying this `fossbilling/` folder + DB changes + builder is a separate, careful task (backup first).
