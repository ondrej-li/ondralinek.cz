# ondralinek.cz

Landing page for the things I run: the live sites, the iOS/macOS apps and the
open-source tools. Static [Hugo](https://gohugo.io/) site, bilingual (English by
default, Czech under `/cs/`), served from a single VPS.

| | |
|---|---|
| Live | <https://ondralinek.cz> and <https://www.ondralinek.cz> |
| Host | `ondralinek.cz` + `www.ondralinek.cz` |
| Source | <https://github.com/ondrej-li/ondralinek.cz> |
| Stack | Hugo 0.146.0, plain CSS, ~40 lines of vanilla JS |
| Deploy | git push → systemd timer → Hugo → `/var/www/ondralinek` |

## Local preview

```bash
make dev          # http://127.0.0.1:1313
```

`make dev` refreshes the GitHub metadata first (best effort) and then starts
`hugo server`. For a production build:

```bash
make build        # output in public/
```

Hugo 0.146.0 is the version the server runs; install exactly that version
(`brew install hugo` or a release tarball) if you want the build to match.

## Editing the content

The page is one template over four data files. No content files to keep in sync.

| File | What it holds |
|---|---|
| `data/apps.yaml` | App cards: name, platforms, status, links, app icon, screenshot |
| `data/sites.yaml` | Site rows: domain, name, description, tech |
| `data/oss.yaml` | Open-source cards |
| `data/github.json` | Generated at build time by `tools/fetch-github.py` (gitignored) |
| `i18n/en.toml`, `i18n/cs.toml` | Every piece of UI copy, both languages |
| `content/en/_index.md`, `content/cs/_index.md` | Home pages (title only) |

Project copy is stored inline in the data files under `en:` and `cs:` keys, so a
new project is one YAML block with both languages next to each other.

Colours come from `data-accent="blue|sky|red|green|cyan|lime|grey|yellow"`
attributes mapped to CSS variables in `assets/css/main.css`.

### GitHub metadata

`tools/fetch-github.py` reads every `repo: owner/name` from `data/*.yaml`, asks
the GitHub API for stars, language and the last push, and writes
`data/github.json`. The app and OSS cards show the last push date; the line is
omitted when the file is missing, so a build without network still works.

* The cache is `.cache/github-cache.json`; ETags make unchanged requests free
  against the rate limit.
* Set `GITHUB_TOKEN` to raise the limit (60 → 5,000 requests/hour).
* Set `GITHUB_TTL` to change the 30-minute cache lifetime.
* The server refreshes this hourly even when nothing was pushed, so repository
  changes show up without editing the site.

## Structure

```
assets/css/main.css        the whole design (dark, grid-based, no frameworks)
assets/js/main.js          scroll reveal + mobile menu
assets/images/apps/        optimised app icons (WebP)
assets/images/shots/       optimised screenshots (WebP)
content/{en,cs}/_index.md  home pages
data/                      projects and generated GitHub metadata
deploy/                    nginx, systemd, deploy + TLS scripts for the VPS
i18n/                      English and Czech UI strings
layouts/                   base template, home page, 404, partials
static/                    favicon, Apple touch icon, Open Graph image, robots.txt
tools/fetch-github.py      GitHub metadata collector
```

## Deployment

Detailed steps, DNS requirements and the rollback procedure are in
[deploy/DEPLOY.md](deploy/DEPLOY.md). In short:

```bash
# on the VPS, as deploy
git clone https://github.com/ondrej-li/ondralinek.cz.git ~/ondralinek.cz
cd ~/ondralinek.cz
./deploy/deploy.sh        # first publish, installs the HTTP vhost + timer
./deploy/enable-tls.sh    # certbot + HTTPS vhost, once DNS points here
```

After that every push to `main` is picked up within five minutes by
`ondralinek-autodeploy.timer`; a failure leaves the previous build live and is
mailed to `admin@ondralinek.cz`.

## Notes

* `www.ondralinek.cz` now serves this landing page too (same content, canonical
  to the apex). The personal site stays at `me.ondralinek.cz`.
* The apex currently has an `AAAA` record pointing at GitHub Pages. It must be
  changed to `2a01:4f8:c016:e828::1` before `enable-tls.sh` will run — see
  [deploy/DEPLOY.md](deploy/DEPLOY.md).
* The TLS certificate covers both `ondralinek.cz` and `www.ondralinek.cz`.
