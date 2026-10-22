# AI Website Builder

A third KZD application, separate from both repos in `ARCHITECTURE.md`'s
"two-repository split" (website + FOSSBilling). Lets a visitor type a
one-line business description and get a real, editable, AI-generated
website in return — linked from the FOSSBilling homepage hero (`?prompt=`
handoff) and reachable directly at `/build`.

## ⚠️ Not in git at all — highest-priority gap in this whole project

Source lives at `kzd-ai-website-builder-app` (a sibling folder next to
wherever this repo is checked out locally). **It has no `.git` directory,
no remote, no commit history — nothing.** Every other KZD codebase
(website, FOSSBilling) has real git history and a GitHub remote; this one
exists only on whichever machine's disk it happens to be sitting on. It
also holds the **real** Groq and Pexels API keys in `server/.env` (not
committed anywhere either, so there's exactly one copy of them in
existence). Before any more work happens here: `git init`, create a
private GitHub repo, push it, and make sure `server/.env` is in
`.gitignore` before the first commit (check `.gitignore` — it should
already exclude `.env` at any depth, matching the pattern this project
uses elsewhere, but verify before committing given the keys are real).

## What it is

- **Frontend**: a single-file React 18 app (`src/App.jsx`, ~6,400 lines —
  everything: the whole state machine, every screen, and the app's CSS as
  one big template literal injected via `<style>{CSS}</style>`) built with
  Vite. No router — a `stage` state variable (`landing` → `drafting` →
  `building` → `blueprint` → `editor`) switches between screens.
- **Backend**: a small Express app (`server/index.js`) with exactly two
  jobs — proxy AI/photo requests to Groq and Pexels with the real API keys
  attached server-side (the frontend has no concept of a key at all, by
  design — see `deploy/DEPLOY.md`'s "What NOT to do"), and serve the built
  `dist/` frontend. Both are mounted under one path prefix so the whole
  thing drops into an existing site with a single reverse-proxy location
  block, not a new server/subdomain.
- **Model**: Groq (`openai/gpt-oss-120b`), not Gemini — switched early on
  because Gemini's free tier had a daily request ceiling low enough that
  one visitor could exhaust it, with no per-user quota to fall back on
  since the key is shared server-side across every visitor. Groq's free
  tier has a much higher ceiling and is OpenAI-compatible (drop-in request
  shape).

## Local dev deployment topology (this machine, right now)

This is **not** the production setup described in `deploy/DEPLOY.md`
(systemd + nginx) — it's a hand-assembled local equivalent, rebuilt from
scratch by hand every time Apache/MySQL/Node get restarted (this
environment doesn't persist running services between sessions):

1. **Build**: `cd kzd-ai-website-builder-app && npm run build` → `dist/`.
2. **Node proxy**: `cd server && node index.js` — listens on `:3001`,
   mounted at `/build` (per `server/.env`'s `BASE_PATH`), serves `dist/`
   directly from the source project folder (not copied anywhere).
3. **Apache**: `C:\laragon\bin\apache\...\conf\httpd.conf` has
   `mod_proxy`/`mod_proxy_http` enabled and
   `ProxyPass /build/ http://127.0.0.1:3001/build/` +
   `ProxyPassReverse` — the *entire* `/build/` prefix (static files and
   `/build/api/*` alike) is handed off to the Node process, matching
   `deploy/DEPLOY.md`'s reference `nginx-location.conf` exactly (same
   handoff pattern, different web server). Apache's own filesystem docroot
   never serves anything under `/build/` — a stale copy was also placed at
   `C:\laragon\www\fossbilling\build\` for consistency, but it's
   effectively dead weight now that the proxy intercepts the path first.
4. **Restarting after any rebuild**: `npm run build` again, then kill
   whatever's listening on port 3001 and start `node index.js` again — a
   fresh `dist/` isn't picked up otherwise. Killing by matching the exact
   port (e.g. `Get-NetTCPConnection -LocalPort 3001 -State Listen`) matters
   — a blunt `taskkill /IM node.exe /F` will also kill unrelated Node
   processes (e.g. a Playwright browser session) sharing the same machine.

Production deployment is whatever `deploy/DEPLOY.md` (inside the builder
app's own folder) says — that doc was written by whoever built this app
originally and wasn't touched this session; it's the source of truth for
the real server, not the local-dev steps above.

## What changed in this session

- **Deployed the already-written "skip the blueprint review screen"
  fix.** The fix itself pre-existed in `src/App.jsx` (a developer had
  already changed `draftBlueprint()` to go straight to `setStage(
  "building")` instead of stopping at the manual-review `blueprint`
  stage) but the *built* bundle being served predated that change — a
  stale `dist/` was deployed. Rebuilt from current source and redeployed;
  no source code change here, purely a stale-artifact fix.
- **Unified "drafting" and "building" into one full-bleed video loading
  screen.** Both stages used to render visibly different UI (a small
  framed card with a grid background, then a checklist rail + live
  preview) — since Groq responds in well under a second, that read as a
  broken flash of mismatched screens rather than one loading moment. Both
  stages now render the exact same `<Loading />` component: a single
  video (`public/loading.mp4`, a real Vite build asset) filling the whole
  content area below `TopBar`, no grid background, no checklist, no
  partial site preview. The old `Drafting`/`Building` components and their
  CSS were deleted outright, not just unused — including the live
  progressive-preview panel (`LivePreview` inside the old `Building`),
  which was arguably nicer UX than a static video but was explicitly
  traded away per direct request ("only show that video until the website
  is fully generated").
- **Video preload fix.** The video only started fetching once `Loading`
  actually mounted; on a cold cache that network+decode gap showed as the
  screen's plain navy background flashing behind it for a second or two
  before the first frame painted. Fixed with a second, permanently-mounted
  `<video preload="auto" style={{display:"none"}}>` in the top-level `App`
  render — starts buffering the moment the app loads (while a visitor is
  still typing their description), so by the time `Loading` needs to
  paint the real video it's already fully cached. Verified via
  `video.readyState`/`.buffered` that the whole clip buffers in ~3 seconds
  locally, comfortably before anyone finishes typing and clicks through.
- **Homepage chip auto-fill** — see `CUSTOMIZATIONS.md`'s "Homepage prompt
  bar" section; that fix lives in FOSSBilling's theme
  (`mod_index_dashboard.html.twig`), not this app, but is the entry point
  that hands off to `/build`.

## Known gaps / not done

- No git repo (see above — the actual priority item).
- No automated build/deploy pipeline for this app locally — every deploy
  this session was `npm run build` + manual file copy + manual server
  restart, done by hand each time. Worth a script at minimum.
- The rate-limit fallback (placeholder text + "Rewrite all" button when
  Groq's free-tier limit is hit) is stock behavior from whoever built this
  app, not something added this session — surfaced during testing (rapid
  repeated builds within a couple of minutes triggered it) but not
  investigated further since it's an existing, already-handled case, not
  a regression.
