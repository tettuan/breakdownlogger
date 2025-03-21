#!/bin/bash

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get the latest commit hash
latest_commit=$(git rev-parse HEAD)

# Check GitHub Actions status
echo "Checking GitHub Actions status..."
gh run list --workflow=test.yml --limit=1 --json status,conclusion,headSha | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null

if [ $? -ne 0 ]; then
    echo "Error: Latest GitHub Actions workflow has not completed successfully."
    echo "Please ensure all tests pass before bumping version."
    exit 1
fi

# Read current version from deno.json
current_version=$(deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); console.log(config.version);")

# Split version into major.minor.patch
IFS='.' read -r major minor patch <<< "$current_version"

# Increment patch version
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

echo "Current version: $current_version"
echo "New version: $new_version"

# Update only the version in deno.json
deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$new_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"

# Commit the version change
git add deno.json
git commit -m "chore: bump version to $new_version"

# Create and push tag
git tag "v$new_version"
git push origin "v$new_version"

echo "Version bumped to $new_version and tag v$new_version created" 