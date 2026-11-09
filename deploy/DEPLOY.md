# ondralinek.cz — deployment

Static Hugo site. nginx serves the files, the source lives in git and the VPS
publishes it. No PHP, no database, no build step outside Hugo.

| | |
|---|---|
| Host | `ondralinek.cz` (apex; `www` still 301s to `me.ondralinek.cz`) |
| Web root | `/var/www/ondralinek` (deploy:www-data) |
| Source checkout | `~/ondralinek.cz` (deploy user) |
| vhost | `/etc/nginx/sites-available/ondralinek` → `sites-enabled/ondralinek` |
| headers | `/etc/nginx/snippets/ondralinek-headers.conf` (HSTS + CSP + …) |
| TLS | `/etc/letsencrypt/live/ondralinek.cz/` |
| renewal | `certbot.timer`; deploy hook reloads nginx |
| logs | `/var/log/nginx/ondralinek.access.log`, `.error.log` |
| auto-deploy | `ondralinek-autodeploy.timer` (5 min) → `deploy/autodeploy.sh` |
| Hugo | pinned to **0.146.0**, same as the other sites on this box |

Everything nginx-related is versioned in this repository under `deploy/`; the
server copies are installed by `deploy/deploy.sh`.

## 1. DNS (do this first)

Managed at WebSupport. The apex currently has a mixed setup that must be fixed
before TLS can work:

| Type | Name | Value | Note |
|---|---|---|---|
| A | ondralinek.cz | `2.31.33.21` | already correct |
| AAAA | ondralinek.cz | `2a01:4f8:c016:e828::1` | **currently `2606:50c0:8000::153` (GitHub Pages) — change it** |

Let's Encrypt prefers AAAA, so leaving the GitHub Pages AAAA in place makes
webroot validation fail even though IPv4 is correct. `enable-tls.sh` refuses to
run while the records disagree with the server.

Mail records (MX, SPF, DKIM, DMARC) are untouched.

## 2. First deploy

```bash
# on the VPS, as deploy
git clone https://github.com/ondrej-li/ondralinek.cz.git ~/ondralinek.cz
cd ~/ondralinek.cz
./deploy/deploy.sh
```

That pulls, runs the GitHub metadata collector (best effort), builds with Hugo,
rsyncs `public/` into `/var/www/ondralinek`, installs the **HTTP** vhost (because
no certificate exists yet) and enables the auto-deploy timer.

Check it over HTTP:

```bash
curl -sSI http://ondralinek.cz/ | head -8
```

## 3. TLS

Once the A and AAAA records both point at this server:

```bash
cd ~/ondralinek.cz
./deploy/enable-tls.sh
```

It checks the records through public resolvers, requests the certificate with the
**webroot** authenticator (`-w /var/www/ondralinek`, so the versioned vhost is
never rewritten), installs `deploy/nginx/ondralinek.conf` and verifies both
schemes. Renewals are handled by `certbot.timer`; `deploy.sh` keeps the ACME
challenge directory intact.

## 4. Everyday updates

Push to `main` and wait up to five minutes:

```bash
git push origin main
```

`ondralinek-autodeploy.timer` → `deploy/autodeploy.sh`:

1. `git fetch`
2. new commit → `deploy/deploy.sh` (pull, metadata, build, rsync, reload if needed)
3. no new commit → no-op, except an hourly rebuild so the GitHub metadata and
   the `updated` dates on the cards stay current

Manual deploy on the server:

```bash
cd ~/ondralinek.cz
./deploy/deploy.sh                  # everything
SKIP_NGINX=1 ./deploy/deploy.sh     # content only
sudo systemctl start ondralinek-autodeploy.service   # deploy now, don't wait
journalctl -u ondralinek-autodeploy -n 100
systemctl list-timers ondralinek-autodeploy.timer
```

A failed deploy leaves the previous build live and mails the output to
`admin@ondralinek.cz` (at most once per commit per hour).

The web root is replaced with `rsync --delete`, so anything that must survive a
deploy belongs outside `/var/www/ondralinek` (except `.well-known/`, which is
excluded).

## 5. Verification

```bash
curl -sSI https://ondralinek.cz/ | head -12
curl -sSI https://ondralinek.cz/css/main.min.*.css | grep -i cache-control
curl -sSI http://ondralinek.cz/ | grep -i location        # -> https
curl -sS https://ondralinek.cz/ | grep -i content-security-policy
curl -sS https://ondralinek.cz/cs/ | grep -o '<html lang=[a-z]*>'
```

Expected: `200`, `Cache-Control: max-age=31536000` on the fingerprinted CSS/JS,
`301` to HTTPS on port 80, and a CSP without `unsafe-inline`.

## 6. Rollback

```bash
sudo systemctl disable --now ondralinek-autodeploy.timer
sudo git -C ~/ondralinek.cz checkout <previous-commit>
./deploy/deploy.sh
```

The vhost and timer scripts are in `deploy/`; removing
`/etc/nginx/sites-enabled/ondralinek` and reloading nginx takes the name out of
service without touching the other sites on the box.
