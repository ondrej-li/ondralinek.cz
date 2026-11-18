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
