# Copilot instructions for ondralinek.cz

Read [`AGENTS.md`](../AGENTS.md) first — it holds the build commands, the house
rules and the workflows for this repository.

The one rule that matters most: **if the user shares an email or message that
states his current position** (new employer, new title, new start date, new
location, or a correction), update `data/position.yaml` — company, role in both
languages, `since`, location, summary, focus — bump `updated`, build, commit with
a `Position: ` prefix and push to `main`. The server's auto-deploy timer publishes
it within five minutes. Do not ask for confirmation first, and do not invent
details the message does not contain.
