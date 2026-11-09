#!/usr/bin/env bash
# Build the landing page and publish it to /var/www/ondralinek.
#
#   ./deploy/deploy.sh              # git pull + metadata + build + nginx config
#   SKIP_NGINX=1 ./deploy/deploy.sh # content only
#   SKIP_SYSTEMD=1 ./deploy/deploy.sh
#
# Runs on the VPS as the deploy user (member of sudo).
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/ondralinek.cz}"
WEB_ROOT="${WEB_ROOT:-/var/www/ondralinek}"
HUGO_VERSION="0.146.0"

cd "$REPO_DIR"

echo "==> fetching"
before="$(git rev-parse HEAD)"
git pull --ff-only
after="$(git rev-parse HEAD)"
# Bash reads this file incrementally, so never keep running a script that the
# pull just replaced: restart it once with the fresh copy.
if [ "$before" != "$after" ] && [ "${ONDRALINEK_DEPLOY_REEXEC:-0}" != "1" ]; then
    ONDRALINEK_DEPLOY_REEXEC=1 exec "$0" "$@"
fi

installed="$(hugo version | awk '{print $2}' | sed -E 's/^v//; s/-[0-9a-f]{7,}$//')"
if [ "$installed" != "$HUGO_VERSION" ]; then
    echo "ERROR: Hugo $installed is installed, but the build is verified against $HUGO_VERSION." >&2
    echo "       Install the pinned version or update this script deliberately." >&2
    exit 1
fi

# Repository metadata for the cards. Best-effort: a GitHub outage must not stop
# a deploy, and the templates omit the line when data/github.json is missing.
echo "==> collecting GitHub metadata"
python3 tools/fetch-github.py --quiet || echo "WARNING: metadata fetch failed, building without it" >&2

echo "==> building with hugo $installed"
rm -rf public
hugo --minify --cleanDestinationDir

echo "==> publishing to $WEB_ROOT"
sudo install -d -o deploy -g www-data -m 0755 "$WEB_ROOT"
# Keep the ACME challenge directory: certbot renewals write into it.
rsync -a --delete --exclude ".well-known/" public/ "$WEB_ROOT/"

if [ "${SKIP_NGINX:-0}" = "1" ]; then
    echo "==> nginx skipped (SKIP_NGINX=1)"
    exit 0
fi

echo "==> nginx configuration"
sudo install -m 0644 -o root -g root deploy/nginx/ondralinek-headers.conf /etc/nginx/snippets/ondralinek-headers.conf

if sudo test -f /etc/letsencrypt/live/ondralinek.cz/fullchain.pem; then
    sudo install -m 0644 -o root -g root deploy/nginx/ondralinek.conf /etc/nginx/sites-available/ondralinek
else
    sudo install -m 0644 -o root -g root deploy/nginx/ondralinek-http.conf /etc/nginx/sites-available/ondralinek
fi

sudo ln -sfn /etc/nginx/sites-available/ondralinek /etc/nginx/sites-enabled/ondralinek
sudo nginx -t
sudo systemctl reload nginx

if [ "${SKIP_SYSTEMD:-0}" != "1" ]; then
    echo "==> auto-deploy timer"
    changed=0
    for unit in ondralinek-autodeploy.service ondralinek-autodeploy.timer; do
        if ! sudo cmp -s "deploy/systemd/$unit" "/etc/systemd/system/$unit"; then
            sudo install -m 0644 -o root -g root "deploy/systemd/$unit" "/etc/systemd/system/$unit"
            changed=1
        fi
    done
    # Only reload when something actually changed: every daemon-reload
    # re-runs the system generators, and systemd-ssh-generator logs two
    # harmless AF_VSOCK errors each time on a box without a vsock device.
    if [ "$changed" = 1 ]; then sudo systemctl daemon-reload; fi
    # `systemctl enable` triggers a reload of its own, even when the unit is
    # already enabled and running, so only touch it when it is not.
    if ! systemctl is-enabled --quiet ondralinek-autodeploy.timer; then
        sudo systemctl enable --now ondralinek-autodeploy.timer >/dev/null
    elif ! systemctl is-active --quiet ondralinek-autodeploy.timer; then
        sudo systemctl start ondralinek-autodeploy.timer
    fi
fi

echo "==> done: $(find "$WEB_ROOT" -name '*.html' | wc -l) pages published"
