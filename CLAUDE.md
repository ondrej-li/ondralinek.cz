# CLAUDE.md — ondralinek.cz

**Read [`AGENTS.md`](AGENTS.md) first.** It is the canonical guide for this
repository: the site in one paragraph, the build commands, the house rules, and
the "current position" workflow that an email about where Ondra is triggers. It is
kept up to date deliberately; this file only adds the parts an agent needs that
live outside it, and duplicates as little as possible.

## What this is

A bilingual static Hugo site (English default, Czech under `/cs/`), served from
the VPS at **ondralinek.cz**. The homepage is one template over `data/*.yaml`; git
is the source of truth and the box rebuilds within five minutes of a push to
`main`.

## Layout (the short version)

| Path | What |
|---|---|
| `hugo.toml` | config: languages, `disableKinds = ["taxonomy","term","RSS"]`, params |
| `layouts/` | the single-page template and its partials |
| `data/` | every piece of content: position, projects, links, CV data |
| `assets/`, `resources/` | CSS/JS pipelines and Hugo's generated resources |
| `tools/fetch-github.py` | refreshes `data/github.json` (best effort; the site renders without it) |
| `deploy/` | nginx vhost + headers, `deploy.sh`, `autodeploy.sh` (the VPS timer) |
| `AGENTS.md`, `.github/copilot-instructions.md` | the canonical agent instructions |

## Build and check

```sh
make build      # python3 tools/fetch-github.py --quiet || true; hugo --minify
make dev        # live preview on :1313
```

CI (`.github/workflows/ci.yml`, `ubuntu-latest`) runs the same build with Hugo
**0.146.0** pinned, plus `compileall` over `tools/`. A local Hugo is for previewing
only — you do not need one installed to get a change published.

## Deploy

`ondralinek-autodeploy.timer` on `deploy@ondralinek.cz` pulls `main` every five
minutes, renders with Hugo and publishes to `/var/www/ondralinek`. Pushing to
`main` is the deploy.

## What this file deliberately does not repeat

House rules, the position workflow, the CSP constraints and the content
conventions are in [`AGENTS.md`](AGENTS.md). If they ever disagree, `AGENTS.md`
wins — and the disagreement should be fixed rather than lived with.

## Before this site goes live

This repository is served publicly at https://ondralinek.cz. A change that adds or alters a
page, a form, a script, a header or a vhost passes the launch gate before it
ships:

```sh
web-launch-check https://ondralinek.cz
```

- `FAIL` blocks the publish; `WARN` is a decision to state in the reply, not
  something to leave unmentioned.
- The `web-launch-checklist` skill has the 25 items the checker cannot judge:
  privacy and terms content, colour contrast, real-device speed, spam
  protection, analytics and error monitoring, one clear call to action, and the
  signup/login/reset flows.
- Run it again after publishing: it checks the live vhost, headers and
  certificate, not the working tree.
- A preview vhost passes the same gate before DNS moves.

## Deploying this site

https://ondralinek.cz is published by the **deploy** account from this repository's
`main` branch — the `site-deploy` timer, every five minutes. Merge is
deploy: there is no publish command, and `sudo vps-site publish` refuses this
web root (one writer per root, and it is not this account).

Verify after merging, and give it up to ten minutes:

```sh
site-status --site ondralinek
curl -fsS https://ondralinek.cz/deployed.json           # {"commit": "...", "deployed_at": "..."}
git -C ~/repos/ondralinek.cz rev-parse origin/main
```

The three commits must match. If it has not moved after two timer cycles, read
`journalctl -u site-deploy -n 50`, report the commit that should be live and the
one that is, and do not rsync into `/var/www` or edit a live file to compensate.
The `static-site-deploy` skill has the full procedure.
