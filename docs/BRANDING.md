# Branding

## Brand color

`#2946f3` (a blue-violet), same value used on the marketing website
(`kzdsolutions-website/style.css`) — this is meant to be one visual
identity across both properties, not two separately-tuned palettes.

## Two separate override stylesheets — don't confuse them

FOSSBilling has two independent themes (client-facing and admin), each
built on a **different CSS framework**, each with its own override file:

| | Framework | CSS variable prefix | Override file |
|---|---|---|---|
| Client theme (`themes/kzd/`) | Bootstrap 5.3 (via Huraga) | `--bs-*` | `themes/kzd/assets/build/css/kzd-overrides.css` |
| Admin theme (`themes/admin_default/`) | Tabler | `--tblr-*` | `themes/admin_default/assets/build/css/kzd-admin-overrides.css` |

Both work the same way: loaded via a `<link>` tag **after** the compiled
theme CSS, so they cascade on top without touching the actual build output.
Both re-point the framework's *base* color tokens (`--bs-primary` /
`--tblr-primary` and their `-rgb`, `-fg`, `-lt`, `-bg-subtle`,
`-border-subtle`, `-text-emphasis` siblings) rather than trying to override
every individual component class — both frameworks derive nearly everything
(buttons, nav-pills, focus rings, pagination) from those base tokens via
`var()`, so this one override cascades correctly through the whole theme.

**Both are scoped for light AND dark mode**, using `:root, [data-bs-theme=light]`
for light and `[data-bs-theme=dark]` for dark — note that in this codebase,
**light mode is the absence of the `data-bs-theme` attribute**, not an
explicit `data-bs-theme="light"` value (confirmed by reading the actual
theme-toggle JS in each layout file). If you add a new override rule and
only scope it to `[data-bs-theme=light]`, it will silently never apply in
the default (light, no-attribute) case — this exact bug happened once
already with the admin brand-name text color; use a `:root` fallback like
the existing rules do.

## ⚠️ The admin override file's `.gitignore` trap

`themes/admin_default/.gitignore` contains a single line: `build`. That
excludes the **entire** `assets/build/` directory — including
`kzd-admin-overrides.css`, the one hand-maintained file in there. (The
client theme, `themes/kzd/`, has no such `.gitignore` at all, so this
asymmetry is easy to not notice.)

Attempts to fix this with a `.gitignore` negation pattern (`!build/css/`
etc.) **did not work as expected** — git's "can't re-include a child of an
excluded directory" rule fought back and at one point silently un-ignored
the *entire* build directory (including files that should never be
tracked, like the compiled `fossbilling.css`/`vendor.css`). The working
fix: leave `.gitignore` exactly as-is, and `git add -f` the one file
whenever it changes. Once a file is tracked, gitignore no longer affects
it — you only need `-f` the first time and after any accidental untracking.

If you ever add *another* hand-maintained file under `themes/admin_default/assets/`,
remember to force-add it too, or it will silently never make it into git.

## Company logo / name display

`partial_company_logo.html.twig` exists in **two different forms**:

- `themes/kzd/html/partial_company_logo.html.twig` — the client theme's own
  version, already supports a `show_name` parameter (renders the company
  name as a `<span>` next to the logo).
- `themes/admin_default/html_custom/partial_company_logo.html.twig` — a
  KZD-added override mirroring the same `show_name` feature for the admin
  theme, since the *stock* admin version only ever falls back to a
  text-only name when there's no logo configured at all — with a real logo
  set, the name would never render otherwise. This is why the admin
  dashboard originally showed only the logo image with no "KZD Solutions"
  text next to it.

## Email branding

Covered in `themes/kzd/email-templates/README.md`, including which
templates are branded vs. deliberately left stock and why. The visual
system there (email-card, header, body, footer, brand navy `#000d51` for
headings, brand blue for CTA buttons) is independent of the site
theme CSS — email clients don't load external stylesheets reliably, so
every branded template embeds its own `<style>` block.

## What's still stock / generic

- The email **signature** (`company_signature` system setting) appearing at
  the bottom of every email is still FOSSBilling's generic default text
  ("kzdsolutions.co.za - Client Management, Invoicing and Support
  Software"). This is a one-setting content change, not a code change —
  intentionally left for the project owner to decide the actual wording
  rather than have that invented for them.
