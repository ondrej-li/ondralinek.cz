#!/usr/bin/env python3
"""Collect GitHub metadata for the repositories shown on the site.

Reads every ``repo: owner/name`` entry from data/*.yaml, asks the GitHub API
for the repository state and writes data/github.json for the Hugo templates.
The cache keeps ETags, so unchanged repositories come back as 304 responses and
do not consume the API rate limit.

Designed for the deploy timer: it never fails the build. If GitHub is down or
rate limited, the last good data (or nothing at all) is used and the site still
publishes.

Usage:
    python3 tools/fetch-github.py [--force] [--quiet]

Environment:
    GITHUB_TOKEN   optional, raises the rate limit from 60 to 5,000 requests/h
    GITHUB_CACHE   cache file (default: <repo>/.cache/github-cache.json)
    GITHUB_TTL     seconds before the cache is refreshed (default: 1800)
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUT_FILE = DATA_DIR / "github.json"
CACHE_FILE = Path(os.environ.get("GITHUB_CACHE", ROOT / ".cache" / "github-cache.json"))
TTL = int(os.environ.get("GITHUB_TTL", "1800"))
API = "https://api.github.com/repos/{}"

REPO_RE = re.compile(r"^\s*(?:-\s*)?repo:\s*[\"']?([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", re.MULTILINE)


def repositories() -> list[str]:
    repos: list[str] = []
    for path in sorted(DATA_DIR.glob("*.y*ml")):
        for repo in REPO_RE.findall(path.read_text(encoding="utf-8")):
            if repo not in repos:
                repos.append(repo)
    return repos


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def fetch(repo: str, cached: dict, token: str | None) -> dict | None:
    """Return the API object, or the cached copy when the request fails."""
    request = urllib.request.Request(
        API.format(repo),
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "ondralinek.cz-build",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    etag = cached.get("etag")
    if etag:
        request.add_header("If-None-Match", etag)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return {
                "etag": response.headers.get("ETag", ""),
                "data": payload,
            }
    except urllib.error.HTTPError as error:
        if error.code == 304:
            return {"etag": etag, "data": cached.get("data")}
        if error.code in (403, 429):
            raise RuntimeError(f"rate limited ({error.code})") from error
        if error.code == 404:
            raise RuntimeError("not found") from error
        raise
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise RuntimeError(f"network error: {error}") from error


def main() -> int:
    force = "--force" in sys.argv
    quiet = "--quiet" in sys.argv
    repos = repositories()
    if not repos:
        print("fetch-github: no repositories found in data/*.yaml", file=sys.stderr)
        return 0

    cache = load_json(CACHE_FILE)
    entries: dict[str, dict] = cache.get("repos", {})
    token = os.environ.get("GITHUB_TOKEN")
    refreshed_at = float(cache.get("refreshed_at", 0))
    fresh = not force and time.time() - refreshed_at < TTL

    out: dict[str, dict] = {}
    changed = False
    failure: str | None = None

    for repo in repos:
        cached = entries.get(repo, {})
        result = None if fresh and cached else None

        if not fresh or not cached:
            try:
                result = fetch(repo, cached, token)
                if result:
                    entries[repo] = result
                    changed = True
            except RuntimeError as error:
                failure = f"{repo}: {error}"
                if not quiet:
                    print(f"fetch-github: {failure}", file=sys.stderr)
                result = cached or None

        data = (result or cached).get("data")
        if not data:
            continue
        out[repo] = {
            "description": data.get("description") or "",
            "language": data.get("language") or "",
            "stars": data.get("stargazers_count", 0),
            "forks": data.get("forks_count", 0),
            "pushed_at": data.get("pushed_at") or "",
            "created_at": data.get("created_at") or "",
            "archived": bool(data.get("archived")),
            "html_url": data.get("html_url") or f"https://github.com/{repo}",
            "homepage": data.get("homepage") or "",
            "topics": data.get("topics") or [],
        }

    if changed:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(
            json.dumps({"refreshed_at": time.time(), "repos": entries}, indent=1),
            encoding="utf-8",
        )

    if out:
        OUT_FILE.write_text(
            json.dumps(
                {
                    "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "repos": out,
                },
                indent=1,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        if not quiet:
            print(f"fetch-github: wrote {len(out)} repositories to {OUT_FILE.relative_to(ROOT)}")
    else:
        print("fetch-github: no metadata available, leaving the site without it", file=sys.stderr)

    if failure and not quiet:
        print(f"fetch-github: last problem: {failure}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
