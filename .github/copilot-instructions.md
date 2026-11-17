# Copilot instructions for ondralinek.cz

Read [`AGENTS.md`](../AGENTS.md) first — it holds the build commands, the house
rules and the workflows for this repository.

The one rule that matters most: **if the user shares an email or message that
states where he is** — a city, region, country, address, coordinates, "remote",
or a correction — treat it as a request to update the "Current position" card.
Edit `data/position.yaml` **only**: `location` in both languages, `coords`
(optional), `note` (optional) and the `updated` timestamp. Build, commit with a
`Position: ` prefix, push to `main`; the auto-deploy timer publishes within five
minutes.

Only that card changes — never rewrite the hero, About copy, project sections or
any other content around it. It is a geographic position, not a CV: employers and
titles do not belong in it. `location` is free text, so keep the email's own
wording; if the email gives only coordinates, use them as the location text too
and never reverse-geocode from memory; if it gives only a place name, delete
`coords`.
