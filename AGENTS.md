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
**current position**. The position card is rendered from `data/position.yaml`;
that file is the only place the job lives. It also feeds the `whoami` line in the
console and in ZX Spectrum BASIC.

**If Ondra forwards, pastes or describes an email that states his current
position — a new employer, a new title, a new start date, a move, or a correction
to any of those — treat it as a request to update this site.** Do not ask what to
do with it and do not summarise it back; apply it.

Steps:

1. Edit `data/position.yaml`:
   - `company`, `role.en` / `role.cs`, `since` (ISO date, `YYYY-MM-DD`; the first
     of the month is fine), `location.en` / `location.cs`, `summary.en` /
     `summary.cs`, and the `focus` bullets (0–3 is plenty).
   - Keep both languages in sync and match the existing voice: first person,
     plain sentences, no recruiter adjectives.
   - `url` stays empty unless the employer has a public site worth linking.
2. Set `updated:` to the date of the change (the email's date if it differs).
3. Only state what the email actually says. If the start date, location or scope
   is missing, keep the previous value or drop the field — never invent one.
4. Build, then check `/` and `/cs/`: the card must read correctly in both and the
   layout must still fit three columns (the card collapses to two columns under
   1180 px and to one under 860 px).
5. Commit with a message starting `Position: ` (for example
   `Position: move to Acme as staff engineer`), push to `main`, and tell Ondra
   what changed and that it is live within five minutes.

No service, inbox or registration is involved: the email is pasted into the
agent session by Ondra, and the result lands in git.

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
