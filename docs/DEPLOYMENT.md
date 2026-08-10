# Deployment

## Environments

| | Location | Notes |
|---|---|---|
| Local dev | Laragon, Windows, `fossbilling.test` | DB: `fossbilling_v085`. See the PHP-installs note in `ARCHITECTURE.md`. |
| Production | Contabo VPS (aaPanel), `/www/wwwroot/my.kzdsolutions.co.za` | `my.kzdsolutions.co.za` |

## Branch strategy

- **`main`** — production. Every push here is what's live (or about to be,
  via the deploy workflow — see below).
- **`develop`** — active development. All day-to-day work happens here;
  merge to `main` only when ready to ship.

## Automated deployment

`.github/workflows/deploy.yml`. Two triggers:

- **Scheduled**: nightly at 2:00 AM SAST (`0 0 * * *` UTC).
- **Manual**: `workflow_dispatch` — trigger from the GitHub Actions tab
  ("Run workflow" button) or `gh workflow run deploy.yml`.

**What it does**: SSHes into the production server and runs
`/root/fossbilling-deploy.sh`, which does `git pull origin main` +
`rm -rf data/cache/*` (clears Twig's compiled-template cache — necessary,
otherwise template changes don't take effect even after the code updates).

**What it deliberately does NOT do**: touch the database. Every database
change made during this project (invoice numbering, product description
text, new product rows, email template content) needed a human sanity-check
first — checking product titles matched before a `WHERE title = ...`
update, checking no real invoices existed past a number before resetting a
counter, etc. Automating that at 2 AM unattended is a different risk
category than deploying code. Database changes stay a manual, deliberate
step — see "Applying database changes" below.

### Security model — two separate restricted credentials

This was set up carefully specifically because unrestricted deploy
credentials are a real risk (full server compromise if a GitHub secret ever
leaks). Two keys, each scoped as narrowly as possible:

1. **GitHub Actions → server** (`DEPLOY_SSH_KEY` secret): an SSH key added
   to the server's `~/.ssh/authorized_keys` with a **forced command**
   restriction:
   ```
   command="/root/fossbilling-deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...
   ```
   Whatever command GitHub Actions tries to send over this connection is
   **ignored** — the server always runs `fossbilling-deploy.sh` regardless,
   and nothing else. Even if this private key leaks, whoever has it gets
   *only* "trigger this one deploy script," not a shell, not file access,
   not any other command.
2. **Server → GitHub** (for `git pull` itself): a **read-only, repo-scoped
   GitHub Deploy Key** (not a personal access token). Registered directly
   on this repo (`gh repo deploy-key add`), so even if this key's private
   half is ever exposed, it can only read this one repo's code — no push
   access, no access to any other repo, nothing account-wide.

Secrets configured on the GitHub repo (`gh secret list`): `DEPLOY_HOST`,
`DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_SSH_KEY`.

### Server-side setup reference

If this ever needs to be rebuilt from scratch (new server, lost key, etc.):

1. Generate a fresh keypair for the forced-command deploy key, add its
   public half to `~/.ssh/authorized_keys` on the server with the
   `command="..."` restriction shown above, and set its private half as the
   `DEPLOY_SSH_KEY` GitHub secret.
2. Generate a second, separate keypair for git-pull auth. Register its
   public half as a **read-only** GitHub Deploy Key on this repo. Put its
   private half on the server (e.g. `/root/.ssh/github_fossbilling_readonly`,
   `chmod 600`).
3. **Watch for existing `Host github.com` blocks in `~/.ssh/config`** — SSH
   uses first-match-wins, so if there's already a block for plain
   `github.com` (there was, from an earlier/different deploy key setup),
   appending another one is silently ignored. Use a distinct host alias
   instead:
   ```
   Host github.com-fossbilling
       HostName github.com
       User git
       IdentityFile /root/.ssh/github_fossbilling_readonly
       IdentitiesOnly yes
   ```
   and point the repo's remote at the alias, not plain `github.com`:
   ```
   git remote set-url origin git@github.com-fossbilling:developerkzd-cloud/KZD-Fossbilling.git
   ```
4. Create `/root/fossbilling-deploy.sh` (see the script content referenced
   in the forced-command line above — `cd` to the site root, `git pull
   origin main`, clear `data/cache/*`, echo a status line), `chmod +x` it.
5. Test end-to-end **before** wiring up GitHub Actions:
   ```
   ssh -i <forced-command-key> -o IdentitiesOnly=yes user@host "anything"
   ```
   The command you pass doesn't matter — the forced command runs
   regardless. You should see the deploy script's real output.

## Applying database changes (manual, every time)

The `themes/kzd/data-seeds/` scripts are written to be re-run against any
environment — each has a PDO connection string at the top with local dev's
credentials as a placeholder, meant to be edited before running elsewhere:

```bash
cd /www/wwwroot/my.kzdsolutions.co.za
nano themes/kzd/data-seeds/<script>.php   # edit the DB connection line
php themes/kzd/data-seeds/<script>.php
```

Current scripts: `create_hosting_products.php`, `create_business_email_products.php`,
`rebrand_service_emails.php`. See each one's entry in
`themes/kzd/data-seeds/README.md` for what it does. Some database changes
(one-off SQL updates like the storage-allocation text fix) were applied
directly via SQL rather than a script, when the change was a single
targeted `UPDATE` not worth building a script around — those are documented
in the same README and in `CUSTOMIZATIONS.md`, not automated anywhere.

**Before running any script against production**: check its assumptions
still hold (e.g. product titles match what a `WHERE title = ...` clause
expects, no real data would collide with what's being inserted). This isn't
optional — every DB step during this project's actual production deploy
involved checking `SELECT` output first.

## First-time server setup (if starting from an un-tracked directory)

If the production directory was never a git repo (e.g. code was originally
uploaded via FTP/file manager, as this one was):

```bash
git config --global --add safe.directory /path/to/site   # if "dubious ownership" error
git init
git remote add origin <repo-url>
git fetch origin
git reset --mixed origin/main   # updates git's bookkeeping WITHOUT touching any files on disk
git status                       # now shows real diffs: modified/deleted/untracked, safe to review
```

**Do not run `git checkout main` directly on an untracked directory** — git
will refuse to touch *any* file that exists in the target commit, even ones
that are byte-identical, because there's no common ancestor to diff
against. That looks like a wall of "would be overwritten" errors and is not
a real conflict — it's just git being maximally cautious on an unborn
branch. `git reset --mixed` sidesteps this because it only touches the
index, never the working tree, so you get an honest picture before
touching anything.

Once `git status` shows a manageable list, bring files up to date
selectively (`git checkout origin/main -- <specific files>`) rather than a
blanket checkout — some files may have *genuine* server-side differences
worth reviewing first (this happened with the OpenProvider adapter files —
turned out to be line-ending noise, see `HOSTAFRICA.md`, but don't assume
that without checking `git diff -w` first).
