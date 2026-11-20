#!/usr/bin/env bash
# Builds the site with real piece folders, which the normal build can't do
# until the collection has pieces. Checks that:
#   1. valid pieces bundle, their photos process, and each gets a prebuilt page
#      with its own title and link preview tags
#   2. a piece with problems stops the build, listing what to fix
#
# The test fixtures are copied in under smoke- names and removed on exit, even
# after a failure. Afterwards .next holds the smoke build; run npm run build
# again before next start.
set -euo pipefail

cd "$(dirname "$0")/.."

pieces=src/content/pieces
fixtures=src/lib/pieces/__fixtures__
copies=("$pieces/smoke-connie" "$pieces/smoke-georgian-tea-caddy" "$pieces/smoke-unfilled")

for copy in "${copies[@]}"; do
  if [ -e "$copy" ]; then
    echo "Smoke build: $copy already exists. Remove it and try again." >&2
    exit 1
  fi
done

cleanup() { rm -rf "${copies[@]}"; }
trap cleanup EXIT

fail() {
  echo "Smoke build failed: $1" >&2
  exit 1
}

echo "== Smoke build 1 of 2: valid pieces"
cp -R "$fixtures/connie" "$pieces/smoke-connie"
cp -R "$fixtures/georgian-tea-caddy" "$pieces/smoke-georgian-tea-caddy"
npx next build

pages=.next/server/app/collection
for slug in smoke-connie smoke-georgian-tea-caddy; do
  page="$pages/$slug.html"
  [ -f "$page" ] || fail "no prebuilt page for $slug"
  grep -q ' - Site Name</title>' "$page" || fail "$slug has no page title"
  grep -q 'property="og:title"' "$page" || fail "$slug has no og:title"
  grep -q 'name="twitter:card"' "$page" || fail "$slug has no twitter:card"
done
grep -q '<title>Georgian silver tea caddy - Site Name</title>' \
  "$pages/smoke-georgian-tea-caddy.html" ||
  fail "smoke-georgian-tea-caddy does not have its own title"

echo "== Smoke build 2 of 2: a piece left as the unfilled template"
cp -R "$pieces/_template" "$pieces/smoke-unfilled"
if output=$(npx next build 2>&1); then
  fail "the build passed with an unfilled piece"
fi
grep -q 'The collection has 6 problems:' <<<"$output" ||
  fail "the build failed, but not with the list of problems:
$output"
grep -q 'smoke-unfilled: title is required' <<<"$output" ||
  fail "the problems don't name the unfilled piece:
$output"

echo "Smoke build passed: valid pieces build, and a piece with problems stops the build."
