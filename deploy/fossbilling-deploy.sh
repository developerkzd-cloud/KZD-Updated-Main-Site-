#!/bin/bash
# Runs on the production server as /root/fossbilling-deploy.sh, triggered by
# .github/workflows/deploy.yml via a forced-command-restricted SSH key (see
# docs/DEPLOYMENT.md). This copy in the repo is the source of truth --
# if you change this file, copy it to /root/fossbilling-deploy.sh on the
# server too. The two fell out of sync once already (see docs/DEPLOYMENT.md's
# "Known incident" note), which is exactly the kind of drift keeping a repo
# copy is meant to prevent.
set -e
cd /www/wwwroot/my.kzdsolutions.co.za
echo "Pulling latest main..."
git pull origin main
echo "Clearing template cache..."
rm -rf data/cache/*
echo "Fixing cache ownership (web server runs as www, not root)..."
chown -R www:www data/cache
echo "Deploy complete: $(git rev-parse --short HEAD) at $(date)"
