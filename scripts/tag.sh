#!/bin/bash

# Get version from deno.json
VERSION=$(deno eval "console.log(JSON.parse(Deno.readTextFileSync('deno.json')).version)")

# Create and push tag
git tag "v${VERSION}"
git push origin "v${VERSION}"

echo "Created and pushed tag v${VERSION}" 