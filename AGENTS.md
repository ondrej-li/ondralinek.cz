# AGENTS.md — working on ondralinek.cz

Instructions for coding agents (Copilot, Claude Code, Codex, anything that reads
`AGENTS.md`). Humans can read it too; everything here is how the site is meant to
be maintained.

## The site in one paragraph

Static Hugo site, bilingual (English default, Czech under `/cs/`), served from a
single VPS. The homepage is one template over `data/*.yaml`. There is no CMS and
no database; git is the source of truth and the server rebuilds within five
minutes of every push to `main` (`ondralinek-autodeploy.timer`).

## Build and check

```bash
hugo --minify --cleanDestinationDir   # production build in public/
hugo server --port 1313               # live preview
```

There is no test suite. Before finishing a change: build, open the page in a
browser, and check both languages (`/` and `/cs/`). Keep the CSP in
`deploy/nginx/ondralinek-headers.conf` satisfied: no inline `style="…"`, no inline
`<script>` bodies beyond what already exists, everything else from `self`.

## Current position — email means "update this"

The About section has three columns: **about**, **get in touch** and
**current position**. The third one is where Ondra is, right now: a small
OpenStreetMap tile map with a marker, the place name, the coordinates and an
`updated` stamp. It is rendered
from `data/position.yaml`, and the same file feeds the `whoami` line in the
console and in ZX BASIC.

**If Ondra forwards, pastes or describes an email that states where he is —
a city, a region, a country, an address, coordinates, "remote", or a correction
to any of those — treat it as a request to update this card.** Do not ask what
to do with it and do not summarise it back. Apply it and report what changed.

### Change only the position, never the rest of the page

A position email is not a request to touch anything else. Leave the hero, the
About copy, the sites, apps and tools sections, the contact details, the CV link
and every other i18n string exactly as they are. The only file that should change
is `data/position.yaml`. Do not rewrite, reflow or "improve" the page around it.
The card is about geography only — it is not a job history, so an employer or a
title in the email does not belong in this file.

### What the email can contain

- **Place** — `location.en` / `location.cs`. Any granularity: `Prague`,
  `Prague, Czechia`, `Praha 2`, `Czechia`, `Central Europe`, `Remote`. Keep the
  email's own wording; do not upgrade "Czechia" to "Prague" or the reverse, and
  do not invent a city for a country or the other way round.
- **Coordinates** — `coords.lat` / `coords.lon`, decimal degrees, south and west
  negative. They draw the marker on the map; without them the card shows the
  place and a search link only.
- **A sentence** — `note.en` / `note.cs`, optional, for something like "here for
  a week". Short, plain, first person.
- **Timestamp** — `updated`, a full ISO timestamp (`2026-11-16T20:14:00+01:00`),
  shown as `updated 2026-11-16 20:14`. Always bump it.

### Coordinates

- If the email gives coordinates, store them and keep a readable string in
  `location`.
- If the email gives **only** coordinates, put the same coordinate string in
  `location.en` and `location.cs`. Never reverse-geocode from memory.
- If the email gives only a place name, **delete** `coords` rather than leaving
  a stale marker.

### Steps

1. Edit `data/position.yaml` as above. Touch nothing else.
2. Build and check `/` and `/cs/`: the marker must sit on the right spot, the
   place must read correctly in both languages, and the card must still fit the
   third column (it collapses to two columns under 1180 px, one under 860 px).
3. Commit with a message starting `Position: ` (for example
   `Position: in Brno for the week`), push to `main`, and tell Ondra what
   changed and that the timer publishes it within five minutes.

Nothing outside git is involved: the email is pasted into the agent session and
the result lands as a commit. No inbox, no service, no registration.

## House rules

- Copy is written in English and Czech together; never add a string to one
  language only. UI strings live in `i18n/{en,cs}.toml`, project copy inline in
  the data files.
- The dark, grid-based design is deliberate: keep the palette variables in
  `assets/css/main.css`, don't introduce frameworks or webfonts.
- The console (`assets/js/terminal.js`, `assets/js/zx.js`) must keep working in
  both modes; `help`, `ls`, `cd`, `cat` and the ZX BASIC interpreter are part of
  the site.
- Deployment details are in `deploy/DEPLOY.md`; don't hand-edit files under
  `/var/www` — they are replaced by `rsync --delete` on every deploy.
