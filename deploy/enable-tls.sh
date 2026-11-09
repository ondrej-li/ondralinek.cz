#!/usr/bin/env bash
# One-off cutover step: request the Let's Encrypt certificate for the apex and
# switch the vhost to HTTPS. Run it only after ondralinek.cz resolves here.
#
#   ./deploy/enable-tls.sh
#
# Renewals afterwards are handled by certbot.timer; the global deploy hook
# reloads nginx.
set -euo pipefail

DOMAIN="ondralinek.cz"
REPO_DIR="${REPO_DIR:-$HOME/ondralinek.cz}"
WEB_ROOT="${WEB_ROOT:-/var/www/ondralinek}"
PUBLIC_IP="2.31.33.21"
PUBLIC_IP6="2a01:4f8:c016:e828::1"

cd "$REPO_DIR"

echo "==> checking DNS"
# Ask public resolvers: the local stub resolver may still hold an old answer
# while Let's Encrypt validates against public DNS. IPv6 matters: Let's Encrypt
# prefers AAAA, so a stale AAAA makes webroot validation fail even when A is
# correct.
v4=""
v6=""
for resolver in 1.1.1.1 8.8.8.8; do
    [ -n "$v4" ] || v4="$(dig +short +time=3 +tries=1 A "$DOMAIN" "@$resolver" | grep -E '^[0-9.]+$' | head -1)"
    [ -n "$v6" ] || v6="$(dig +short +time=3 +tries=1 AAAA "$DOMAIN" "@$resolver" | grep -E '^[0-9a-fA-F:]+$' | head -1)"
done
[ -n "$v4" ] || v4="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')"
echo "    A    -> ${v4:-nothing} (expected $PUBLIC_IP)"
echo "    AAAA -> ${v6:-nothing} (expected $PUBLIC_IP6, or none)"

if [ "$v4" != "$PUBLIC_IP" ]; then
    cat >&2 <<EOM
ERROR: $DOMAIN A record is ${v4:-nothing}, expected $PUBLIC_IP.
       Point the name at this server first (DNS is managed at WebSupport).
EOM
    exit 1
fi

if [ -n "$v6" ] && [ "$v6" != "$PUBLIC_IP6" ]; then
    cat >&2 <<EOM
ERROR: $DOMAIN AAAA record is $v6, but this server is $PUBLIC_IP6.
       Let's Encrypt prefers AAAA, so validation would go to the wrong host.
       Update the AAAA record at WebSupport (or remove it) and retry.
EOM
    exit 1
fi

echo "==> requesting certificate for $DOMAIN"
# Webroot mode: certbot drops the challenge into the site root, which the vhost
# already serves under /.well-known/acme-challenge/. No config rewriting, so the
# versioned vhost in this repo stays the single source of truth.
sudo certbot certonly --webroot -w "$WEB_ROOT" -d "$DOMAIN" --cert-name "$DOMAIN" \
    --non-interactive --agree-tos --deploy-hook "systemctl reload nginx"

echo "==> switching vhost to HTTPS"
sudo install -d -o deploy -g www-data -m 0755 "$WEB_ROOT"
sudo install -m 0644 -o root -g root deploy/nginx/ondralinek.conf /etc/nginx/sites-available/ondralinek
sudo ln -sfn /etc/nginx/sites-available/ondralinek /etc/nginx/sites-enabled/ondralinek
sudo nginx -t
sudo systemctl reload nginx

echo "==> verifying"
code="$(curl -sS -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/")"
echo "    https://$DOMAIN/ -> $code"
redirect="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$DOMAIN:80:127.0.0.1" "http://$DOMAIN/")"
echo "    http://$DOMAIN/ -> $redirect"
