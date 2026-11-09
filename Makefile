PORT ?= 1313

.PHONY: dev build clean

# Local preview. The metadata fetch is best-effort: the site renders without it.
dev:
	python3 tools/fetch-github.py --quiet || true
	hugo server --port $(PORT) --bind 127.0.0.1 --disableFastRender --renderToMemory

build:
	python3 tools/fetch-github.py --quiet || true
	hugo --minify --cleanDestinationDir

clean:
	rm -rf public resources/_gen .hugo_build.lock
