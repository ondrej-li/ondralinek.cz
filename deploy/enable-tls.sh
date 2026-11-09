#!/usr/bin/env bash
# One-off cutover step: request the Let's Encrypt certificate for the apex and
# www, then switch the vhost to HTTPS. Run it only after both names resolve here.
#
#   ./deploy/enable-tls.sh
#   ./deploy/enable-tls.sh --dry-run     # staging validation, no cert saved
#
# Set SKIP_DNS_CHECK=1 to test validation while a record is temporarily wrong.
# Renewals afterwards are handled by certbot.timer; the global deploy hook
# reloads nginx.
set -euo pipefail

DOMAIN="ondralinek.cz"
WWW="www.ondralinek.cz"
REPO_DIR="${REPO_DIR:-$HOME/ondralinek.cz}"
WEB_ROOT="${WEB_ROOT:-/var/www/ondralinek}"
PUBLIC_IP="2.31.33.21"
PUBLIC_IP6="2a01:4f8:c016:e828::1"
MODE="${1:-}"

cd "$REPO_DIR"

check_record() {
    local type="$1" name="$2" value=""
    for resolver in 1.1.1.1 8.8.8.8; do
        value="$(dig +short +time=3 +tries=1 "$type" "$name" "@$resolver" | grep -E '^[0-9a-fA-F:.]+$' | head -1)"
        [ -n "$value" ] && break
    done
    printf '%s' "$value"
}

if [ "${SKIP_DNS_CHECK:-0}" != "1" ]; then
    echo "==> checking DNS"
    # Ask public resolvers: the local stub resolver may still hold an old answer
    # while Let's Encrypt validates against public DNS. IPv6 matters: Let's
    # Encrypt prefers AAAA, so a stale AAAA makes webroot validation fail even
    # when A is correct.
    v4="$(check_record A "$DOMAIN")"
    v4www="$(check_record A "$WWW")"
    v6="$(check_record AAAA "$DOMAIN")"
    v6www="$(check_record AAAA "$WWW")"
    echo "    A    $DOMAIN    -> ${v4:-nothing} (expected $PUBLIC_IP)"
    echo "    A    $WWW -> ${v4www:-nothing} (expected $PUBLIC_IP)"
    echo "    AAAA $DOMAIN    -> ${v6:-nothing} (expected $PUBLIC_IP6, or none)"
    echo "    AAAA $WWW -> ${v6www:-nothing} (expected $PUBLIC_IP6, or none)"

    if [ "$v4" != "$PUBLIC_IP" ] || [ "$v4www" != "$PUBLIC_IP" ]; then
        cat >&2 <<EOM
ERROR: both names must have A $PUBLIC_IP.
       Fix the records at WebSupport and retry.
EOM
        exit 1
    fi

    if [ -n "$v6" ] && [ "$v6" != "$PUBLIC_IP6" ]; then
        cat >&2 <<EOM
ERROR: $DOMAIN AAAA is $v6, but this server is $PUBLIC_IP6.
       Let's Encrypt prefers AAAA, so validation would go to the wrong host.
       Change the AAAA at WebSupport to $PUBLIC_IP6 (or remove it) and retry.
EOM
        exit 1
    fi

    if [ -n "$v6www" ] && [ "$v6www" != "$PUBLIC_IP6" ]; then
        cat >&2 <<EOM
ERROR: $WWW AAAA is $v6www, but this server is $PUBLIC_IP6.
       Change the AAAA at WebSupport to $PUBLIC_IP6 (or remove it) and retry.
EOM
        exit 1
    fi
else
    echo "==> DNS check skipped (SKIP_DNS_CHECK=1)"
fi

echo "==> requesting certificate for $DOMAIN + $WWW"
# Webroot mode: certbot drops the challenge into the site root, which the vhost
# already serves under /.well-known/acme-challenge/. No config rewriting, so the
# versioned vhost in this repo stays the single source of truth.
extra=()
if [ "$MODE" = "--dry-run" ]; then
    extra+=(--dry-run)
    echo "    (dry run: staging CA, nothing is saved)"
fi
sudo certbot certonly --webroot -w "$WEB_ROOT" -d "$DOMAIN" -d "$WWW" --cert-name "$DOMAIN" \
    --non-interactive --agree-tos --deploy-hook "systemctl reload nginx" "${extra[@]}"

if [ "$MODE" = "--dry-run" ]; then
    echo "==> dry run complete"
    exit 0
fi

echo "==> switching vhost to HTTPS"
sudo install -d -o deploy -g www-data -m 0755 "$WEB_ROOT"
sudo install -m 0644 -o root -g root deploy/nginx/ondralinek.conf /etc/nginx/sites-available/ondralinek
sudo ln -sfn /etc/nginx/sites-available/ondralinek /etc/nginx/sites-enabled/ondralinek
sudo nginx -t
sudo systemctl reload nginx

echo "==> verifying"
for name in "$DOMAIN" "$WWW"; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --resolve "$name:443:127.0.0.1" "https://$name/")"
    echo "    https://$name/ -> $code"
    redirect="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$name:80:127.0.0.1" "http://$name/")"
    echo "    http://$name/ -> $redirect"
done
